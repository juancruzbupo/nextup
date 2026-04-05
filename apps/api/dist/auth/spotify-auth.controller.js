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
const jwt_auth_guard_1 = require("./jwt-auth.guard");
let SpotifyAuthController = class SpotifyAuthController {
    spotify;
    prisma;
    config;
    constructor(spotify, prisma, config) {
        this.spotify = spotify;
        this.prisma = prisma;
        this.config = config;
    }
    redirectToSpotify(venueId, eventId, barId, res) {
        const id = venueId || barId;
        const state = eventId ? `event:${eventId}` : id;
        const url = this.spotify.getAuthUrl(state);
        res.redirect(url);
    }
    async spotifyCallback(code, error, state, res) {
        const frontendUrl = this.config.get('FRONTEND_URL');
        if (error || !code || !state) {
            res.redirect(`${frontendUrl}/dashboard?error=spotify_denied`);
            return;
        }
        const tokens = await this.spotify.exchangeCode(code);
        const tokenData = {
            spotifyAccessToken: tokens.access_token,
            spotifyRefreshToken: tokens.refresh_token,
            tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        };
        if (state.startsWith('event:')) {
            const eventId = state.replace('event:', '');
            await this.prisma.event.update({ where: { id: eventId }, data: tokenData });
            res.redirect(`${frontendUrl}/dashboard/eventos/${eventId}`);
        }
        else {
            const venue = await this.prisma.venue.update({ where: { id: state }, data: tokenData });
            res.redirect(`${frontendUrl}/dashboard/${venue.slug}`);
        }
    }
    async disconnectSpotify(body, req) {
        const userId = req.user.userId;
        const clearData = { spotifyAccessToken: null, spotifyRefreshToken: null, tokenExpiresAt: null };
        if (body.eventId) {
            const event = await this.prisma.event.findUniqueOrThrow({ where: { id: body.eventId } });
            if (event.ownerId !== userId)
                return { ok: false };
            await this.prisma.event.update({ where: { id: body.eventId }, data: clearData });
        }
        else if (body.venueId) {
            const venue = await this.prisma.venue.findUniqueOrThrow({ where: { id: body.venueId } });
            if (venue.userId !== userId)
                return { ok: false };
            await this.prisma.venue.update({ where: { id: body.venueId }, data: clearData });
        }
        return { ok: true };
    }
};
exports.SpotifyAuthController = SpotifyAuthController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('venueId')),
    __param(1, (0, common_1.Query)('eventId')),
    __param(2, (0, common_1.Query)('barId')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
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
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpotifyAuthController.prototype, "disconnectSpotify", null);
exports.SpotifyAuthController = SpotifyAuthController = __decorate([
    (0, common_1.Controller)('auth/spotify'),
    __metadata("design:paramtypes", [spotify_service_1.SpotifyService,
        prisma_service_1.PrismaService,
        config_1.ConfigService])
], SpotifyAuthController);
//# sourceMappingURL=spotify-auth.controller.js.map