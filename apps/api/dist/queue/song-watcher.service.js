"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SongWatcherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SongWatcherService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const spotify_service_1 = require("../spotify/spotify.service");
const queue_service_1 = require("./queue.service");
const queue_gateway_1 = require("./queue.gateway");
let SongWatcherService = SongWatcherService_1 = class SongWatcherService {
    prisma;
    spotify;
    queueService;
    gateway;
    logger = new common_1.Logger(SongWatcherService_1.name);
    currentTracks = new Map();
    enqueuedSongs = new Map();
    running = true;
    pollTimeout = null;
    pollResolve = null;
    constructor(prisma, spotify, queueService, gateway) {
        this.prisma = prisma;
        this.spotify = spotify;
        this.queueService = queueService;
        this.gateway = gateway;
    }
    onModuleInit() {
        this.startPolling();
    }
    onModuleDestroy() {
        this.running = false;
        if (this.pollTimeout)
            clearTimeout(this.pollTimeout);
        if (this.pollResolve)
            this.pollResolve();
    }
    async startPolling() {
        while (this.running) {
            const nextPollMs = await this.pollAllVenues();
            await new Promise((resolve) => {
                this.pollResolve = resolve;
                this.pollTimeout = setTimeout(resolve, nextPollMs);
            });
        }
    }
    async pollAllVenues() {
        try {
            const bars = await this.prisma.venue.findMany({
                where: { spotifyRefreshToken: { not: null }, active: true },
            });
            if (bars.length === 0)
                return 10000;
            const results = await Promise.all(bars.map((bar) => this.watchVenue(bar.id)));
            const minDelay = Math.min(...results.filter((r) => r > 0));
            return minDelay || 4000;
        }
        catch (error) {
            this.logger.error(`pollAllVenues failed: ${error}`);
            return 5000;
        }
    }
    async watchVenue(venueId) {
        try {
            const current = await this.spotify.getCurrentTrack(venueId);
            if (!current) {
                this.currentTracks.delete(venueId);
                return 10000;
            }
            const previousTrackId = this.currentTracks.get(venueId);
            let queueChanged = false;
            const markedPlaying = await this.queueService.markAsPlayed(current.trackId, venueId);
            if (markedPlaying) {
                this.logger.log(`Now playing from queue: "${current.name}" at bar ${venueId}`);
                this.enqueuedSongs.delete(venueId);
                queueChanged = true;
            }
            if (previousTrackId && previousTrackId !== current.trackId) {
                this.logger.log(`Track changed at bar ${venueId}: → ${current.name}`);
                this.enqueuedSongs.delete(venueId);
                queueChanged = true;
            }
            const remainingMs = current.durationMs - current.progressMs;
            if (remainingMs < 30000) {
                await this.ensureNextSongQueued(venueId, current.trackId);
            }
            if (queueChanged) {
                const queue = await this.queueService.getQueue(venueId);
                this.gateway.emitQueueUpdate(venueId, queue);
            }
            if (!previousTrackId || previousTrackId !== current.trackId) {
                this.gateway.emitNowPlaying(venueId, current);
            }
            this.currentTracks.set(venueId, current.trackId);
            if (remainingMs < 10000)
                return 1500;
            if (remainingMs < 20000)
                return 3000;
            return 5000;
        }
        catch (error) {
            this.logger.error(`Watch failed for bar ${venueId}: ${error}`);
            return 5000;
        }
    }
    async ensureNextSongQueued(venueId, currentTrackId) {
        const nextSong = await this.queueService.getNextSong(venueId);
        if (!nextSong)
            return;
        if (nextSong.spotifyId === currentTrackId)
            return;
        if (this.enqueuedSongs.get(venueId) === nextSong.spotifyId)
            return;
        try {
            await this.spotify.addToQueue(venueId, nextSong.spotifyUri);
            this.enqueuedSongs.set(venueId, nextSong.spotifyId);
            this.logger.log(`Queued "${nextSong.title}" in Spotify for bar ${venueId}`);
        }
        catch (error) {
            this.logger.error(`Failed to queue song for bar ${venueId}: ${error}`);
        }
    }
};
exports.SongWatcherService = SongWatcherService;
exports.SongWatcherService = SongWatcherService = SongWatcherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        spotify_service_1.SpotifyService,
        queue_service_1.QueueService,
        queue_gateway_1.QueueGateway])
], SongWatcherService);
//# sourceMappingURL=song-watcher.service.js.map