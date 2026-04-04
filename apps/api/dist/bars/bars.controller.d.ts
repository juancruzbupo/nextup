import { BarsService } from './bars.service';
export declare class BarsController {
    private readonly bars;
    constructor(bars: BarsService);
    create(body: {
        name: string;
        slug: string;
        adminPin?: string;
    }): Promise<{
        name: string;
        id: string;
        slug: string;
        adminPin: string | null;
        spotifyAccessToken: string | null;
        spotifyRefreshToken: string | null;
        tokenExpiresAt: Date | null;
        active: boolean;
        createdAt: Date;
    }>;
    findBySlug(slug: string): Promise<{
        name: string;
        id: string;
        slug: string;
        adminPin: string | null;
        spotifyAccessToken: string | null;
        spotifyRefreshToken: string | null;
        tokenExpiresAt: Date | null;
        active: boolean;
        createdAt: Date;
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
    }): Promise<{
        name: string;
        id: string;
        slug: string;
        adminPin: string | null;
        spotifyAccessToken: string | null;
        spotifyRefreshToken: string | null;
        tokenExpiresAt: Date | null;
        active: boolean;
        createdAt: Date;
    }>;
}
