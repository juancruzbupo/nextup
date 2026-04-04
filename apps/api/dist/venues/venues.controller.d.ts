import { VenuesService } from './venues.service';
export declare class VenuesController {
    private readonly venues;
    constructor(venues: VenuesService);
    create(body: {
        name: string;
        slug: string;
        adminPin?: string;
    }, req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        adminPin: string | null;
        spotifyRefreshToken: string | null;
        backgroundImage: string | null;
        active: boolean;
        userId: string;
    }>;
    getMyVenues(req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        adminPin: string | null;
        spotifyRefreshToken: string | null;
        backgroundImage: string | null;
        active: boolean;
        userId: string;
    }[]>;
    findBySlug(slug: string): Promise<{
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
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        adminPin: string | null;
        spotifyRefreshToken: string | null;
        backgroundImage: string | null;
        active: boolean;
        userId: string;
    }>;
    remove(slug: string, req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        adminPin: string | null;
        spotifyAccessToken: string | null;
        spotifyRefreshToken: string | null;
        tokenExpiresAt: Date | null;
        backgroundImage: string | null;
        active: boolean;
        userId: string;
    }>;
}
