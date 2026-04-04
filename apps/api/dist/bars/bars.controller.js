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
exports.BarsController = void 0;
const common_1 = require("@nestjs/common");
const bars_service_1 = require("./bars.service");
let BarsController = class BarsController {
    bars;
    constructor(bars) {
        this.bars = bars;
    }
    create(body) {
        return this.bars.create(body);
    }
    findBySlug(slug) {
        return this.bars.findBySlug(slug);
    }
    getSpotifyStatus(id) {
        return this.bars.getSpotifyStatus(id);
    }
    verifyPin(slug, body) {
        return this.bars.verifyPin(slug, body.pin);
    }
    update(slug, body) {
        return this.bars.update(slug, body);
    }
};
exports.BarsController = BarsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BarsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BarsController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Get)(':id/spotify-status'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BarsController.prototype, "getSpotifyStatus", null);
__decorate([
    (0, common_1.Post)(':slug/verify-pin'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BarsController.prototype, "verifyPin", null);
__decorate([
    (0, common_1.Patch)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BarsController.prototype, "update", null);
exports.BarsController = BarsController = __decorate([
    (0, common_1.Controller)('bars'),
    __metadata("design:paramtypes", [bars_service_1.BarsService])
], BarsController);
//# sourceMappingURL=bars.controller.js.map