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
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const throttler_1 = require("@nestjs/throttler");
const events_service_1 = require("./events.service");
let EventsGateway = class EventsGateway {
    eventsService;
    server;
    constructor(eventsService) {
        this.eventsService = eventsService;
    }
    async handleJoinEvent(payload, client) {
        client.join(payload.eventId);
        const queue = await this.eventsService.getQueue(payload.eventId);
        client.emit('queue-updated', { queue });
    }
    async handleVote(payload, client) {
        const song = await this.eventsService.findSong(payload.songId);
        if (!song || song.eventId !== payload.eventId) {
            client.emit('vote-error', { message: 'Canción no encontrada' });
            return;
        }
        const cookies = client.handshake.headers.cookie || '';
        const match = cookies.match(/nextup_session=([^;]+)/);
        const sessionId = match?.[1] || payload.sessionId;
        if (!sessionId) {
            client.emit('vote-error', { message: 'Sin sesión' });
            return;
        }
        const result = await this.eventsService.vote(payload.songId, sessionId);
        if (result.alreadyVoted) {
            client.emit('vote-error', { message: 'Ya votaste esta canción' });
            return;
        }
        const queue = await this.eventsService.getQueue(payload.eventId);
        this.emitQueueUpdate(payload.eventId, queue);
    }
    emitQueueUpdate(eventId, queue) {
        this.server.to(eventId).emit('queue-updated', { queue });
    }
    emitNowPlaying(eventId, track) {
        this.server.to(eventId).emit('now-playing-changed', { track });
    }
    emitEventEnded(eventId) {
        this.server.to(eventId).emit('event-ended', { message: 'Este evento ha finalizado' });
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-event'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleJoinEvent", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('vote-event'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleVote", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, websockets_1.WebSocketGateway)({
        namespace: '/events',
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map