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
exports.VenuesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
const PUBLIC_FIELDS = {
    id: true, name: true, slug: true, active: true, backgroundImage: true,
};
const OWNER_FIELDS = {
    ...PUBLIC_FIELDS, adminPin: true, userId: true, createdAt: true, updatedAt: true,
    spotifyRefreshToken: true,
};
let VenuesService = class VenuesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data, userId) {
        const venue = await this.prisma.venue.create({
            data: { ...data, userId },
            select: OWNER_FIELDS,
        });
        return venue;
    }
    async findBySlugPublic(slug) {
        const venue = await this.prisma.venue.findUnique({
            where: { slug },
            select: PUBLIC_FIELDS,
        });
        if (!venue)
            throw new common_1.NotFoundException('Venue not found');
        return venue;
    }
    async findBySlug(slug) {
        const venue = await this.prisma.venue.findUnique({ where: { slug } });
        if (!venue)
            throw new common_1.NotFoundException('Venue not found');
        return venue;
    }
    async findById(id) {
        const venue = await this.prisma.venue.findUnique({ where: { id } });
        if (!venue)
            throw new common_1.NotFoundException('Venue not found');
        return venue;
    }
    async findByUserId(userId) {
        return this.prisma.venue.findMany({
            where: { userId },
            select: OWNER_FIELDS,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getSpotifyStatus(id) {
        const venue = await this.findById(id);
        return {
            connected: !!venue.spotifyRefreshToken,
            tokenValid: !!venue.spotifyAccessToken && !!venue.tokenExpiresAt && new Date(venue.tokenExpiresAt) > new Date(),
        };
    }
    async verifyPin(slug, pin) {
        const venue = await this.findBySlug(slug);
        if (!venue.adminPin || !pin)
            return { ok: false };
        const a = Buffer.from(venue.adminPin);
        const b = Buffer.from(pin);
        const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
        return { ok };
    }
    async update(slug, data) {
        return this.prisma.venue.update({
            where: { slug },
            data,
            select: OWNER_FIELDS,
        });
    }
    async assertOwnership(slug, userId) {
        const venue = await this.findBySlug(slug);
        if (venue.userId !== userId) {
            throw new common_1.ForbiddenException('No tenés permiso para este venue');
        }
        return venue;
    }
    async delete(slug) {
        return this.prisma.venue.delete({ where: { slug } });
    }
};
exports.VenuesService = VenuesService;
exports.VenuesService = VenuesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VenuesService);
//# sourceMappingURL=venues.service.js.map