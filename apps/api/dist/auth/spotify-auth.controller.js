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
exports.SpotifyAuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const spotify_service_1 = require("../spotify/spotify.service");
const prisma_service_1 = require("../prisma/prisma.service");
let SpotifyAuthController = class SpotifyAuthController {
    spotify;
    prisma;
    config;
    constructor(spotify, prisma, config) {
        this.spotify = spotify;
        this.prisma = prisma;
        this.config = config;
    }
    redirectToSpotify(venueId, barId, res) {
        const id = venueId || barId;
        const url = this.spotify.getAuthUrl(id);
        res.redirect(url);
    }
    async spotifyCallback(code, error, venueId, res) {
        const frontendUrl = this.config.get('FRONTEND_URL');
        if (error) {
            res.redirect(`${frontendUrl}/dashboard?error=spotify_denied`);
            return;
        }
        const tokens = await this.spotify.exchangeCode(code);
        const venue = await this.prisma.venue.update({
            where: { id: venueId },
            data: {
                spotifyAccessToken: tokens.access_token,
                spotifyRefreshToken: tokens.refresh_token,
                tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            },
        });
        res.redirect(`${frontendUrl}/dashboard/${venue.slug}`);
    }
    async disconnectSpotify(venueId) {
        await this.prisma.venue.update({
            where: { id: venueId },
            data: {
                spotifyAccessToken: null,
                spotifyRefreshToken: null,
                tokenExpiresAt: null,
            },
        });
        return { ok: true };
    }
};
exports.SpotifyAuthController = SpotifyAuthController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('venueId')),
    __param(1, (0, common_1.Query)('barId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SpotifyAuthController.prototype, "redirectToSpotify", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('error')),
    __param(2, (0, common_1.Query)('state')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", Promise)
], SpotifyAuthController.prototype, "spotifyCallback", null);
__decorate([
    (0, common_1.Post)('disconnect'),
    __param(0, (0, common_1.Body)('venueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SpotifyAuthController.prototype, "disconnectSpotify", null);
exports.SpotifyAuthController = SpotifyAuthController = __decorate([
    (0, common_1.Controller)('auth/spotify'),
    __metadata("design:paramtypes", [spotify_service_1.SpotifyService,
        prisma_service_1.PrismaService,
        config_1.ConfigService])
], SpotifyAuthController);
//# sourceMappingURL=spotify-auth.controller.js.map