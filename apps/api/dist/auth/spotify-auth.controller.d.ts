import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { SpotifyService } from '../spotify/spotify.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class SpotifyAuthController {
    private readonly spotify;
    private readonly prisma;
    private readonly config;
    constructor(spotify: SpotifyService, prisma: PrismaService, config: ConfigService);
    redirectToSpotify(venueId: string, eventId: string, barId: string, res: Response): void;
    spotifyCallback(code: string, error: string | undefined, state: string, res: Response): Promise<void>;
    disconnectSpotify(body: {
        venueId?: string;
        eventId?: string;
    }, req: any): Promise<{
        ok: boolean;
    }>;
}
