"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SpotifyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotifyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let SpotifyService = SpotifyService_1 = class SpotifyService {
    config;
    prisma;
    logger = new common_1.Logger(SpotifyService_1.name);
    refreshLocks = new Map();
    tokenCache = new Map();
    lastCacheCleanup = 0;
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
    }
    async spotifyFetch(url, entityId, options = {}, retries = 1, entityType = 'venue') {
        const token = await this.getValidToken(entityId, entityType);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let res;
        try {
            res = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...options.headers,
                },
            });
        }
        catch (error) {
            clearTimeout(timeout);
            if (error.name === 'AbortError') {
                this.logger.warn(`Spotify request timed out for ${entityType} ${entityId}: ${url}`);
                throw new Error('Spotify request timeout');
            }
            throw error;
        }
        clearTimeout(timeout);
        if (res.status === 429 && retries > 0) {
            const retryAfter = parseInt(res.headers.get('Retry-After') || '3', 10);
            this.logger.warn(`Rate limited for ${entityType} ${entityId}, retrying in ${retryAfter}s`);
            await new Promise((r) => setTimeout(r, retryAfter * 1000));
            return this.spotifyFetch(url, entityId, options, retries - 1, entityType);
        }
        if (res.status === 401 && retries > 0) {
            const cacheKey = entityType === 'event' ? `event:${entityId}` : entityId;
            this.logger.warn(`Spotify 401 for ${entityType} ${entityId}, refreshing token`);
            this.tokenCache.delete(cacheKey);
            return this.spotifyFetch(url, entityId, options, retries - 1, entityType);
        }
        if (res.status === 502 && retries > 0) {
            this.logger.warn(`Spotify 502 for ${entityType} ${entityId}, retrying in 1s`);
            await new Promise((r) => setTimeout(r, 1000));
            return this.spotifyFetch(url, entityId, options, retries - 1, entityType);
        }
        return res;
    }
    get clientId() {
        return this.config.get('SPOTIFY_CLIENT_ID');
    }
    get clientSecret() {
        return this.config.get('SPOTIFY_CLIENT_SECRET');
    }
    getAuthUrl(venueId) {
        const redirectUri = this.config.get('SPOTIFY_REDIRECT_URI');
        const scopes = [
            'user-modify-playback-state',
            'user-read-playback-state',
            'user-read-currently-playing',
        ].join(' ');
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            scope: scopes,
            redirect_uri: redirectUri,
            state: venueId,
        });
        return `https://accounts.spotify.com/authorize?${params.toString()}`;
    }
    async exchangeCode(code) {
        const redirectUri = this.config.get('SPOTIFY_REDIRECT_URI');
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
                redirect_uri: redirectUri,
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
    async refreshAccessToken(entityId, entityType = 'venue') {
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
                refresh_token: entity.spotifyRefreshToken,
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
                }
                else {
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
        }
        else {
            await this.prisma.venue.update({ where: { id: entityId }, data: tokenData });
        }
        const expiresAt = Date.now() + data.expires_in * 1000;
        this.tokenCache.set(cacheKey, { token: data.access_token, expiresAt });
        return data.access_token;
    }
    async getValidToken(entityId, entityType = 'venue') {
        const now = Date.now();
        if (now - this.lastCacheCleanup > 10 * 60 * 1000) {
            this.lastCacheCleanup = now;
            for (const [key, val] of this.tokenCache) {
                if (now > val.expiresAt + 60 * 60 * 1000)
                    this.tokenCache.delete(key);
            }
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
            if (existing)
                return existing;
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
    async searchTracks(venueId, query) {
        if (!query?.trim())
            return [];
        const params = new URLSearchParams({ q: query, type: 'track', limit: '8' });
        const res = await this.spotifyFetch(`https://api.spotify.com/v1/search?${params}`, venueId);
        if (!res.ok) {
            this.logger.error(`Search failed: ${res.status}`);
            return [];
        }
        const data = await res.json();
        if (!data.tracks?.items)
            return [];
        return data.tracks.items.map((track) => ({
            spotifyId: track.id,
            spotifyUri: track.uri,
            title: track.name,
            artist: track.artists?.map((a) => a.name).join(', ') || 'Unknown',
            albumArt: track.album?.images?.[0]?.url || '',
            durationMs: track.duration_ms || 0,
        }));
    }
    async getCurrentTrack(venueId) {
        const res = await this.spotifyFetch('https://api.spotify.com/v1/me/player/currently-playing', venueId);
        if (res.status === 204)
            return null;
        if (!res.ok) {
            this.logger.warn(`getCurrentTrack failed for bar ${venueId}: ${res.status}`);
            return null;
        }
        const data = await res.json();
        if (!data.item || !data.is_playing || data.currently_playing_type !== 'track')
            return null;
        return {
            trackId: data.item.id,
            name: data.item.name,
            artist: data.item.artists?.map((a) => a.name).join(', ') || 'Unknown',
            albumArt: data.item.album?.images?.[0]?.url || '',
            progressMs: data.progress_ms || 0,
            durationMs: data.item.duration_ms || 0,
        };
    }
    async addToQueue(venueId, spotifyUri) {
        const res = await this.spotifyFetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(spotifyUri)}`, venueId, { method: 'POST' });
        if (res.status === 404) {
            this.logger.warn(`No active Spotify device for bar ${venueId}`);
            return;
        }
        if (!res.ok) {
            this.logger.error(`Add to queue failed for bar ${venueId}: ${res.status}`);
        }
    }
    async getAvailableDeviceId(venueId) {
        const res = await this.spotifyFetch('https://api.spotify.com/v1/me/player/devices', venueId);
        if (!res.ok)
            return null;
        const data = await res.json();
        if (!data.devices?.length)
            return null;
        const active = data.devices.find((d) => d.is_active);
        return active?.id || data.devices[0].id;
    }
    async playTrack(venueId, spotifyUri) {
        const deviceId = await this.getAvailableDeviceId(venueId);
        if (!deviceId) {
            this.logger.warn(`No Spotify devices available for venue ${venueId}`);
            return { ok: false, error: 'NO_DEVICE' };
        }
        await this.spotifyFetch('https://api.spotify.com/v1/me/player', venueId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_ids: [deviceId], play: false }),
        });
        await new Promise((r) => setTimeout(r, 300));
        const res = await this.spotifyFetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, venueId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uris: [spotifyUri] }),
        });
        if (!res.ok) {
            this.logger.error(`Play track failed for venue ${venueId}: ${res.status}`);
            return { ok: false, error: 'PLAY_FAILED' };
        }
        this.logger.log(`Playing track on device ${deviceId} for venue ${venueId}`);
        return { ok: true };
    }
    async skipTrack(venueId) {
        const res = await this.spotifyFetch('https://api.spotify.com/v1/me/player/next', venueId, { method: 'POST' });
        if (!res.ok) {
            this.logger.error(`Skip track failed for bar ${venueId}: ${res.status}`);
        }
    }
    async searchTracksForEvent(eventId, query, filterExplicit = false) {
        if (!query?.trim())
            return [];
        const params = new URLSearchParams({ q: query, type: 'track', limit: '12' });
        const res = await this.spotifyFetch(`https://api.spotify.com/v1/search?${params}`, eventId, {}, 1, 'event');
        if (!res.ok)
            return [];
        const data = await res.json();
        if (!data.tracks?.items)
            return [];
        let items = data.tracks.items;
        if (filterExplicit) {
            items = items.filter((t) => !t.explicit);
        }
        return items.slice(0, 8).map((track) => ({
            spotifyId: track.id, spotifyUri: track.uri, title: track.name,
            artist: track.artists?.map((a) => a.name).join(', ') || 'Unknown',
            albumArt: track.album?.images?.[0]?.url || '', durationMs: track.duration_ms || 0,
        }));
    }
    async getCurrentTrackForEvent(eventId) {
        const res = await this.spotifyFetch('https://api.spotify.com/v1/me/player/currently-playing', eventId, {}, 1, 'event');
        if (res.status === 204 || !res.ok)
            return null;
        const data = await res.json();
        if (!data.item || !data.is_playing || data.currently_playing_type !== 'track')
            return null;
        return {
            trackId: data.item.id, name: data.item.name,
            artist: data.item.artists?.map((a) => a.name).join(', ') || 'Unknown',
            albumArt: data.item.album?.images?.[0]?.url || '',
            progressMs: data.progress_ms || 0, durationMs: data.item.duration_ms || 0,
        };
    }
    async addToQueueForEvent(eventId, spotifyUri) {
        await this.spotifyFetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(spotifyUri)}`, eventId, { method: 'POST' }, 1, 'event');
    }
    async skipTrackForEvent(eventId) {
        await this.spotifyFetch('https://api.spotify.com/v1/me/player/next', eventId, { method: 'POST' }, 1, 'event');
    }
};
exports.SpotifyService = SpotifyService;
exports.SpotifyService = SpotifyService = SpotifyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], SpotifyService);
//# sourceMappingURL=spotify.service.js.map