import { PrismaService } from '../prisma/prisma.service';
export declare class QueueService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getQueue(venueId: string): Promise<{
        id: string;
        createdAt: Date;
        artist: string;
        albumArt: string | null;
        venueId: string;
        spotifyUri: string;
        spotifyId: string;
        title: string;
        votes: number;
        played: boolean;
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
            createdAt: Date;
            artist: string;
            albumArt: string | null;
            venueId: string;
            spotifyUri: string;
            spotifyId: string;
            title: string;
            votes: number;
            played: boolean;
        };
    }>;
    vote(songId: string, sessionId: string, venueId?: string): Promise<{
        alreadyVoted: boolean;
        song: {
            id: string;
            createdAt: Date;
            artist: string;
            albumArt: string | null;
            venueId: string;
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
    getNextSong(venueId: string): Promise<{
        id: string;
        createdAt: Date;
        artist: string;
        albumArt: string | null;
        venueId: string;
        spotifyUri: string;
        spotifyId: string;
        title: string;
        votes: number;
        played: boolean;
    } | null>;
    markAsPlayed(spotifyId: string, venueId: string): Promise<boolean>;
    findSong(songId: string): Promise<{
        id: string;
        createdAt: Date;
        artist: string;
        albumArt: string | null;
        venueId: string;
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
        venueId: string;
        spotifyUri: string;
        spotifyId: string;
        title: string;
        votes: number;
        played: boolean;
    }>;
    getTopTracks(venueId: string, limit?: number): Promise<{
        id: string;
        artist: string;
        albumArt: string | null;
        venueId: string;
        spotifyUri: string;
        spotifyId: string;
        title: string;
        totalRequests: number;
        lastRequested: Date;
    }[]>;
    getHistory(venueId: string): Promise<{
        id: string;
        createdAt: Date;
        artist: string;
        albumArt: string | null;
        venueId: string;
        spotifyUri: string;
        spotifyId: string;
        title: string;
        votes: number;
        played: boolean;
    }[]>;
    getStats(venueId: string): Promise<{
        totalPlayed: number;
        mostVoted: {
            id: string;
            createdAt: Date;
            artist: string;
            albumArt: string | null;
            venueId: string;
            spotifyUri: string;
            spotifyId: string;
            title: string;
            votes: number;
            played: boolean;
        } | null;
        totalVotes: number;
    }>;
}
