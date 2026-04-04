import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { TrackResult, CurrentTrack } from '@nextup/types';
export declare class SpotifyService {
    private readonly config;
    private readonly prisma;
    private readonly logger;
    private refreshLocks;
    private tokenCache;
    constructor(config: ConfigService, prisma: PrismaService);
    private spotifyFetch;
    private get clientId();
    private get clientSecret();
    getAuthUrl(venueId: string): string;
    exchangeCode(code: string): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
    }>;
    refreshAccessToken(entityId: string, entityType?: 'venue' | 'event'): Promise<string>;
    getValidToken(entityId: string, entityType?: 'venue' | 'event'): Promise<string>;
    searchTracks(venueId: string, query: string): Promise<TrackResult[]>;
    getCurrentTrack(venueId: string): Promise<CurrentTrack | null>;
    addToQueue(venueId: string, spotifyUri: string): Promise<void>;
    getAvailableDeviceId(venueId: string): Promise<string | null>;
    playTrack(venueId: string, spotifyUri: string): Promise<{
        ok: boolean;
        error?: string;
    }>;
    skipTrack(venueId: string): Promise<void>;
    searchTracksForEvent(eventId: string, query: string): Promise<TrackResult[]>;
    getCurrentTrackForEvent(eventId: string): Promise<CurrentTrack | null>;
    addToQueueForEvent(eventId: string, spotifyUri: string): Promise<void>;
    skipTrackForEvent(eventId: string): Promise<void>;
}
