import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { TrackResult, CurrentTrack } from '@nextup/types';

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private static readonly MAX_CACHE_SIZE = 500;
  private static readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private refreshLocks = new Map<string, Promise<string>>();
  private tokenCache = new Map<string, { token: string; expiresAt: number }>();
  private lastCacheCleanup = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // Centralized Spotify API fetch with timeout + rate-limit + retry handling
  private async spotifyFetch(
    url: string,
    entityId: string,
    options: RequestInit = {},
    retries = 1,
    entityType: 'venue' | 'event' = 'venue',
  ): Promise<Response> {
    const token = await this.getValidToken(entityId, entityType);
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
        this.logger.warn(`Spotify request timed out for ${entityType} ${entityId}: ${url}`);
        throw new Error('Spotify request timeout');
      }
      throw error;
    }
    clearTimeout(timeout);

    // Handle 429 rate limit
    if (res.status === 429 && retries > 0) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '3', 10);
      this.logger.warn(`Rate limited for ${entityType} ${entityId}, retrying in ${retryAfter}s`);
      const jitter = Math.random() * 1000;
      await new Promise((r) => setTimeout(r, retryAfter * 1000 + jitter));
      return this.spotifyFetch(url, entityId, options, retries - 1, entityType);
    }

    // Handle 401 expired token — invalidate cache and retry with fresh token
    if (res.status === 401 && retries > 0) {
      const cacheKey = entityType === 'event' ? `event:${entityId}` : entityId;
      this.logger.warn(`Spotify 401 for ${entityType} ${entityId}, refreshing token`);
      this.tokenCache.delete(cacheKey);
      return this.spotifyFetch(url, entityId, options, retries - 1, entityType);
    }

    // Handle 502 transient errors
    if (res.status === 502 && retries > 0) {
      this.logger.warn(`Spotify 502 for ${entityType} ${entityId}, retrying in 1s`);
      await new Promise((r) => setTimeout(r, 1000));
      return this.spotifyFetch(url, entityId, options, retries - 1, entityType);
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

  async refreshAccessToken(entityId: string, entityType: 'venue' | 'event' = 'venue'): Promise<string> {
    const cacheKey = entityType === 'event' ? `event:${entityId}` : entityId;
    const entity = entityType === 'event'
      ? await this.prisma.event.findUniqueOrThrow({ where: { id: entityId } })
      : await this.prisma.venue.findUniqueOrThrow({ where: { id: entityId } });

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
        refresh_token: entity.spotifyRefreshToken!,
      }),
    });
    clearTimeout(timeout);

    const clearTokens = { spotifyAccessToken: null, spotifyRefreshToken: null, tokenExpiresAt: null };

    if (!res.ok) {
      const errorBody = await res.text();
      this.logger.error(`Token refresh failed for ${entityType} ${entityId}: ${errorBody}`);
      if (errorBody.includes('invalid_grant') || res.status === 400) {
        if (entityType === 'event') {
          await this.prisma.event.update({ where: { id: entityId }, data: clearTokens });
        } else {
          await this.prisma.venue.update({ where: { id: entityId }, data: clearTokens });
        }
        this.tokenCache.delete(cacheKey);
      }
      throw new Error('Failed to refresh token');
    }

    const data = await res.json();
    const tokenData = {
      spotifyAccessToken: data.access_token,
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
      ...(data.refresh_token ? { spotifyRefreshToken: data.refresh_token } : {}),
    };

    if (entityType === 'event') {
      await this.prisma.event.update({ where: { id: entityId }, data: tokenData });
    } else {
      await this.prisma.venue.update({ where: { id: entityId }, data: tokenData });
    }

    const expiresAt = Date.now() + data.expires_in * 1000;
    this.tokenCache.set(cacheKey, { token: data.access_token, expiresAt });
    return data.access_token;
  }

  async getValidToken(entityId: string, entityType: 'venue' | 'event' = 'venue'): Promise<string> {
    const now = Date.now();

    // Aggressive cache cleanup: every 5 min, remove expired tokens immediately
    if (now - this.lastCacheCleanup > SpotifyService.CLEANUP_INTERVAL_MS) {
      this.lastCacheCleanup = now;
      for (const [key, val] of this.tokenCache) {
        if (now > val.expiresAt) this.tokenCache.delete(key);
      }
    }

    // Hard cap: evict oldest entries if cache exceeds max size
    if (this.tokenCache.size > SpotifyService.MAX_CACHE_SIZE) {
      const entries = [...this.tokenCache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      const toDelete = entries.slice(0, entries.length - SpotifyService.MAX_CACHE_SIZE);
      for (const [key] of toDelete) this.tokenCache.delete(key);
    }

    const cacheKey = entityType === 'event' ? `event:${entityId}` : entityId;
    const bufferMs = 2 * 60 * 1000;
    const cached = this.tokenCache.get(cacheKey);
    if (cached && now < cached.expiresAt - bufferMs) {
      return cached.token;
    }

    const entity = entityType === 'event'
      ? await this.prisma.event.findUniqueOrThrow({ where: { id: entityId } })
      : await this.prisma.venue.findUniqueOrThrow({ where: { id: entityId } });

    if (!entity.spotifyAccessToken || !entity.tokenExpiresAt) {
      throw new Error(`${entityType} has no Spotify tokens`);
    }
    if (Date.now() >= new Date(entity.tokenExpiresAt).getTime() - bufferMs) {
      const existing = this.refreshLocks.get(cacheKey);
      if (existing) return existing;

      const promise = this.refreshAccessToken(entityId, entityType).finally(() => {
        this.refreshLocks.delete(cacheKey);
      });
      this.refreshLocks.set(cacheKey, promise);
      return promise;
    }

    this.tokenCache.set(cacheKey, {
      token: entity.spotifyAccessToken,
      expiresAt: new Date(entity.tokenExpiresAt).getTime(),
    });
    return entity.spotifyAccessToken;
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

  // ─── Event-specific wrappers (reuse unified spotifyFetch + token logic) ───

  async searchTracksForEvent(eventId: string, query: string, filterExplicit = false): Promise<TrackResult[]> {
    if (!query?.trim()) return [];
    const params = new URLSearchParams({ q: query, type: 'track', limit: '12' }); // fetch more to account for filtering
    const res = await this.spotifyFetch(`https://api.spotify.com/v1/search?${params}`, eventId, {}, 1, 'event');
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.tracks?.items) return [];
    let items = data.tracks.items;
    if (filterExplicit) {
      items = items.filter((t: any) => !t.explicit);
    }
    return items.slice(0, 8).map((track: any) => ({
      spotifyId: track.id, spotifyUri: track.uri, title: track.name,
      artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
      albumArt: track.album?.images?.[0]?.url || '', durationMs: track.duration_ms || 0,
    }));
  }

  async getCurrentTrackForEvent(eventId: string): Promise<CurrentTrack | null> {
    const res = await this.spotifyFetch('https://api.spotify.com/v1/me/player/currently-playing', eventId, {}, 1, 'event');
    if (res.status === 204 || !res.ok) return null;
    const data = await res.json();
    if (!data.item || !data.is_playing || data.currently_playing_type !== 'track') return null;
    return {
      trackId: data.item.id, name: data.item.name,
      artist: data.item.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
      albumArt: data.item.album?.images?.[0]?.url || '',
      progressMs: data.progress_ms || 0, durationMs: data.item.duration_ms || 0,
    };
  }

  async addToQueueForEvent(eventId: string, spotifyUri: string): Promise<void> {
    await this.spotifyFetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(spotifyUri)}`, eventId, { method: 'POST' }, 1, 'event');
  }

  async skipTrackForEvent(eventId: string): Promise<void> {
    await this.spotifyFetch('https://api.spotify.com/v1/me/player/next', eventId, { method: 'POST' }, 1, 'event');
  }
}
