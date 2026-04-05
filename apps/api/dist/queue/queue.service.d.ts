import { PrismaService } from '../prisma/prisma.service';
export declare class QueueService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getQueue(venueId: string): Promise<{
        id: string;
        venueId: string;
        spotifyUri: string;
        spotifyId: string;
        title: string;
        artist: string;
        albumArt: string | null;
        votes: number;
        played: boolean;
        createdAt: Date;
    }[]>;
    addSong(venueId: string, data: {
        spotifyId: string;
        spotifyUri: string;
        title: string;
        artist: string;
        albumArt?: string;
    }, sessionId: string): Promise<{
        alreadyExists: boolean;
        song: {
            id: string;
            venueId: string;
            spotifyUri: string;
            spotifyId: string;
            title: string;
            artist: string;
            albumArt: string | null;
            votes: number;
            played: boolean;
            createdAt: Date;
        };
        cooldown?: undefined;
    } | {
        cooldown: boolean;
        song: {
            id: string;
            venueId: string;
            spotifyUri: string;
            spotifyId: string;
            title: string;
            artist: string;
            albumArt: string | null;
            votes: number;
            played: boolean;
            createdAt: Date;
        };
        alreadyExists?: undefined;
    }>;
    vote(songId: string, sessionId: string, venueId?: string): Promise<{
        alreadyVoted: boolean;
        song: {
            id: string;
            venueId: string;
            spotifyUri: string;
            spotifyId: string;
            title: string;
            artist: string;
            albumArt: string | null;
            votes: number;
            played: boolean;
            createdAt: Date;
        };
    } | {
        alreadyVoted: boolean;
        song?: undefined;
    }>;
    getNextSong(venueId: string): Promise<{
        id: string;
        venueId: string;
        spotifyUri: string;
        spotifyId: string;
        title: string;
        artist: string;
        albumArt: string | null;
        votes: number;
        played: boolean;
        createdAt: Date;
    } | null>;
    markAsPlayed(spotifyId: string, venueId: string): Promise<boolean>;
    findSong(songId: string): Promise<{
        id: string;
        venueId: string;
        spotifyUri: string;
        spotifyId: string;
        title: string;
        artist: string;
        albumArt: string | null;
        votes: number;
        played: boolean;
        createdAt: Date;
    } | null>;
    deleteSong(songId: string): Promise<{
        id: string;
        venueId: string;
        spotifyUri: string;
        spotifyId: string;
        title: string;
        artist: string;
        albumArt: string | null;
        votes: number;
        played: boolean;
        createdAt: Date;
    }>;
    getTopTracks(venueId: string, limit?: number): Promise<{
        id: string;
        venueId: string;
        spotifyUri: string;
        spotifyId: string;
        title: string;
        artist: string;
        albumArt: string | null;
        totalRequests: number;
        lastRequested: Date;
    }[]>;
    getHistory(venueId: string): Promise<{
        id: string;
        venueId: string;
        spotifyUri: string;
        spotifyId: string;
        title: string;
        artist: string;
        albumArt: string | null;
        votes: number;
        played: boolean;
        createdAt: Date;
    }[]>;
    getStats(venueId: string): Promise<{
        totalPlayed: number;
        mostVoted: {
            id: string;
            venueId: string;
            spotifyUri: string;
            spotifyId: string;
            title: string;
            artist: string;
            albumArt: string | null;
            votes: number;
            played: boolean;
            createdAt: Date;
        } | null;
        totalVotes: number;
    }>;
}
