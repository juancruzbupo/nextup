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
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie(COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: MAX_AGE,
        path: '/',
      });
    }

    // Attach to request for easy access
    (req as any).sessionId = sessionId;
    next();
  }
}
