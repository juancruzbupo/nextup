import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Guard that accepts EITHER:
 * 1. Valid JWT cookie (venue owner)
 * 2. Valid PIN header x-admin-pin (staff quick-access)
 */
@Injectable()
export class VenueAdminGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const venueId = req.params.venueId;

    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException('Venue not found');

    // Try JWT cookie first (owner)
    const accessToken = req.cookies?.access_token;
    if (accessToken) {
      try {
        const payload = this.jwtService.verify(accessToken, {
          secret: this.config.get('JWT_SECRET'),
        });
        if (payload.sub === venue.userId) return true;
      } catch {
        // Token invalid or expired, try PIN
      }
    }

    // Try PIN header (staff) — constant-time comparison
    const pin = req.headers['x-admin-pin'];
    if (typeof pin === 'string' && pin.length > 0 && venue.adminPin) {
      const a = Buffer.from(venue.adminPin);
      const b = Buffer.from(pin);
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
    }

    throw new ForbiddenException('No autorizado');
  }
}
