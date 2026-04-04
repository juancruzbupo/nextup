import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { SpotifyService } from '../spotify/spotify.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth/spotify')
export class SpotifyAuthController {
  constructor(
    private readonly spotify: SpotifyService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  redirectToSpotify(
    @Query('venueId') venueId: string,
    @Query('eventId') eventId: string,
    @Query('barId') barId: string,
    @Res() res: Response,
  ) {
    // State encodes both type and ID for the callback
    const id = venueId || barId;
    const state = eventId ? `event:${eventId}` : id;
    const url = this.spotify.getAuthUrl(state);
    res.redirect(url);
  }

  @Get('callback')
  async spotifyCallback(
    @Query('code') code: string,
    @Query('error') error: string | undefined,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL');

    if (error) {
      res.redirect(`${frontendUrl}/dashboard?error=spotify_denied`);
      return;
    }

    const tokens = await this.spotify.exchangeCode(code);
    const tokenData = {
      spotifyAccessToken: tokens.access_token,
      spotifyRefreshToken: tokens.refresh_token,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    };

    // Parse state to determine if this is for a venue or event
    if (state.startsWith('event:')) {
      const eventId = state.replace('event:', '');
      await this.prisma.event.update({ where: { id: eventId }, data: tokenData });
      res.redirect(`${frontendUrl}/dashboard/eventos/${eventId}`);
    } else {
      const venue = await this.prisma.venue.update({ where: { id: state }, data: tokenData });
      res.redirect(`${frontendUrl}/dashboard/${venue.slug}`);
    }
  }

  @Post('disconnect')
  async disconnectSpotify(@Body() body: { venueId?: string; eventId?: string }) {
    const clearData = { spotifyAccessToken: null, spotifyRefreshToken: null, tokenExpiresAt: null };
    if (body.eventId) {
      await this.prisma.event.update({ where: { id: body.eventId }, data: clearData });
    } else if (body.venueId) {
      await this.prisma.venue.update({ where: { id: body.venueId }, data: clearData });
    }
    return { ok: true };
  }
}
