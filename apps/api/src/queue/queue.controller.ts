import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { SpotifyService } from '../spotify/spotify.service';
import { VenueAdminGuard } from '../auth/venue-admin.guard';

@Controller('queue')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly gateway: QueueGateway,
    private readonly spotify: SpotifyService,
  ) {}

  @Get(':venueId')
  getQueue(@Param('venueId') venueId: string) {
    return this.queueService.getQueue(venueId);
  }

  @Post(':venueId/add')
  async addSong(
    @Param('venueId') venueId: string,
    @Body() body: { spotifyId: string; spotifyUri: string; title: string; artist: string; albumArt?: string },
    @Req() req: any,
  ) {
    // sessionId from httpOnly cookie (set by SessionMiddleware), fallback to header
    const sessionId = req.sessionId || req.headers['x-session-id'];
    if (!sessionId) return { ok: false, error: 'No session' };
    const result = await this.queueService.addSong(venueId, body, sessionId);
    if (!result.alreadyExists) {
      const queue = await this.queueService.getQueue(venueId);
      this.gateway.emitQueueUpdate(venueId, queue);
    }
    return result;
  }

  @Get(':venueId/search')
  search(@Param('venueId') venueId: string, @Query('q') query: string) {
    return this.spotify.searchTracks(venueId, query);
  }

  @Get(':venueId/now-playing')
  nowPlaying(@Param('venueId') venueId: string) {
    return this.spotify.getCurrentTrack(venueId);
  }

  @Post(':venueId/skip')
  @UseGuards(VenueAdminGuard)
  async skip(@Param('venueId') venueId: string) {
    await this.spotify.skipTrack(venueId);
    return { ok: true };
  }

  @Post(':venueId/play/:songId')
  @UseGuards(VenueAdminGuard)
  async playSong(@Param('venueId') venueId: string, @Param('songId') songId: string) {
    const song = await this.queueService.findSong(songId);
    if (!song || song.venueId !== venueId) return { ok: false, error: 'SONG_NOT_FOUND' };
    const result = await this.spotify.playTrack(venueId, song.spotifyUri);
    return result;
  }

  @Delete(':venueId/songs/:songId')
  @UseGuards(VenueAdminGuard)
  async deleteSong(@Param('venueId') venueId: string, @Param('songId') songId: string) {
    await this.queueService.deleteSong(songId);
    const queue = await this.queueService.getQueue(venueId);
    this.gateway.emitQueueUpdate(venueId, queue);
    return { ok: true };
  }

  @Get(':venueId/history')
  getHistory(@Param('venueId') venueId: string) {
    return this.queueService.getHistory(venueId);
  }

  @Get(':venueId/top-tracks')
  getTopTracks(@Param('venueId') venueId: string, @Query('limit') limit?: string) {
    return this.queueService.getTopTracks(venueId, limit ? parseInt(limit, 10) : 15);
  }

  @Get(':venueId/stats')
  getStats(@Param('venueId') venueId: string) {
    return this.queueService.getStats(venueId);
  }
}
