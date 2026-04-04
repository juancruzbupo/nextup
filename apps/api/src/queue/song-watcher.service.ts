import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpotifyService } from '../spotify/spotify.service';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import type { CurrentTrack } from '@nextup/types';

@Injectable()
export class SongWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SongWatcherService.name);
  private currentTracks = new Map<string, string>();
  private enqueuedSongs = new Map<string, string>();
  private running = true;
  private pollTimeout: ReturnType<typeof setTimeout> | null = null;
  private pollResolve: (() => void) | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly spotify: SpotifyService,
    private readonly queueService: QueueService,
    private readonly gateway: QueueGateway,
  ) {}

  onModuleInit() {
    this.startPolling();
  }

  onModuleDestroy() {
    this.running = false;
    if (this.pollTimeout) clearTimeout(this.pollTimeout);
    if (this.pollResolve) this.pollResolve();
  }

  private async startPolling() {
    while (this.running) {
      const [venueDelay, eventDelay] = await Promise.all([
        this.pollAllVenues(),
        this.pollAllEvents(),
      ]);
      const nextPollMs = Math.min(venueDelay, eventDelay);
      await new Promise<void>((resolve) => {
        this.pollResolve = resolve;
        this.pollTimeout = setTimeout(resolve, nextPollMs);
      });
    }
  }

  private async pollAllVenues(): Promise<number> {
    try {
      const bars = await this.prisma.venue.findMany({
        where: { spotifyRefreshToken: { not: null }, active: true },
      });

      if (bars.length === 0) return 10000; // No active bars, slow poll

      const results = await Promise.all(
        bars.map((bar) => this.watchVenue(bar.id)),
      );

      // Adaptive: use the shortest delay from any bar
      const minDelay = Math.min(...results.filter((r) => r > 0));
      return minDelay || 4000;
    } catch (error) {
      this.logger.error(`pollAllVenues failed: ${error}`);
      return 5000;
    }
  }

  // Returns the recommended next poll delay for this bar (ms)
  private async watchVenue(venueId: string): Promise<number> {
    try {
      const current = await this.spotify.getCurrentTrack(venueId);

      if (!current) {
        // Nothing playing — slow poll
        this.currentTracks.delete(venueId);
        return 10000;
      }

      const previousTrackId = this.currentTracks.get(venueId);
      let queueChanged = false;

      // Mark the currently-playing track as played if it's in our queue
      const markedPlaying = await this.queueService.markAsPlayed(current.trackId, venueId);
      if (markedPlaying) {
        this.logger.log(`Now playing from queue: "${current.name}" at bar ${venueId}`);
        this.enqueuedSongs.delete(venueId);
        queueChanged = true;
      }

      // Detect track change
      if (previousTrackId && previousTrackId !== current.trackId) {
        this.logger.log(`Track changed at bar ${venueId}: → ${current.name}`);
        this.enqueuedSongs.delete(venueId);
        queueChanged = true;
      }

      // Queue next voted song when near end of current track (last 30s)
      // Earlier queuing gives Spotify time to pre-load for gapless playback
      const remainingMs = current.durationMs - current.progressMs;
      if (remainingMs < 30000) {
        await this.ensureNextSongQueued(venueId, current.trackId);
      }

      // Emit updates via WebSocket
      if (queueChanged) {
        const queue = await this.queueService.getQueue(venueId);
        this.gateway.emitQueueUpdate(venueId, queue);
      }

      // Emit now-playing on track change so frontend updates instantly
      if (!previousTrackId || previousTrackId !== current.trackId) {
        this.gateway.emitNowPlaying(venueId, current);
      }

      this.currentTracks.set(venueId, current.trackId);

      // Adaptive poll: faster when track is near end
      if (remainingMs < 10000) return 1500;
      if (remainingMs < 20000) return 3000;
      return 5000;
    } catch (error) {
      this.logger.error(`Watch failed for bar ${venueId}: ${error}`);
      return 5000;
    }
  }

  private async ensureNextSongQueued(venueId: string, currentTrackId: string) {
    const nextSong = await this.queueService.getNextSong(venueId);
    if (!nextSong) return;

    // Don't queue the song that's currently playing
    if (nextSong.spotifyId === currentTrackId) return;

    // Don't re-queue if we already sent this song
    if (this.enqueuedSongs.get(venueId) === nextSong.spotifyId) return;

    try {
      await this.spotify.addToQueue(venueId, nextSong.spotifyUri);
      this.enqueuedSongs.set(venueId, nextSong.spotifyId);
      this.logger.log(`Queued "${nextSong.title}" in Spotify for bar ${venueId}`);
    } catch (error) {
      this.logger.error(`Failed to queue song for bar ${venueId}: ${error}`);
    }
  }

  // ─── Event watching ───

  private async pollAllEvents(): Promise<number> {
    try {
      const now = new Date();
      // Auto-deactivate expired events
      await this.prisma.event.updateMany({
        where: { active: true, endsAt: { lt: now } },
        data: { active: false },
      });

      const events = await this.prisma.event.findMany({
        where: { spotifyRefreshToken: { not: null }, active: true, endsAt: { gt: now } },
      });

      if (events.length === 0) return 10000;

      const results = await Promise.all(
        events.map((e) => this.watchEvent(e.id)),
      );

      const minDelay = Math.min(...results.filter((r) => r > 0));
      return minDelay || 5000;
    } catch (error) {
      this.logger.error(`pollAllEvents failed: ${error}`);
      return 10000;
    }
  }

  private async watchEvent(eventId: string): Promise<number> {
    try {
      const current = await this.spotify.getCurrentTrackForEvent(eventId);
      if (!current) return 10000;

      const prevKey = `event:${eventId}`;
      const previousTrackId = this.currentTracks.get(prevKey);
      let changed = false;

      // Mark current track as played if in queue
      const song = await this.prisma.eventSong.findFirst({
        where: { eventId, spotifyId: current.trackId, played: false },
      });
      if (song) {
        await this.prisma.eventSong.update({ where: { id: song.id }, data: { played: true } });
        this.enqueuedSongs.delete(prevKey);
        changed = true;
      }

      if (previousTrackId && previousTrackId !== current.trackId) {
        this.enqueuedSongs.delete(prevKey);
        changed = true;
      }

      // Queue next song near end of track
      const remainingMs = current.durationMs - current.progressMs;
      if (remainingMs < 30000) {
        const nextSong = await this.prisma.eventSong.findFirst({
          where: { eventId, played: false },
          orderBy: [{ votes: 'desc' }, { createdAt: 'asc' }],
        });
        if (nextSong && nextSong.spotifyId !== current.trackId && this.enqueuedSongs.get(prevKey) !== nextSong.spotifyId) {
          try {
            await this.spotify.addToQueueForEvent(eventId, nextSong.spotifyUri);
            this.enqueuedSongs.set(prevKey, nextSong.spotifyId);
          } catch {}
        }
      }

      // Emit via WebSocket — we don't have EventsGateway injected directly,
      // so we use the gateway registered in the IoAdapter
      if (changed) {
        const queue = await this.prisma.eventSong.findMany({
          where: { eventId, played: false },
          orderBy: { votes: 'desc' },
        });
        // Gateway will be used via the queue module's export — for now emit through venue gateway's server
        // This is a simplification; for full separation, EventsGateway should be injected
        this.gateway.server.of('/events').to(eventId).emit('queue-updated', { queue });
      }

      if (!previousTrackId || previousTrackId !== current.trackId) {
        this.gateway.server.of('/events').to(eventId).emit('now-playing-changed', { track: current });
      }

      this.currentTracks.set(prevKey, current.trackId);

      if (remainingMs < 10000) return 1500;
      if (remainingMs < 20000) return 3000;
      return 5000;
    } catch (error) {
      this.logger.error(`Watch failed for event ${eventId}: ${error}`);
      return 5000;
    }
  }
}
