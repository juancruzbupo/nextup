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
  redirectToSpotify(@Query('venueId') venueId: string, @Query('barId') barId: string, @Res() res: Response) {
    const id = venueId || barId;
    const url = this.spotify.getAuthUrl(id);
    res.redirect(url);
  }

  @Get('callback')
  async spotifyCallback(
    @Query('code') code: string,
    @Query('error') error: string | undefined,
    @Query('state') venueId: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL');

    if (error) {
      res.redirect(`${frontendUrl}/dashboard?error=spotify_denied`);
      return;
    }

    const tokens = await this.spotify.exchangeCode(code);

    const venue = await this.prisma.venue.update({
      where: { id: venueId },
      data: {
        spotifyAccessToken: tokens.access_token,
        spotifyRefreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    res.redirect(`${frontendUrl}/dashboard/${venue.slug}`);
  }

  @Post('disconnect')
  async disconnectSpotify(@Body('venueId') venueId: string) {
    await this.prisma.venue.update({
      where: { id: venueId },
      data: {
        spotifyAccessToken: null,
        spotifyRefreshToken: null,
        tokenExpiresAt: null,
      },
    });
    return { ok: true };
  }
}
