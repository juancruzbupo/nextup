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
exports.BarsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BarsService = class BarsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.bar.create({ data });
    }
    async findBySlug(slug) {
        const bar = await this.prisma.bar.findUnique({ where: { slug } });
        if (!bar)
            throw new common_1.NotFoundException('Bar not found');
        return bar;
    }
    async findById(id) {
        const bar = await this.prisma.bar.findUnique({ where: { id } });
        if (!bar)
            throw new common_1.NotFoundException('Bar not found');
        return bar;
    }
    async getSpotifyStatus(id) {
        const bar = await this.findById(id);
        return {
            connected: !!bar.spotifyRefreshToken,
            tokenValid: !!bar.spotifyAccessToken && !!bar.tokenExpiresAt && new Date(bar.tokenExpiresAt) > new Date(),
        };
    }
    async verifyPin(slug, pin) {
        const bar = await this.findBySlug(slug);
        return { ok: bar.adminPin === pin };
    }
    async update(slug, data) {
        return this.prisma.bar.update({ where: { slug }, data });
    }
};
exports.BarsService = BarsService;
exports.BarsService = BarsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BarsService);
//# sourceMappingURL=bars.service.js.map