import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { SpotifyService } from '../spotify/spotify.service';
export declare class QueueController {
    private readonly queueService;
    private readonly gateway;
    private readonly spotify;
    constructor(queueService: QueueService, gateway: QueueGateway, spotify: SpotifyService);
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
    addSong(venueId: string, body: {
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
            venueId: string;
            spotifyUri: string;
            spotifyId: string;
            title: string;
            votes: number;
            played: boolean;
        };
    } | {
        ok: boolean;
        error: string;
    }>;
    search(venueId: string, query: string): Promise<import("@nextup/types").TrackResult[]>;
    nowPlaying(venueId: string): Promise<import("@nextup/types").CurrentTrack | null>;
    skip(venueId: string): Promise<{
        ok: boolean;
    }>;
    playSong(venueId: string, songId: string): Promise<{
        ok: boolean;
        error?: string;
    }>;
    deleteSong(venueId: string, songId: string): Promise<{
        ok: boolean;
    }>;
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
    getTopTracks(venueId: string, limit?: string): Promise<{
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
