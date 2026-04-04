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
        name: string;
        id: string;
        createdAt: Date;
        slug: string;
        spotifyRefreshToken: string | null;
        active: boolean;
        accessCode: string;
        startsAt: Date;
        endsAt: Date;
    }[]>;
    findById(eventId: string): Promise<{
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
    assertOwnership(eventId: string, userId: string): Promise<{
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
    update(eventId: string, data: {
        name?: string;
        endsAt?: string;
        maxSongsPerUser?: number;
        allowExplicit?: boolean;
        adminPin?: string;
    }): Promise<{
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
    cancel(eventId: string): Promise<{
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
            artist: string;
            albumArt: string | null;
            eventId: string;
            spotifyUri: string;
            spotifyId: string;
            title: string;
            votes: number;
            played: boolean;
        };
    }>;
    vote(songId: string, sessionId: string): Promise<{
        alreadyVoted: boolean;
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
        };
    } | {
        alreadyVoted: boolean;
        song?: undefined;
    }>;
    getNextSong(eventId: string): Promise<{
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
    } | null>;
    markAsPlayed(spotifyId: string, eventId: string): Promise<boolean>;
    findSong(songId: string): Promise<{
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
    } | null>;
    deleteSong(songId: string): Promise<{
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
    }>;
    verifyPin(eventId: string, pin: string): Promise<boolean>;
    deactivateExpired(): Promise<void>;
}
