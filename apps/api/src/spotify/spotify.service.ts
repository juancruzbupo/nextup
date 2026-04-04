import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { TrackResult, CurrentTrack } from '@nextup/types';

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private refreshLocks = new Map<string, Promise<string>>();
  private tokenCache = new Map<string, { token: string; expiresAt: number }>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // Centralized Spotify API fetch with timeout + rate-limit + retry handling
  private async spotifyFetch(
    url: string,
    venueId: string,
    options: RequestInit = {},
    retries = 1,
  ): Promise<Response> {
    const token = await this.getValidToken(venueId);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    let res: Response;
    try {
      res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === 'AbortError') {
        this.logger.warn(`Spotify request timed out for venue ${venueId}: ${url}`);
        throw new Error('Spotify request timeout');
      }
      throw error;
    }
    clearTimeout(timeout);

    // Handle 429 rate limit
    if (res.status === 429 && retries > 0) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '3', 10);
      this.logger.warn(`Rate limited for bar ${venueId}, retrying in ${retryAfter}s`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return this.spotifyFetch(url, venueId, options, retries - 1);
    }

    // Handle 401 expired token — invalidate cache and retry with fresh token
    if (res.status === 401 && retries > 0) {
      this.logger.warn(`Spotify 401 for venue ${venueId}, refreshing token`);
      this.tokenCache.delete(venueId);
      return this.spotifyFetch(url, venueId, options, retries - 1);
    }

    // Handle 502 transient errors
    if (res.status === 502 && retries > 0) {
      this.logger.warn(`Spotify 502 for venue ${venueId}, retrying in 1s`);
      await new Promise((r) => setTimeout(r, 1000));
      return this.spotifyFetch(url, venueId, options, retries - 1);
    }

    return res;
  }

  private get clientId(): string {
    return this.config.get<string>('SPOTIFY_CLIENT_ID')!;
  }

  private get clientSecret(): string {
    return this.config.get<string>('SPOTIFY_CLIENT_SECRET')!;
  }

  getAuthUrl(venueId: string): string {
    const redirectUri = this.config.get<string>('SPOTIFY_REDIRECT_URI');
    const scopes = [
      'user-modify-playback-state',
      'user-read-playback-state',
      'user-read-currently-playing',
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: redirectUri!,
      state: venueId,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const redirectUri = this.config.get<string>('SPOTIFY_REDIRECT_URI');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri!,
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const error = await res.text();
      this.logger.error(`Token exchange failed: ${error}`);
      throw new Error('Failed to exchange code for tokens');
    }

    return res.json();
  }

  async refreshAccessToken(venueId: string): Promise<string> {
    const venue = await this.prisma.venue.findUniqueOrThrow({ where: { id: venueId } });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: venue.spotifyRefreshToken!,
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errorBody = await res.text();
      this.logger.error(`Token refresh failed for venue ${venueId}: ${errorBody}`);

      // If refresh token is revoked/invalid, clear venue tokens so admin sees "disconnected"
      if (errorBody.includes('invalid_grant') || res.status === 400) {
        await this.prisma.venue.update({
          where: { id: venueId },
          data: { spotifyAccessToken: null, spotifyRefreshToken: null, tokenExpiresAt: null },
        });
        this.tokenCache.delete(venueId);
        this.logger.warn(`Cleared Spotify tokens for venue ${venueId} (refresh token revoked)`);
      }

      throw new Error('Failed to refresh token');
    }

    const data = await res.json();

    await this.prisma.venue.update({
      where: { id: venueId },
      data: {
        spotifyAccessToken: data.access_token,
        tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
        ...(data.refresh_token ? { spotifyRefreshToken: data.refresh_token } : {}),
      },
    });

    // Update cache
    const expiresAt = Date.now() + data.expires_in * 1000;
    this.tokenCache.set(venueId, { token: data.access_token, expiresAt });

    return data.access_token;
  }

  async getValidToken(venueId: string): Promise<string> {
    // Check in-memory cache first (avoids DB query)
    const bufferMs = 2 * 60 * 1000;
    const cached = this.tokenCache.get(venueId);
    if (cached && Date.now() < cached.expiresAt - bufferMs) {
      return cached.token;
    }

    const venue = await this.prisma.venue.findUniqueOrThrow({ where: { id: venueId } });

    if (!venue.spotifyAccessToken || !venue.tokenExpiresAt) {
      throw new Error('Venue has no Spotify tokens');
    }
    if (Date.now() >= new Date(venue.tokenExpiresAt).getTime() - bufferMs) {
      const existing = this.refreshLocks.get(venueId);
      if (existing) return existing;

      const promise = this.refreshAccessToken(venueId).finally(() => {
        this.refreshLocks.delete(venueId);
      });
      this.refreshLocks.set(venueId, promise);
      return promise;
    }

    // Cache the valid token
    this.tokenCache.set(venueId, {
      token: venue.spotifyAccessToken,
      expiresAt: new Date(venue.tokenExpiresAt).getTime(),
    });
    return venue.spotifyAccessToken;
  }

  async searchTracks(venueId: string, query: string): Promise<TrackResult[]> {
    if (!query?.trim()) return [];

    const params = new URLSearchParams({ q: query, type: 'track', limit: '8' });
    const res = await this.spotifyFetch(
      `https://api.spotify.com/v1/search?${params}`,
      venueId,
    );

    if (!res.ok) {
      this.logger.error(`Search failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!data.tracks?.items) return [];

    return data.tracks.items.map((track: any) => ({
      spotifyId: track.id,
      spotifyUri: track.uri,
      title: track.name,
      artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
      albumArt: track.album?.images?.[0]?.url || '',
      durationMs: track.duration_ms || 0,
    }));
  }

  async getCurrentTrack(venueId: string): Promise<CurrentTrack | null> {
    const res = await this.spotifyFetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      venueId,
    );

    // 204 = nothing playing
    if (res.status === 204) return null;

    // Log actual errors instead of swallowing them
    if (!res.ok) {
      this.logger.warn(`getCurrentTrack failed for bar ${venueId}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    // Ignore if paused, no item, or not a music track
    if (!data.item || !data.is_playing || data.currently_playing_type !== 'track') return null;

    return {
      trackId: data.item.id,
      name: data.item.name,
      artist: data.item.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
      albumArt: data.item.album?.images?.[0]?.url || '',
      progressMs: data.progress_ms || 0,
      durationMs: data.item.duration_ms || 0,
    };
  }

  async addToQueue(venueId: string, spotifyUri: string): Promise<void> {
    const res = await this.spotifyFetch(
      `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(spotifyUri)}`,
      venueId,
      { method: 'POST' },
    );

    if (res.status === 404) {
      this.logger.warn(`No active Spotify device for bar ${venueId}`);
      return; // Don't throw — no device is recoverable
    }

    if (!res.ok) {
      this.logger.error(`Add to queue failed for bar ${venueId}: ${res.status}`);
    }
  }

  async getAvailableDeviceId(venueId: string): Promise<string | null> {
    const res = await this.spotifyFetch(
      'https://api.spotify.com/v1/me/player/devices',
      venueId,
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.devices?.length) return null;

    // Prefer the active device, otherwise use the first one
    const active = data.devices.find((d: any) => d.is_active);
    return active?.id || data.devices[0].id;
  }

  async playTrack(venueId: string, spotifyUri: string): Promise<{ ok: boolean; error?: string }> {
    // Get device first to ensure playback activates
    const deviceId = await this.getAvailableDeviceId(venueId);

    if (!deviceId) {
      this.logger.warn(`No Spotify devices available for venue ${venueId}`);
      return { ok: false, error: 'NO_DEVICE' };
    }

    // Transfer playback to the device first (activates it)
    await this.spotifyFetch(
      'https://api.spotify.com/v1/me/player',
      venueId,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: [deviceId], play: false }),
      },
    );

    // Small delay to let the device activate
    await new Promise((r) => setTimeout(r, 300));

    // Now play the track on that device
    const res = await this.spotifyFetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      venueId,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [spotifyUri] }),
      },
    );

    if (!res.ok) {
      this.logger.error(`Play track failed for venue ${venueId}: ${res.status}`);
      return { ok: false, error: 'PLAY_FAILED' };
    }

    this.logger.log(`Playing track on device ${deviceId} for venue ${venueId}`);
    return { ok: true };
  }

  async skipTrack(venueId: string): Promise<void> {
    const res = await this.spotifyFetch(
      'https://api.spotify.com/v1/me/player/next',
      venueId,
      { method: 'POST' },
    );

    if (!res.ok) {
      this.logger.error(`Skip track failed for bar ${venueId}: ${res.status}`);
    }
  }

  // ─── Event-specific methods (use event tokens) ───

  private async getValidEventToken(eventId: string): Promise<string> {
    const cached = this.tokenCache.get(`event:${eventId}`);
    const bufferMs = 2 * 60 * 1000;
    if (cached && Date.now() < cached.expiresAt - bufferMs) return cached.token;

    const event = await this.prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    if (!event.spotifyAccessToken || !event.tokenExpiresAt) {
      throw new Error('Event has no Spotify tokens');
    }

    if (Date.now() >= new Date(event.tokenExpiresAt).getTime() - bufferMs) {
      return this.refreshEventToken(eventId);
    }

    this.tokenCache.set(`event:${eventId}`, {
      token: event.spotifyAccessToken,
      expiresAt: new Date(event.tokenExpiresAt).getTime(),
    });
    return event.spotifyAccessToken;
  }

  private async refreshEventToken(eventId: string): Promise<string> {
    const event = await this.prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: event.spotifyRefreshToken!,
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      if ((await res.text()).includes('invalid_grant')) {
        await this.prisma.event.update({
          where: { id: eventId },
          data: { spotifyAccessToken: null, spotifyRefreshToken: null, tokenExpiresAt: null },
        });
        this.tokenCache.delete(`event:${eventId}`);
      }
      throw new Error('Failed to refresh event token');
    }

    const data = await res.json();
    await this.prisma.event.update({
      where: { id: eventId },
      data: {
        spotifyAccessToken: data.access_token,
        tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
        ...(data.refresh_token ? { spotifyRefreshToken: data.refresh_token } : {}),
      },
    });

    const expiresAt = Date.now() + data.expires_in * 1000;
    this.tokenCache.set(`event:${eventId}`, { token: data.access_token, expiresAt });
    return data.access_token;
  }

  private async spotifyFetchEvent(url: string, eventId: string, options: RequestInit = {}, retries = 1): Promise<Response> {
    const token = await this.getValidEventToken(eventId);
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 8000);
    let res: Response;
    try {
      res = await fetch(url, { ...options, signal: ctrl.signal, headers: { Authorization: `Bearer ${token}`, ...options.headers } });
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
    clearTimeout(timeout);
    if (res.status === 401 && retries > 0) { this.tokenCache.delete(`event:${eventId}`); return this.spotifyFetchEvent(url, eventId, options, retries - 1); }
    if (res.status === 429 && retries > 0) { const r = parseInt(res.headers.get('Retry-After') || '3', 10); await new Promise(r2 => setTimeout(r2, r * 1000)); return this.spotifyFetchEvent(url, eventId, options, retries - 1); }
    return res;
  }

  async searchTracksForEvent(eventId: string, query: string): Promise<TrackResult[]> {
    if (!query?.trim()) return [];
    const params = new URLSearchParams({ q: query, type: 'track', limit: '8' });
    const res = await this.spotifyFetchEvent(`https://api.spotify.com/v1/search?${params}`, eventId);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.tracks?.items) return [];
    return data.tracks.items.map((track: any) => ({
      spotifyId: track.id,
      spotifyUri: track.uri,
      title: track.name,
      artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
      albumArt: track.album?.images?.[0]?.url || '',
      durationMs: track.duration_ms || 0,
    }));
  }

  async getCurrentTrackForEvent(eventId: string): Promise<CurrentTrack | null> {
    const res = await this.spotifyFetchEvent('https://api.spotify.com/v1/me/player/currently-playing', eventId);
    if (res.status === 204 || !res.ok) return null;
    const data = await res.json();
    if (!data.item || !data.is_playing || data.currently_playing_type !== 'track') return null;
    return {
      trackId: data.item.id,
      name: data.item.name,
      artist: data.item.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
      albumArt: data.item.album?.images?.[0]?.url || '',
      progressMs: data.progress_ms || 0,
      durationMs: data.item.duration_ms || 0,
    };
  }

  async addToQueueForEvent(eventId: string, spotifyUri: string): Promise<void> {
    const res = await this.spotifyFetchEvent(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(spotifyUri)}`, eventId, { method: 'POST' });
    if (res.status === 404) return;
  }

  async skipTrackForEvent(eventId: string): Promise<void> {
    await this.spotifyFetchEvent('https://api.spotify.com/v1/me/player/next', eventId, { method: 'POST' });
  }
}
