import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventsService } from './events.service';
import { SpotifyService } from '../spotify/spotify.service';
import { EventsGateway } from './events.gateway';
export declare class EventsController {
    private readonly events;
    private readonly spotify;
    private readonly gateway;
    private readonly jwtService;
    private readonly config;
    constructor(events: EventsService, spotify: SpotifyService, gateway: EventsGateway, jwtService: JwtService, config: ConfigService);
    create(body: {
        name: string;
        startsAt: string;
        endsAt: string;
        adminPin?: string;
        maxSongsPerUser?: number;
        allowExplicit?: boolean;
    }, req: any): Promise<{
        id: string;
        name: string;
        slug: string;
        accessCode: string;
        adminPin: string | null;
        spotifyAccessToken: string | null;
        spotifyRefreshToken: string | null;
        tokenExpiresAt: Date | null;
        startsAt: Date;
        endsAt: Date;
        active: boolean;
        maxSongsPerUser: number;
        allowExplicit: boolean;
        createdAt: Date;
        ownerId: string;
    }>;
    getMyEvents(req: any): Promise<{
        spotifyConnected: boolean;
        id: string;
        name: string;
        slug: string;
        accessCode: string;
        startsAt: Date;
        endsAt: Date;
        active: boolean;
        createdAt: Date;
    }[]>;
    findByCode(code: string): Promise<{
        id: string;
        name: string;
        accessCode: string;
        active: true;
        startsAt: Date;
        endsAt: Date;
        maxSongsPerUser: number;
        spotifyConnected: boolean;
    }>;
    getEvent(eventId: string, req: any): Promise<{
        spotifyConnected: boolean;
        id: string;
        name: string;
        slug: string;
        accessCode: string;
        adminPin: string | null;
        spotifyAccessToken: string | null;
        spotifyRefreshToken: string | null;
        tokenExpiresAt: Date | null;
        startsAt: Date;
        endsAt: Date;
        active: boolean;
        maxSongsPerUser: number;
        allowExplicit: boolean;
        createdAt: Date;
        ownerId: string;
    }>;
    getQueue(eventId: string): Promise<{
        id: string;
        createdAt: Date;
        eventId: string;
        spotifyUri: string;
        spotifyId: string;
        title: string;
        artist: string;
        albumArt: string | null;
        votes: number;
        played: boolean;
    }[]>;
    addSong(eventId: string, body: {
        spotifyId: string;
        spotifyUri: string;
        title: string;
        artist: string;
        albumArt?: string;
    }, req: any): Promise<{
        alreadyExists: boolean;
        song: {
            id: string;
            createdAt: Date;
            eventId: string;
            spotifyUri: string;
            spotifyId: string;
            title: string;
            artist: string;
            albumArt: string | null;
            votes: number;
            played: boolean;
        };
        cooldown?: undefined;
    } | {
        cooldown: boolean;
        song: {
            id: string;
            createdAt: Date;
            eventId: string;
            spotifyUri: string;
            spotifyId: string;
            title: string;
            artist: string;
            albumArt: string | null;
            votes: number;
            played: boolean;
        };
        alreadyExists?: undefined;
    } | {
        ok: boolean;
        error: string;
    }>;
    search(eventId: string, query: string): Promise<import("@nextup/types").TrackResult[]>;
    nowPlaying(eventId: string): Promise<import("@nextup/types").CurrentTrack | null>;
    skip(eventId: string, pin: string, req: any): Promise<{
        ok: boolean;
        error: string;
    } | {
        ok: boolean;
        error?: undefined;
    }>;
    deleteSong(eventId: string, songId: string, pin: string, req: any): Promise<{
        ok: boolean;
        error: string;
    } | {
        ok: boolean;
        error?: undefined;
    }>;
    private isEventAdmin;
    update(eventId: string, body: any, req: any): Promise<{
        id: string;
        name: string;
        slug: string;
        accessCode: string;
        adminPin: string | null;
        spotifyAccessToken: string | null;
        spotifyRefreshToken: string | null;
        tokenExpiresAt: Date | null;
        startsAt: Date;
        endsAt: Date;
        active: boolean;
        maxSongsPerUser: number;
        allowExplicit: boolean;
        createdAt: Date;
        ownerId: string;
    }>;
    cancel(eventId: string, req: any): Promise<{
        id: string;
        name: string;
        slug: string;
        accessCode: string;
        adminPin: string | null;
        spotifyAccessToken: string | null;
        spotifyRefreshToken: string | null;
        tokenExpiresAt: Date | null;
        startsAt: Date;
        endsAt: Date;
        active: boolean;
        maxSongsPerUser: number;
        allowExplicit: boolean;
        createdAt: Date;
        ownerId: string;
    }>;
}
