import { PrismaService } from '../prisma/prisma.service';
export declare class VenuesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: {
        name: string;
        slug: string;
        adminPin?: string;
    }, userId: string): Promise<{
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
    findBySlugPublic(slug: string): Promise<{
        name: string;
        id: string;
        slug: string;
        backgroundImage: string | null;
        active: boolean;
    }>;
    findBySlug(slug: string): Promise<{
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
    findById(id: string): Promise<{
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
    findByUserId(userId: string): Promise<{
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
    assertOwnership(slug: string, userId: string): Promise<{
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
    delete(slug: string): Promise<{
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
