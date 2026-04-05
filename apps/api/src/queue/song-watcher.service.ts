import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpotifyService } from '../spotify/spotify.service';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { REDIS_CLIENT } from '../redis/redis.module';
import type Redis from 'ioredis';
import type { CurrentTrack } from '@nextup/types';

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 200;

@Injectable()
export class SongWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SongWatcherService.name);
  // In-memory fallback when Redis unavailable
  private currentTracks = new Map<string, string>();
  private enqueuedSongs = new Map<string, string>();
  // Cursor-based pagination: rotate through venues/events across poll cycles
  private venueCursor: string | undefined;
  private eventCursor: string | undefined;
  private running = true;
  private pollTimeout: ReturnType<typeof setTimeout> | null = null;
  private pollResolve: (() => void) | null = null;
  private pollPromise: Promise<void> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly spotify: SpotifyService,
    private readonly queueService: QueueService,
    private readonly gateway: QueueGateway,
    @Inject(REDIS_CLIENT) @Optional() private readonly redis: Redis | null,
  ) {}

  private async getTrack(key: string): Promise<string | undefined> {
    if (this.redis) { try { return (await this.redis.hget('watcher:tracks', key)) ?? undefined; } catch {} }
    return this.currentTracks.get(key);
  }

  private async setTrack(key: string, value: string) {
    if (this.redis) { try { await this.redis.hset('watcher:tracks', key, value); return; } catch {} }
    this.currentTracks.set(key, value);
  }

  private async deleteTrack(key: string) {
    if (this.redis) { try { await this.redis.hdel('watcher:tracks', key); return; } catch {} }
    this.currentTracks.delete(key);
  }

  private async getEnqueued(key: string): Promise<string | undefined> {
    if (this.redis) { try { return (await this.redis.hget('watcher:enqueued', key)) ?? undefined; } catch {} }
    return this.enqueuedSongs.get(key);
  }

  private async setEnqueued(key: string, value: string) {
    if (this.redis) { try { await this.redis.hset('watcher:enqueued', key, value); return; } catch {} }
    this.enqueuedSongs.set(key, value);
  }

  private async deleteEnqueued(key: string) {
    if (this.redis) { try { await this.redis.hdel('watcher:enqueued', key); return; } catch {} }
    this.enqueuedSongs.delete(key);
  }

  onModuleInit() {
    this.pollPromise = this.startPolling();
  }

  async onModuleDestroy() {
    this.running = false;
    if (this.pollTimeout) clearTimeout(this.pollTimeout);
    if (this.pollResolve) this.pollResolve();
    if (this.pollPromise) await this.pollPromise;
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

  /** Process items in batches to avoid saturating DB connections */
  private async processBatched<T>(
    items: T[],
    handler: (item: T) => Promise<number>,
  ): Promise<number[]> {
    const results: number[] = [];
    for (let i = 0; i < items.length && this.running; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map((item) => handler(item)),
      );
      for (const r of batchResults) {
        results.push(r.status === 'fulfilled' ? r.value : 5000);
      }
      // Delay between batches to spread DB load
      if (i + BATCH_SIZE < items.length && this.running) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }
    return results;
  }

  private async pollAllVenues(): Promise<number> {
    try {
      const bars = await this.prisma.venue.findMany({
        where: { spotifyRefreshToken: { not: null }, active: true },
        select: { id: true },
        take: 50,
        orderBy: { id: 'asc' },
        ...(this.venueCursor ? { cursor: { id: this.venueCursor }, skip: 1 } : {}),
      });

      // If cursor returned nothing, reset to start
      if (bars.length === 0 && this.venueCursor) {
        this.venueCursor = undefined;
        return 2000; // Quick retry from start
      }
      if (bars.length === 0) return 10000;

      // Advance cursor for next cycle
      this.venueCursor = bars.length < 50 ? undefined : bars[bars.length - 1].id;

      const results = await this.processBatched(bars, (bar) =>
        this.watchVenue(bar.id),
      );

      const valid = results.filter((r) => r > 0);
      return valid.length > 0 ? Math.min(...valid) : 4000;
    } catch (error) {
      this.logger.error(`pollAllVenues failed: ${error}`);
      return 5000;
    }
  }

  private async watchVenue(venueId: string): Promise<number> {
    try {
      const current = await this.spotify.getCurrentTrack(venueId);

      if (!current) {
        await this.deleteTrack(venueId);
        return 10000;
      }

      const previousTrackId = await this.getTrack(venueId);
      let queueChanged = false;

      const markedPlaying = await this.queueService.markAsPlayed(current.trackId, venueId);
      if (markedPlaying) {
        this.logger.log(`Now playing from queue: "${current.name}" at bar ${venueId}`);
        await this.deleteEnqueued(venueId);
        queueChanged = true;
      }

      if (previousTrackId && previousTrackId !== current.trackId) {
        this.logger.log(`Track changed at bar ${venueId}: → ${current.name}`);
        await this.deleteEnqueued(venueId);
        queueChanged = true;
      }

      const remainingMs = current.durationMs - current.progressMs;
      if (remainingMs < 30000) {
        await this.ensureNextSongQueued(venueId, current.trackId);
      }

      if (queueChanged) {
        const queue = await this.queueService.getQueue(venueId);
        this.gateway.emitQueueUpdate(venueId, queue);
      }

      if (!previousTrackId || previousTrackId !== current.trackId) {
        this.gateway.emitNowPlaying(venueId, current);
      }

      await this.setTrack(venueId, current.trackId);

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
    if (nextSong.spotifyId === currentTrackId) return;
    if ((await this.getEnqueued(venueId)) === nextSong.spotifyId) return;

    try {
      await this.spotify.addToQueue(venueId, nextSong.spotifyUri);
      await this.setEnqueued(venueId, nextSong.spotifyId);
      this.logger.log(`Queued "${nextSong.title}" in Spotify for bar ${venueId}`);
    } catch (error) {
      this.logger.error(`Failed to queue song for bar ${venueId}: ${error}`);
    }
  }

  // ─── Event watching ───

  private async pollAllEvents(): Promise<number> {
    try {
      const now = new Date();
      await this.prisma.event.updateMany({
        where: { active: true, endsAt: { lt: now } },
        data: { active: false },
      });

      const events = await this.prisma.event.findMany({
        where: { spotifyRefreshToken: { not: null }, active: true, endsAt: { gt: now } },
        select: { id: true },
        take: 50,
        orderBy: { id: 'asc' },
        ...(this.eventCursor ? { cursor: { id: this.eventCursor }, skip: 1 } : {}),
      });

      // Reset cursor if end of list
      this.eventCursor = events.length < 50 ? undefined : events[events.length - 1]?.id;

      if (events.length === 0) {
        // Cleanup stale event entries from Maps
        for (const key of this.currentTracks.keys()) {
          if (key.startsWith('event:')) this.currentTracks.delete(key);
        }
        for (const key of this.enqueuedSongs.keys()) {
          if (key.startsWith('event:')) this.enqueuedSongs.delete(key);
        }
        return 10000;
      }

      const results = await this.processBatched(events, (e) =>
        this.watchEvent(e.id),
      );

      const valid = results.filter((r) => r > 0);
      return valid.length > 0 ? Math.min(...valid) : 5000;
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
      const previousTrackId = await this.getTrack(prevKey);
      let changed = false;

      const song = await this.prisma.eventSong.findFirst({
        where: { eventId, spotifyId: current.trackId, played: false },
      });
      if (song) {
        await this.prisma.eventSong.update({ where: { id: song.id }, data: { played: true, playedAt: new Date() } });
        await this.deleteEnqueued(prevKey);
        changed = true;
      }

      if (previousTrackId && previousTrackId !== current.trackId) {
        await this.deleteEnqueued(prevKey);
        changed = true;
      }

      const remainingMs = current.durationMs - current.progressMs;
      if (remainingMs < 30000) {
        const nextSong = await this.prisma.eventSong.findFirst({
          where: { eventId, played: false },
          orderBy: [{ votes: 'desc' }, { createdAt: 'asc' }],
        });
        if (nextSong && nextSong.spotifyId !== current.trackId && (await this.getEnqueued(prevKey)) !== nextSong.spotifyId) {
          try {
            await this.spotify.addToQueueForEvent(eventId, nextSong.spotifyUri);
            await this.setEnqueued(prevKey, nextSong.spotifyId);
          } catch {}
        }
      }

      if (changed) {
        const queue = await this.prisma.eventSong.findMany({
          where: { eventId, played: false },
          orderBy: [{ votes: 'desc' }, { createdAt: 'asc' }],
          take: 200,
        });
        this.gateway.server.of('/events').to(eventId).emit('queue-updated', { queue });
      }

      if (!previousTrackId || previousTrackId !== current.trackId) {
        this.gateway.server.of('/events').to(eventId).emit('now-playing-changed', { track: current });
      }

      await this.setTrack(prevKey, current.trackId);

      if (remainingMs < 10000) return 1500;
      if (remainingMs < 20000) return 3000;
      return 5000;
    } catch (error) {
      this.logger.error(`Watch failed for event ${eventId}: ${error}`);
      return 5000;
    }
  }
}
