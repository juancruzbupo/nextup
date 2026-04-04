"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionMiddleware = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const COOKIE_NAME = 'nextup_session';
const MAX_AGE = 365 * 24 * 60 * 60 * 1000;
let SessionMiddleware = class SessionMiddleware {
    use(req, res, next) {
        let sessionId = req.cookies?.[COOKIE_NAME];
        if (!sessionId) {
            sessionId = (0, crypto_1.randomUUID)();
            res.cookie(COOKIE_NAME, sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: MAX_AGE,
                path: '/',
            });
        }
        req.sessionId = sessionId;
        next();
    }
};
exports.SessionMiddleware = SessionMiddleware;
exports.SessionMiddleware = SessionMiddleware = __decorate([
    (0, common_1.Injectable)()
], SessionMiddleware);
//# sourceMappingURL=session.middleware.js.map