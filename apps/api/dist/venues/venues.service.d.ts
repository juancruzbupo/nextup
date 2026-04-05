import { PrismaService } from '../prisma/prisma.service';
export declare class VenuesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: {
        name: string;
        slug: string;
        adminPin?: string;
    }, userId: string): Promise<{
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
    findBySlugPublic(slug: string): Promise<{
        hasPin: boolean;
        name: string;
        id: string;
        slug: string;
        backgroundImage: string | null;
        active: boolean;
    }>;
    findBySlug(slug: string): Promise<{
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
    findById(id: string): Promise<{
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
    findByUserId(userId: string): Promise<{
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
        backgroundImage?: string;
    }): Promise<{
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
    assertOwnership(slug: string, userId: string): Promise<{
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
    delete(slug: string): Promise<{
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
