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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    config;
    constructor(prisma, jwtService, config) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
    }
    async register(dto) {
        if (!dto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
            throw new common_1.BadRequestException('Email inválido');
        }
        if (!dto.password || dto.password.length < 6) {
            throw new common_1.BadRequestException('La contraseña debe tener al menos 6 caracteres');
        }
        if (!dto.name?.trim()) {
            throw new common_1.BadRequestException('El nombre es requerido');
        }
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
        if (existing)
            throw new common_1.ConflictException('El email ya está registrado');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase().trim(),
                passwordHash,
                name: dto.name.trim(),
            },
        });
        const tokens = await this.generateTokens(user.id, user.email);
        return { user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }, ...tokens };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
        if (!user)
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        const tokens = await this.generateTokens(user.id, user.email);
        return { user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }, ...tokens };
    }
    async generateTokens(userId, email) {
        const accessToken = this.jwtService.sign({ sub: userId, email });
        const refreshToken = this.jwtService.sign({ sub: userId }, {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });
        const tokenHash = await bcrypt.hash(refreshToken, 10);
        await this.prisma.refreshToken.create({
            data: {
                token: tokenHash,
                userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return { accessToken, refreshToken };
    }
    async refreshTokens(oldRefreshToken) {
        try {
            const payload = this.jwtService.verify(oldRefreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
            const storedTokens = await this.prisma.refreshToken.findMany({
                where: { userId: payload.sub },
                orderBy: { createdAt: 'desc' },
                take: 5,
            });
            let matchedToken = null;
            for (const t of storedTokens) {
                if (await bcrypt.compare(oldRefreshToken, t.token)) {
                    matchedToken = t;
                    break;
                }
            }
            if (!matchedToken)
                throw new common_1.UnauthorizedException();
            await this.prisma.refreshToken.delete({ where: { id: matchedToken.id } });
            await this.prisma.refreshToken.deleteMany({
                where: { userId: payload.sub, expiresAt: { lt: new Date() } },
            });
            const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
            return this.generateTokens(user.id, user.email);
        }
        catch {
            throw new common_1.UnauthorizedException('Token de refresh inválido');
        }
    }
    async logout(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
            await this.prisma.refreshToken.deleteMany({
                where: { userId: payload.sub },
            });
        }
        catch {
        }
    }
    async validateUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return null;
        return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map