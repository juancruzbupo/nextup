"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function generateAccessCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
function toSlug(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
let EventsService = class EventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data, ownerId) {
        if (!data.name?.trim())
            throw new common_1.BadRequestException('Nombre requerido');
        if (!data.startsAt || !data.endsAt)
            throw new common_1.BadRequestException('Fechas requeridas');
        const slug = toSlug(data.name) + '-' + Date.now().toString(36);
        let accessCode = generateAccessCode();
        while (await this.prisma.event.findUnique({ where: { accessCode } })) {
            accessCode = generateAccessCode();
        }
        return this.prisma.event.create({
            data: {
                name: data.name.trim(),
                slug,
                accessCode,
                adminPin: data.adminPin,
                startsAt: new Date(data.startsAt),
                endsAt: new Date(data.endsAt),
                maxSongsPerUser: data.maxSongsPerUser ?? 3,
                allowExplicit: data.allowExplicit ?? true,
                ownerId,
            },
        });
    }
    async findByAccessCode(code) {
        const event = await this.prisma.event.findUnique({ where: { accessCode: code } });
        if (!event)
            throw new common_1.NotFoundException('Evento no encontrado');
        if (!event.active || new Date() > event.endsAt) {
            throw new common_1.NotFoundException('Evento finalizado');
        }
        return {
            id: event.id,
            name: event.name,
            accessCode: event.accessCode,
            active: event.active,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            maxSongsPerUser: event.maxSongsPerUser,
            spotifyConnected: !!event.spotifyRefreshToken,
        };
    }
    async findByOwner(ownerId) {
        return this.prisma.event.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, slug: true, accessCode: true,
                startsAt: true, endsAt: true, active: true, createdAt: true,
                spotifyRefreshToken: true,
            },
        });
    }
    async findById(eventId) {
        const event = await this.prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw new common_1.NotFoundException('Evento no encontrado');
        return event;
    }
    async assertOwnership(eventId, userId) {
        const event = await this.findById(eventId);
        if (event.ownerId !== userId)
            throw new common_1.ForbiddenException();
        return event;
    }
    async update(eventId, data) {
        return this.prisma.event.update({
            where: { id: eventId },
            data: {
                ...(data.name ? { name: data.name.trim() } : {}),
                ...(data.endsAt ? { endsAt: new Date(data.endsAt) } : {}),
                ...(data.maxSongsPerUser !== undefined ? { maxSongsPerUser: data.maxSongsPerUser } : {}),
                ...(data.allowExplicit !== undefined ? { allowExplicit: data.allowExplicit } : {}),
                ...(data.adminPin ? { adminPin: data.adminPin } : {}),
            },
        });
    }
    async cancel(eventId) {
        return this.prisma.event.update({
            where: { id: eventId },
            data: { active: false },
        });
    }
    async getQueue(eventId) {
        return this.prisma.eventSong.findMany({
            where: { eventId, played: false },
            orderBy: { votes: 'desc' },
        });
    }
    async addSong(eventId, data, sessionId) {
        const existing = await this.prisma.eventSong.findFirst({
            where: { eventId, spotifyId: data.spotifyId, played: false },
        });
        if (existing)
            return { alreadyExists: true, song: existing };
        const recentlyPlayed = await this.prisma.eventSong.findFirst({
            where: {
                eventId,
                spotifyId: data.spotifyId,
                played: true,
                createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
            },
        });
        if (recentlyPlayed)
            return { cooldown: true, song: recentlyPlayed };
        const song = await this.prisma.eventSong.create({
            data: { eventId, ...data },
        });
        await this.prisma.eventVote.create({
            data: { songId: song.id, sessionId },
        });
        return { alreadyExists: false, song };
    }
    async vote(songId, sessionId) {
        try {
            const [, song] = await this.prisma.$transaction([
                this.prisma.eventVote.create({ data: { songId, sessionId } }),
                this.prisma.eventSong.update({
                    where: { id: songId },
                    data: { votes: { increment: 1 } },
                }),
            ]);
            return { alreadyVoted: false, song };
        }
        catch (error) {
            if (error?.code === 'P2002')
                return { alreadyVoted: true };
            throw error;
        }
    }
    async getNextSong(eventId) {
        return this.prisma.eventSong.findFirst({
            where: { eventId, played: false },
            orderBy: [{ votes: 'desc' }, { createdAt: 'asc' }],
        });
    }
    async markAsPlayed(spotifyId, eventId) {
        const song = await this.prisma.eventSong.findFirst({
            where: { eventId, spotifyId, played: false },
        });
        if (song) {
            await this.prisma.eventSong.update({
                where: { id: song.id },
                data: { played: true },
            });
            return true;
        }
        return false;
    }
    async findSong(songId) {
        return this.prisma.eventSong.findUnique({ where: { id: songId } });
    }
    async deleteSong(songId) {
        await this.prisma.eventVote.deleteMany({ where: { songId } });
        return this.prisma.eventSong.delete({ where: { id: songId } });
    }
    async verifyPin(eventId, pin) {
        const event = await this.findById(eventId);
        if (!event.adminPin || !pin)
            return false;
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        const a = Buffer.from(event.adminPin);
        const b = Buffer.from(pin);
        return a.length === b.length && crypto.timingSafeEqual(a, b);
    }
    async deactivateExpired() {
        const now = new Date();
        await this.prisma.event.updateMany({
            where: { active: true, endsAt: { lt: now } },
            data: { active: false },
        });
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsService);
//# sourceMappingURL=events.service.js.map