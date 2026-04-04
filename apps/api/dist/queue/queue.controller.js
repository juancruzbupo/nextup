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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueController = void 0;
const common_1 = require("@nestjs/common");
const queue_service_1 = require("./queue.service");
const queue_gateway_1 = require("./queue.gateway");
const spotify_service_1 = require("../spotify/spotify.service");
const venue_admin_guard_1 = require("../auth/venue-admin.guard");
let QueueController = class QueueController {
    queueService;
    gateway;
    spotify;
    constructor(queueService, gateway, spotify) {
        this.queueService = queueService;
        this.gateway = gateway;
        this.spotify = spotify;
    }
    getQueue(venueId) {
        return this.queueService.getQueue(venueId);
    }
    async addSong(venueId, body, req) {
        const sessionId = req.sessionId || req.headers['x-session-id'];
        if (!sessionId)
            return { ok: false, error: 'No session' };
        const result = await this.queueService.addSong(venueId, body, sessionId);
        if (!result.alreadyExists) {
            const queue = await this.queueService.getQueue(venueId);
            this.gateway.emitQueueUpdate(venueId, queue);
        }
        return result;
    }
    search(venueId, query) {
        return this.spotify.searchTracks(venueId, query);
    }
    nowPlaying(venueId) {
        return this.spotify.getCurrentTrack(venueId);
    }
    async skip(venueId) {
        await this.spotify.skipTrack(venueId);
        return { ok: true };
    }
    async playSong(venueId, songId) {
        const song = await this.queueService.findSong(songId);
        if (!song || song.venueId !== venueId)
            return { ok: false, error: 'SONG_NOT_FOUND' };
        const result = await this.spotify.playTrack(venueId, song.spotifyUri);
        return result;
    }
    async deleteSong(venueId, songId) {
        await this.queueService.deleteSong(songId);
        const queue = await this.queueService.getQueue(venueId);
        this.gateway.emitQueueUpdate(venueId, queue);
        return { ok: true };
    }
    getHistory(venueId) {
        return this.queueService.getHistory(venueId);
    }
    getTopTracks(venueId, limit) {
        return this.queueService.getTopTracks(venueId, limit ? parseInt(limit, 10) : 15);
    }
    getStats(venueId) {
        return this.queueService.getStats(venueId);
    }
};
exports.QueueController = QueueController;
__decorate([
    (0, common_1.Get)(':venueId'),
    __param(0, (0, common_1.Param)('venueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "getQueue", null);
__decorate([
    (0, common_1.Post)(':venueId/add'),
    __param(0, (0, common_1.Param)('venueId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "addSong", null);
__decorate([
    (0, common_1.Get)(':venueId/search'),
    __param(0, (0, common_1.Param)('venueId')),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':venueId/now-playing'),
    __param(0, (0, common_1.Param)('venueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "nowPlaying", null);
__decorate([
    (0, common_1.Post)(':venueId/skip'),
    (0, common_1.UseGuards)(venue_admin_guard_1.VenueAdminGuard),
    __param(0, (0, common_1.Param)('venueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "skip", null);
__decorate([
    (0, common_1.Post)(':venueId/play/:songId'),
    (0, common_1.UseGuards)(venue_admin_guard_1.VenueAdminGuard),
    __param(0, (0, common_1.Param)('venueId')),
    __param(1, (0, common_1.Param)('songId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "playSong", null);
__decorate([
    (0, common_1.Delete)(':venueId/songs/:songId'),
    (0, common_1.UseGuards)(venue_admin_guard_1.VenueAdminGuard),
    __param(0, (0, common_1.Param)('venueId')),
    __param(1, (0, common_1.Param)('songId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "deleteSong", null);
__decorate([
    (0, common_1.Get)(':venueId/history'),
    __param(0, (0, common_1.Param)('venueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':venueId/top-tracks'),
    __param(0, (0, common_1.Param)('venueId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "getTopTracks", null);
__decorate([
    (0, common_1.Get)(':venueId/stats'),
    __param(0, (0, common_1.Param)('venueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "getStats", null);
exports.QueueController = QueueController = __decorate([
    (0, common_1.Controller)('queue'),
    __metadata("design:paramtypes", [queue_service_1.QueueService,
        queue_gateway_1.QueueGateway,
        spotify_service_1.SpotifyService])
], QueueController);
//# sourceMappingURL=queue.controller.js.map