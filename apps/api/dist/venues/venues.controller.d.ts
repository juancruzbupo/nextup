import { VenuesService } from './venues.service';
export declare class VenuesController {
    private readonly venues;
    constructor(venues: VenuesService);
    create(body: {
        name: string;
        slug: string;
        adminPin?: string;
    }, req: any): Promise<{
        spotifyConnected: boolean;
        name: string;
        id: string;
        slug: string;
        adminPin: string | null;
        backgroundImage: string | null;
        active: boolean;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMyVenues(req: any): Promise<{
        spotifyConnected: boolean;
        name: string;
        id: string;
        slug: string;
        adminPin: string | null;
        backgroundImage: string | null;
        active: boolean;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findBySlug(slug: string): Promise<{
        hasPin: boolean;
        name: string;
        id: string;
        slug: string;
        backgroundImage: string | null;
        active: boolean;
    }>;
    getSpotifyStatus(id: string): Promise<{
        connected: boolean;
        tokenValid: boolean;
    }>;
    verifyPin(slug: string, body: {
        pin: string;
    }): Promise<{
        ok: boolean;
    }>;
    update(slug: string, body: {
        name?: string;
        adminPin?: string;
        backgroundImage?: string;
    }, req: any): Promise<{
        spotifyRefreshToken: string | null;
        name: string;
        id: string;
        slug: string;
        adminPin: string | null;
        backgroundImage: string | null;
        active: boolean;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(slug: string, req: any): Promise<{
        spotifyRefreshToken: string | null;
        name: string;
        id: string;
        slug: string;
        adminPin: string | null;
        spotifyAccessToken: string | null;
        tokenExpiresAt: Date | null;
        backgroundImage: string | null;
        active: boolean;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
