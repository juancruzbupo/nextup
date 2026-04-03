import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { SpotifyService } from '../spotify/spotify.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly spotify: SpotifyService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get('spotify')
  redirectToSpotify(@Query('barId') barId: string, @Res() res: Response) {
    const url = this.spotify.getAuthUrl(barId);
    res.redirect(url);
  }

  @Get('spotify/callback')
  async spotifyCallback(
    @Query('code') code: string,
    @Query('state') barId: string,
    @Res() res: Response,
  ) {
    const tokens = await this.spotify.exchangeCode(code);

    const bar = await this.prisma.bar.update({
      where: { id: barId },
      data: {
        spotifyAccessToken: tokens.access_token,
        spotifyRefreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}/admin/${bar.slug}`);
  }
}
