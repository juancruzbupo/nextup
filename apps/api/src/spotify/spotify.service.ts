import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { TrackResult, CurrentTrack } from '@barjukebox/types';

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  getAuthUrl(barId: string): string {
    const clientId = this.config.get<string>('SPOTIFY_CLIENT_ID');
    const redirectUri = this.config.get<string>('SPOTIFY_REDIRECT_URI');
    const scopes = [
      'user-modify-playback-state',
      'user-read-playback-state',
      'user-read-currently-playing',
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId!,
      scope: scopes,
      redirect_uri: redirectUri!,
      state: barId,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const clientId = this.config.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.config.get<string>('SPOTIFY_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('SPOTIFY_REDIRECT_URI');

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri!,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      this.logger.error(`Token exchange failed: ${error}`);
      throw new Error('Failed to exchange code for tokens');
    }

    return res.json();
  }

  async refreshAccessToken(barId: string): Promise<string> {
    const bar = await this.prisma.bar.findUniqueOrThrow({ where: { id: barId } });

    const clientId = this.config.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.config.get<string>('SPOTIFY_CLIENT_SECRET');

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: bar.spotifyRefreshToken!,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      this.logger.error(`Token refresh failed for bar ${barId}: ${error}`);
      throw new Error('Failed to refresh token');
    }

    const data = await res.json();

    await this.prisma.bar.update({
      where: { id: barId },
      data: {
        spotifyAccessToken: data.access_token,
        tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
        ...(data.refresh_token ? { spotifyRefreshToken: data.refresh_token } : {}),
      },
    });

    return data.access_token;
  }

  async getValidToken(barId: string): Promise<string> {
    const bar = await this.prisma.bar.findUniqueOrThrow({ where: { id: barId } });

    if (!bar.spotifyAccessToken || !bar.tokenExpiresAt) {
      throw new Error('Bar has no Spotify tokens');
    }

    if (new Date() >= new Date(bar.tokenExpiresAt)) {
      return this.refreshAccessToken(barId);
    }

    return bar.spotifyAccessToken;
  }

  async searchTracks(barId: string, query: string): Promise<TrackResult[]> {
    const token = await this.getValidToken(barId);

    const params = new URLSearchParams({ q: query, type: 'track', limit: '8' });
    const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      this.logger.error(`Search failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return data.tracks.items.map((track: any) => ({
      spotifyId: track.id,
      spotifyUri: track.uri,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      albumArt: track.album.images[0]?.url || '',
      durationMs: track.duration_ms,
    }));
  }

  async getCurrentTrack(barId: string): Promise<CurrentTrack | null> {
    const token = await this.getValidToken(barId);

    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 204 || !res.ok) return null;

    const data = await res.json();
    if (!data.item) return null;

    return {
      trackId: data.item.id,
      name: data.item.name,
      artist: data.item.artists.map((a: any) => a.name).join(', '),
      albumArt: data.item.album.images[0]?.url || '',
      progressMs: data.progress_ms,
      durationMs: data.item.duration_ms,
    };
  }

  async addToQueue(barId: string, spotifyUri: string): Promise<void> {
    const token = await this.getValidToken(barId);

    const res = await fetch(
      `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(spotifyUri)}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!res.ok) {
      this.logger.error(`Add to queue failed: ${res.status}`);
      throw new Error('Failed to add to Spotify queue');
    }
  }

  async skipTrack(barId: string): Promise<void> {
    const token = await this.getValidToken(barId);

    const res = await fetch('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      this.logger.error(`Skip track failed: ${res.status}`);
      throw new Error('Failed to skip track');
    }
  }
}
