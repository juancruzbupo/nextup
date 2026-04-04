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
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const events_service_1 = require("./events.service");
const spotify_service_1 = require("../spotify/spotify.service");
const events_gateway_1 = require("./events.gateway");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let EventsController = class EventsController {
    events;
    spotify;
    gateway;
    constructor(events, spotify, gateway) {
        this.events = events;
        this.spotify = spotify;
        this.gateway = gateway;
    }
    create(body, req) {
        return this.events.create(body, req.user.userId);
    }
    getMyEvents(req) {
        return this.events.findByOwner(req.user.userId);
    }
    findByCode(code) {
        return this.events.findByAccessCode(code);
    }
    getQueue(eventId) {
        return this.events.getQueue(eventId);
    }
    async addSong(eventId, body, req) {
        const sessionId = req.sessionId || req.headers['x-session-id'];
        if (!sessionId)
            return { ok: false, error: 'No session' };
        const result = await this.events.addSong(eventId, body, sessionId);
        if (!result.alreadyExists) {
            const queue = await this.events.getQueue(eventId);
            this.gateway.emitQueueUpdate(eventId, queue);
        }
        return result;
    }
    async search(eventId, query) {
        return this.spotify.searchTracksForEvent(eventId, query);
    }
    async nowPlaying(eventId) {
        return this.spotify.getCurrentTrackForEvent(eventId);
    }
    async skip(eventId, pin) {
        const valid = await this.events.verifyPin(eventId, pin);
        if (!valid)
            return { ok: false, error: 'PIN incorrecto' };
        await this.spotify.skipTrackForEvent(eventId);
        return { ok: true };
    }
    async deleteSong(eventId, songId, pin) {
        const valid = await this.events.verifyPin(eventId, pin);
        if (!valid)
            return { ok: false, error: 'PIN incorrecto' };
        await this.events.deleteSong(songId);
        const queue = await this.events.getQueue(eventId);
        this.gateway.emitQueueUpdate(eventId, queue);
        return { ok: true };
    }
    async update(eventId, body, req) {
        await this.events.assertOwnership(eventId, req.user.userId);
        return this.events.update(eventId, body);
    }
    async cancel(eventId, req) {
        await this.events.assertOwnership(eventId, req.user.userId);
        return this.events.cancel(eventId);
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "getMyEvents", null);
__decorate([
    (0, common_1.Get)('code/:accessCode'),
    __param(0, (0, common_1.Param)('accessCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "findByCode", null);
__decorate([
    (0, common_1.Get)(':eventId/queue'),
    __param(0, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "getQueue", null);
__decorate([
    (0, common_1.Post)(':eventId/queue/add'),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "addSong", null);
__decorate([
    (0, common_1.Get)(':eventId/queue/search'),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':eventId/now-playing'),
    __param(0, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "nowPlaying", null);
__decorate([
    (0, common_1.Post)(':eventId/skip'),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Body)('adminPin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "skip", null);
__decorate([
    (0, common_1.Delete)(':eventId/songs/:songId'),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Param)('songId')),
    __param(2, (0, common_1.Body)('adminPin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "deleteSong", null);
__decorate([
    (0, common_1.Patch)(':eventId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':eventId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "cancel", null);
exports.EventsController = EventsController = __decorate([
    (0, common_1.Controller)('events'),
    __metadata("design:paramtypes", [events_service_1.EventsService,
        spotify_service_1.SpotifyService,
        events_gateway_1.EventsGateway])
], EventsController);
//# sourceMappingURL=events.controller.js.map