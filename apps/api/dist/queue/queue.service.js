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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let QueueService = class QueueService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getQueue(venueId) {
        return this.prisma.queuedSong.findMany({
            where: { venueId, played: false },
            orderBy: { votes: 'desc' },
        });
    }
    async addSong(venueId, data, sessionId) {
        const existing = await this.prisma.queuedSong.findFirst({
            where: { venueId, spotifyId: data.spotifyId, played: false },
        });
        if (existing) {
            return { alreadyExists: true, song: existing };
        }
        const cooldownMs = 30 * 60 * 1000;
        const recentlyPlayed = await this.prisma.queuedSong.findFirst({
            where: {
                venueId,
                spotifyId: data.spotifyId,
                played: true,
                playedAt: { gte: new Date(Date.now() - cooldownMs) },
            },
        });
        if (recentlyPlayed) {
            return { cooldown: true, song: recentlyPlayed };
        }
        const song = await this.prisma.queuedSong.create({
            data: { venueId, ...data },
        });
        await this.prisma.vote.create({
            data: { songId: song.id, sessionId },
        });
        await this.prisma.venueTrack.upsert({
            where: { venueId_spotifyId: { venueId, spotifyId: data.spotifyId } },
            update: { totalRequests: { increment: 1 }, lastRequested: new Date() },
            create: { venueId, spotifyId: data.spotifyId, spotifyUri: data.spotifyUri, title: data.title, artist: data.artist, albumArt: data.albumArt, totalRequests: 1 },
        });
        return { alreadyExists: false, song };
    }
    async vote(songId, sessionId, venueId) {
        try {
            const [, song] = await this.prisma.$transaction([
                this.prisma.vote.create({
                    data: { songId, sessionId },
                }),
                this.prisma.queuedSong.update({
                    where: { id: songId },
                    data: { votes: { increment: 1 } },
                }),
            ]);
            await this.prisma.venueTrack.upsert({
                where: { venueId_spotifyId: { venueId: song.venueId, spotifyId: song.spotifyId } },
                update: { totalRequests: { increment: 1 } },
                create: { venueId: song.venueId, spotifyId: song.spotifyId, spotifyUri: song.spotifyUri, title: song.title, artist: song.artist, albumArt: song.albumArt, totalRequests: 1 },
            }).catch(() => { });
            return { alreadyVoted: false, song };
        }
        catch (error) {
            if (error?.code === 'P2002') {
                return { alreadyVoted: true };
            }
            throw error;
        }
    }
    async getNextSong(venueId) {
        return this.prisma.queuedSong.findFirst({
            where: { venueId, played: false },
            orderBy: [{ votes: 'desc' }, { createdAt: 'asc' }],
        });
    }
    async markAsPlayed(spotifyId, venueId) {
        const song = await this.prisma.queuedSong.findFirst({
            where: { venueId, spotifyId, played: false },
        });
        if (song) {
            await this.prisma.queuedSong.update({
                where: { id: song.id },
                data: { played: true, playedAt: new Date() },
            });
            await this.prisma.venueTrack.upsert({
                where: { venueId_spotifyId: { venueId, spotifyId: song.spotifyId } },
                update: { totalRequests: { increment: 1 }, lastRequested: new Date() },
                create: { venueId, spotifyId: song.spotifyId, spotifyUri: song.spotifyUri, title: song.title, artist: song.artist, albumArt: song.albumArt, totalRequests: 1 },
            });
            return true;
        }
        return false;
    }
    async findSong(songId) {
        return this.prisma.queuedSong.findUnique({ where: { id: songId } });
    }
    async deleteSong(songId) {
        await this.prisma.vote.deleteMany({ where: { songId } });
        return this.prisma.queuedSong.delete({ where: { id: songId } });
    }
    async getTopTracks(venueId, limit = 10) {
        return this.prisma.venueTrack.findMany({
            where: { venueId },
            orderBy: { totalRequests: 'desc' },
            take: limit,
        });
    }
    async getHistory(venueId) {
        return this.prisma.queuedSong.findMany({
            where: { venueId, played: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
    async getStats(venueId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalPlayed, mostVoted, totalVotes] = await Promise.all([
            this.prisma.queuedSong.count({
                where: { venueId, played: true, createdAt: { gte: today } },
            }),
            this.prisma.queuedSong.findFirst({
                where: { venueId, createdAt: { gte: today } },
                orderBy: { votes: 'desc' },
            }),
            this.prisma.vote.count({
                where: {
                    createdAt: { gte: today },
                    song: { venueId },
                },
            }),
        ]);
        return { totalPlayed, mostVoted, totalVotes };
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QueueService);
//# sourceMappingURL=queue.service.js.map