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
        name: string;
        id: string;
        createdAt: Date;
        slug: string;
        adminPin: string | null;
        spotifyAccessToken: string | null;
        spotifyRefreshToken: string | null;
        tokenExpiresAt: Date | null;
        active: boolean;
        accessCode: string;
        startsAt: Date;
        endsAt: Date;
        maxSongsPerUser: number;
        allowExplicit: boolean;
        ownerId: string;
    }>;
    getMyEvents(req: any): Promise<{
        spotifyConnected: boolean;
        name: string;
        id: string;
        createdAt: Date;
        slug: string;
        active: boolean;
        accessCode: string;
        startsAt: Date;
        endsAt: Date;
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
        name: string;
        id: string;
        createdAt: Date;
        slug: string;
        adminPin: string | null;
        spotifyAccessToken: string | null;
        spotifyRefreshToken: string | null;
        tokenExpiresAt: Date | null;
        active: boolean;
        accessCode: string;
        startsAt: Date;
        endsAt: Date;
        maxSongsPerUser: number;
        allowExplicit: boolean;
        ownerId: string;
    }>;
    getQueue(eventId: string): Promise<{
        id: string;
        createdAt: Date;
        artist: string;
        albumArt: string | null;
        eventId: string;
        spotifyUri: string;
        spotifyId: string;
        title: string;
        votes: number;
        played: boolean;
        playedAt: Date | null;
        addedBy: string | null;
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
            artist: string;
            albumArt: string | null;
            eventId: string;
            spotifyUri: string;
            spotifyId: string;
            title: string;
            votes: number;
            played: boolean;
            playedAt: Date | null;
            addedBy: string | null;
        };
        cooldown?: undefined;
        limitReached?: undefined;
        max?: undefined;
    } | {
        cooldown: boolean;
        song: {
            id: string;
            createdAt: Date;
            artist: string;
            albumArt: string | null;
            eventId: string;
            spotifyUri: string;
            spotifyId: string;
            title: string;
            votes: number;
            played: boolean;
            playedAt: Date | null;
            addedBy: string | null;
        };
        alreadyExists?: undefined;
        limitReached?: undefined;
        max?: undefined;
    } | {
        limitReached: boolean;
        max: number;
        alreadyExists?: undefined;
        song?: undefined;
        cooldown?: undefined;
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
        name: string;
        id: string;
        createdAt: Date;
        slug: string;
        adminPin: string | null;
        spotifyAccessToken: string | null;
        spotifyRefreshToken: string | null;
        tokenExpiresAt: Date | null;
        active: boolean;
        accessCode: string;
        startsAt: Date;
        endsAt: Date;
        maxSongsPerUser: number;
        allowExplicit: boolean;
        ownerId: string;
    }>;
    cancel(eventId: string, req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        slug: string;
        adminPin: string | null;
        spotifyAccessToken: string | null;
        spotifyRefreshToken: string | null;
        tokenExpiresAt: Date | null;
        active: boolean;
        accessCode: string;
        startsAt: Date;
        endsAt: Date;
        maxSongsPerUser: number;
        allowExplicit: boolean;
        ownerId: string;
    }>;
}
