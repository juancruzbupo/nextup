import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SpotifyService } from '../spotify/spotify.service';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';

@Injectable()
export class SongWatcherService {
  private readonly logger = new Logger(SongWatcherService.name);
  private currentTracks = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly spotify: SpotifyService,
    private readonly queueService: QueueService,
    private readonly gateway: QueueGateway,
  ) {}

  @Cron('*/10 * * * * *')
  async watchAllBars() {
    const bars = await this.prisma.bar.findMany({
      where: {
        spotifyRefreshToken: { not: null },
        active: true,
      },
    });

    await Promise.all(bars.map((bar) => this.watchBar(bar.id)));
  }

  private async watchBar(barId: string) {
    try {
      const current = await this.spotify.getCurrentTrack(barId);

      if (!current) return;

      const previousTrackId = this.currentTracks.get(barId);

      if (previousTrackId && previousTrackId !== current.trackId) {
        this.logger.debug(`Track changed for bar ${barId}: ${previousTrackId} → ${current.trackId}`);

        await this.queueService.markAsPlayed(previousTrackId, barId);
        await this.enqueueNextSong(barId);

        const queue = await this.queueService.getQueue(barId);
        this.gateway.emitQueueUpdate(barId, queue);
      }

      this.currentTracks.set(barId, current.trackId);
    } catch (error) {
      this.logger.debug(`Watch failed for bar ${barId}: ${error}`);
    }
  }

  private async enqueueNextSong(barId: string) {
    const nextSong = await this.queueService.getNextSong(barId);
    if (!nextSong) return;

    try {
      await this.spotify.addToQueue(barId, nextSong.spotifyUri);
      this.logger.debug(`Enqueued "${nextSong.title}" for bar ${barId}`);
    } catch (error) {
      this.logger.debug(`Failed to enqueue next song for bar ${barId}: ${error}`);
    }
  }
}
