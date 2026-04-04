import { PrismaService } from '../prisma/prisma.service';
export declare class BarsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: {
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
    findById(id: string): Promise<{
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
    verifyPin(slug: string, pin: string): Promise<{
        ok: boolean;
    }>;
    update(slug: string, data: {
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
