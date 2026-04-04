import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { SpotifyService } from '../spotify/spotify.service';
import { EventsGateway } from './events.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('events')
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly spotify: SpotifyService,
    private readonly gateway: EventsGateway,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: { name: string; startsAt: string; endsAt: string; adminPin?: string; maxSongsPerUser?: number; allowExplicit?: boolean }, @Req() req: any) {
    return this.events.create(body, req.user.userId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyEvents(@Req() req: any) {
    return this.events.findByOwner(req.user.userId);
  }

  @Get('code/:accessCode')
  findByCode(@Param('accessCode') code: string) {
    return this.events.findByAccessCode(code);
  }

  @Get(':eventId/details')
  @UseGuards(JwtAuthGuard)
  async getEvent(@Param('eventId') eventId: string, @Req() req: any) {
    const event = await this.events.assertOwnership(eventId, req.user.userId);
    return { ...event, spotifyConnected: !!event.spotifyRefreshToken };
  }

  @Get(':eventId/queue')
  getQueue(@Param('eventId') eventId: string) {
    return this.events.getQueue(eventId);
  }

  @Post(':eventId/queue/add')
  async addSong(
    @Param('eventId') eventId: string,
    @Body() body: { spotifyId: string; spotifyUri: string; title: string; artist: string; albumArt?: string },
    @Req() req: any,
  ) {
    const sessionId = req.sessionId || req.headers['x-session-id'];
    if (!sessionId) return { ok: false, error: 'No session' };
    const result = await this.events.addSong(eventId, body, sessionId);
    if (!result.alreadyExists) {
      const queue = await this.events.getQueue(eventId);
      this.gateway.emitQueueUpdate(eventId, queue);
    }
    return result;
  }

  @Get(':eventId/queue/search')
  async search(@Param('eventId') eventId: string, @Query('q') query: string) {
    return this.spotify.searchTracksForEvent(eventId, query);
  }

  @Get(':eventId/now-playing')
  async nowPlaying(@Param('eventId') eventId: string) {
    return this.spotify.getCurrentTrackForEvent(eventId);
  }

  @Post(':eventId/skip')
  async skip(@Param('eventId') eventId: string, @Body('adminPin') pin: string) {
    const valid = await this.events.verifyPin(eventId, pin);
    if (!valid) return { ok: false, error: 'PIN incorrecto' };
    await this.spotify.skipTrackForEvent(eventId);
    return { ok: true };
  }

  @Delete(':eventId/songs/:songId')
  async deleteSong(@Param('eventId') eventId: string, @Param('songId') songId: string, @Body('adminPin') pin: string) {
    const valid = await this.events.verifyPin(eventId, pin);
    if (!valid) return { ok: false, error: 'PIN incorrecto' };
    await this.events.deleteSong(songId);
    const queue = await this.events.getQueue(eventId);
    this.gateway.emitQueueUpdate(eventId, queue);
    return { ok: true };
  }

  @Patch(':eventId')
  @UseGuards(JwtAuthGuard)
  async update(@Param('eventId') eventId: string, @Body() body: any, @Req() req: any) {
    await this.events.assertOwnership(eventId, req.user.userId);
    return this.events.update(eventId, body);
  }

  @Delete(':eventId')
  @UseGuards(JwtAuthGuard)
  async cancel(@Param('eventId') eventId: string, @Req() req: any) {
    await this.events.assertOwnership(eventId, req.user.userId);
    return this.events.cancel(eventId);
  }
}
