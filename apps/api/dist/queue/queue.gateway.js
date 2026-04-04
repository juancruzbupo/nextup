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
exports.QueueGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const throttler_1 = require("@nestjs/throttler");
const queue_service_1 = require("./queue.service");
let QueueGateway = class QueueGateway {
    queueService;
    server;
    constructor(queueService) {
        this.queueService = queueService;
    }
    async handleJoinVenue(payload, client) {
        client.join(payload.venueId);
        const queue = await this.queueService.getQueue(payload.venueId);
        client.emit('queue-updated', { queue });
    }
    async handleJoinBar(payload, client) {
        const venueId = payload.venueId || payload.barId;
        if (!venueId)
            return;
        client.join(venueId);
        const queue = await this.queueService.getQueue(venueId);
        client.emit('queue-updated', { queue });
    }
    getSessionId(client) {
        const cookies = client.handshake.headers.cookie || '';
        const match = cookies.match(/nextup_session=([^;]+)/);
        if (match)
            return match[1];
        return null;
    }
    async handleVote(payload, client) {
        const song = await this.queueService.findSong(payload.songId);
        if (!song || song.venueId !== payload.venueId) {
            client.emit('vote-error', { message: 'Canción no encontrada' });
            return;
        }
        const sessionId = this.getSessionId(client) || payload.sessionId;
        if (!sessionId) {
            client.emit('vote-error', { message: 'Sin sesión' });
            return;
        }
        const result = await this.queueService.vote(payload.songId, sessionId);
        if (result.alreadyVoted) {
            client.emit('vote-error', { message: 'Ya votaste esta canción' });
            return;
        }
        const queue = await this.queueService.getQueue(payload.venueId);
        this.emitQueueUpdate(payload.venueId, queue);
    }
    emitQueueUpdate(venueId, queue) {
        this.server.to(venueId).emit('queue-updated', { queue });
    }
    emitNowPlaying(venueId, track) {
        this.server.to(venueId).emit('now-playing-changed', { track });
    }
};
exports.QueueGateway = QueueGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], QueueGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-venue'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleJoinVenue", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-bar'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleJoinBar", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('vote'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleVote", null);
exports.QueueGateway = QueueGateway = __decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [queue_service_1.QueueService])
], QueueGateway);
//# sourceMappingURL=queue.gateway.js.map