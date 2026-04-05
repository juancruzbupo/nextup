import { PrismaService } from '../prisma/prisma.service';
export declare class EventsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: {
        name: string;
        startsAt: string;
        endsAt: string;
        adminPin?: string;
        maxSongsPerUser?: number;
        allowExplicit?: boolean;
    }, ownerId: string): Promise<{
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
    findByAccessCode(code: string): Promise<{
        id: string;
        name: string;
        accessCode: string;
        active: true;
        startsAt: Date;
        endsAt: Date;
        maxSongsPerUser: number;
        spotifyConnected: boolean;
    }>;
    findByOwner(ownerId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        accessCode: string;
        spotifyRefreshToken: string | null;
        startsAt: Date;
        endsAt: Date;
        active: boolean;
        createdAt: Date;
    }[]>;
    findById(eventId: string): Promise<{
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
    assertOwnership(eventId: string, userId: string): Promise<{
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
    update(eventId: string, data: {
        name?: string;
        endsAt?: string;
        maxSongsPerUser?: number;
        allowExplicit?: boolean;
        adminPin?: string;
    }): Promise<{
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
    cancel(eventId: string): Promise<{
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
    addSong(eventId: string, data: {
        spotifyId: string;
        spotifyUri: string;
        title: string;
        artist: string;
        albumArt?: string;
    }, sessionId: string): Promise<{
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
    }>;
    vote(songId: string, sessionId: string): Promise<{
        alreadyVoted: boolean;
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
    } | {
        alreadyVoted: boolean;
        song?: undefined;
    }>;
    getNextSong(eventId: string): Promise<{
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
    } | null>;
    markAsPlayed(spotifyId: string, eventId: string): Promise<boolean>;
    findSong(songId: string): Promise<{
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
    } | null>;
    deleteSong(songId: string): Promise<{
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
    }>;
    verifyPin(eventId: string, pin: string): Promise<boolean>;
    deactivateExpired(): Promise<void>;
}
