import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { SpotifyService } from '../spotify/spotify.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class SpotifyAuthController {
    private readonly spotify;
    private readonly prisma;
    private readonly config;
    constructor(spotify: SpotifyService, prisma: PrismaService, config: ConfigService);
    redirectToSpotify(venueId: string, barId: string, res: Response): void;
    spotifyCallback(code: string, error: string | undefined, venueId: string, res: Response): Promise<void>;
    disconnectSpotify(venueId: string): Promise<{
        ok: boolean;
    }>;
}
