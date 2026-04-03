import { Body, Controller, Delete, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { SpotifyService } from '../spotify/spotify.service';

@Controller('queue')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly gateway: QueueGateway,
    private readonly spotify: SpotifyService,
  ) {}

  @Get(':barId')
  getQueue(@Param('barId') barId: string) {
    return this.queueService.getQueue(barId);
  }

  @Post(':barId/add')
  async addSong(
    @Param('barId') barId: string,
    @Body() body: { spotifyId: string; spotifyUri: string; title: string; artist: string; albumArt?: string },
    @Headers('x-session-id') sessionId: string,
  ) {
    const result = await this.queueService.addSong(barId, body, sessionId);
    if (!result.alreadyExists) {
      const queue = await this.queueService.getQueue(barId);
      this.gateway.emitQueueUpdate(barId, queue);
    }
    return result;
  }

  @Get(':barId/search')
  search(@Param('barId') barId: string, @Query('q') query: string) {
    return this.spotify.searchTracks(barId, query);
  }

  @Get(':barId/now-playing')
  nowPlaying(@Param('barId') barId: string) {
    return this.spotify.getCurrentTrack(barId);
  }

  @Post(':barId/skip')
  async skip(@Param('barId') barId: string) {
    await this.spotify.skipTrack(barId);
    return { ok: true };
  }

  @Delete(':barId/songs/:songId')
  async deleteSong(@Param('barId') barId: string, @Param('songId') songId: string) {
    await this.queueService.deleteSong(songId);
    const queue = await this.queueService.getQueue(barId);
    this.gateway.emitQueueUpdate(barId, queue);
    return { ok: true };
  }

  @Get(':barId/history')
  getHistory(@Param('barId') barId: string) {
    return this.queueService.getHistory(barId);
  }

  @Get(':barId/stats')
  getStats(@Param('barId') barId: string) {
    return this.queueService.getStats(barId);
  }
}
