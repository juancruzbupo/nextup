import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpotifyService } from '../spotify/spotify.service';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
export declare class SongWatcherService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly spotify;
    private readonly queueService;
    private readonly gateway;
    private readonly logger;
    private currentTracks;
    private enqueuedSongs;
    private running;
    private pollTimeout;
    private pollResolve;
    constructor(prisma: PrismaService, spotify: SpotifyService, queueService: QueueService, gateway: QueueGateway);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private startPolling;
    private pollAllVenues;
    private watchVenue;
    private ensureNextSongQueued;
}
