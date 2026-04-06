import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { BattleService } from './battle.service';
import { SpotifyService } from '../spotify/spotify.service';
import { VenueAdminGuard } from '../auth/venue-admin.guard';
import { AddSongDto, CreateBattleDto, SetBattleSongDto, BattleVoteDto } from '../dto';
import { ProfanityService } from '../moderation/profanity.service';

@Controller('queue')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly gateway: QueueGateway,
    private readonly spotify: SpotifyService,
    private readonly battleService: BattleService,
    private readonly profanity: ProfanityService,
  ) {}

  @Get(':venueId')
  getQueue(@Param('venueId') venueId: string) {
    return this.queueService.getQueue(venueId);
  }

  @Post(':venueId/add')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async addSong(
    @Param('venueId') venueId: string,
    @Body() body: AddSongDto,
    @Req() req: any,
  ) {
    // Check profanity in dedication and group name
    const dedicationCheck = this.profanity.check(body.dedication);
    if (!dedicationCheck.clean) return { ok: false, profanity: true, field: 'dedication', reason: dedicationCheck.reason };
    const groupCheck = this.profanity.check(body.groupName);
    if (!groupCheck.clean) return { ok: false, profanity: true, field: 'groupName', reason: groupCheck.reason };

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
  @Throttle({ default: { limit: 20, ttl: 60000 } })
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

  @Get(':venueId/my-stats')
  getMyStats(@Param('venueId') venueId: string, @Req() req: any) {
    const sessionId = req.sessionId || req.headers['x-session-id'] || req.query.sessionId;
    if (!sessionId) return { songsAdded: 0, votesGiven: 0, topSong: null };
    return this.queueService.getMyStats(venueId, sessionId);
  }

  @Get(':venueId/group-ranking')
  async getGroupRanking(@Param('venueId') venueId: string) {
    return this.queueService.getGroupRanking(venueId);
  }

  @Post(':venueId/import-playlist')
  @UseGuards(VenueAdminGuard)
  async importPlaylist(@Param('venueId') venueId: string, @Body() body: { playlistUrl: string }) {
    const tracks = await this.spotify.getPlaylistTracks(venueId, body.playlistUrl);
    const result = await this.queueService.importPlaylist(venueId, tracks);
    // Emit queue update so all clients see the new songs
    const queue = await this.queueService.getQueue(venueId);
    this.gateway.emitQueueUpdate(venueId, queue);
    return result;
  }

  @Post(':venueId/generate-playlist')
  @UseGuards(VenueAdminGuard)
  async generatePlaylist(@Param('venueId') venueId: string) {
    return this.spotify.generatePlaylist(venueId, 'venue');
  }

  // ─── DJ Battle ───

  @Post(':venueId/battle')
  @UseGuards(VenueAdminGuard)
  createBattle(@Param('venueId') venueId: string, @Body() body: CreateBattleDto) {
    return this.battleService.create(venueId, body.djAName, body.djBName, body.rounds);
  }

  @Get(':venueId/battle/active')
  getActiveBattle(@Param('venueId') venueId: string) {
    return this.battleService.getActiveBattle(venueId);
  }

  @Post(':venueId/battle/round/:roundId/song')
  @UseGuards(VenueAdminGuard)
  setSong(@Param('roundId') roundId: string, @Body() body: SetBattleSongDto) {
    return this.battleService.setSong(roundId, body.side, body);
  }

  @Post(':venueId/battle/round/:roundId/vote')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  voteBattle(@Param('roundId') roundId: string, @Body() body: BattleVoteDto, @Req() req: any) {
    const sessionId = req.sessionId || req.headers['x-session-id'];
    if (!sessionId) return { ok: false, error: 'No session' };
    return this.battleService.vote(roundId, sessionId, body.side);
  }

  @Post(':venueId/battle/round/:roundId/finish')
  @UseGuards(VenueAdminGuard)
  finishRound(@Param('roundId') roundId: string) {
    return this.battleService.finishRound(roundId);
  }
}
