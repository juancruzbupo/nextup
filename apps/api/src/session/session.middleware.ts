import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

const COOKIE_NAME = 'nextup_session';
const MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let sessionId = req.cookies?.[COOKIE_NAME];

    if (!sessionId) {
      sessionId = randomUUID();
      res.cookie(COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: MAX_AGE,
        path: '/',
      });
    }

    // Attach to request for easy access
    (req as any).sessionId = sessionId;
    next();
  }
}
