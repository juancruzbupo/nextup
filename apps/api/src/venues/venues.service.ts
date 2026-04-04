import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

// Fields safe to return publicly (no tokens, no PIN)
const PUBLIC_FIELDS = {
  id: true, name: true, slug: true, active: true, backgroundImage: true,
} as const;

// Fields for the owner (includes PIN but never tokens)
const OWNER_FIELDS = {
  ...PUBLIC_FIELDS, adminPin: true, userId: true, createdAt: true, updatedAt: true,
  spotifyRefreshToken: true, // only to check "connected" status, never sent raw
} as const;

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; slug: string; adminPin?: string }, userId: string) {
    const venue = await this.prisma.venue.create({
      data: { ...data, userId },
      select: OWNER_FIELDS,
    });
    return venue;
  }

  async findBySlugPublic(slug: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { slug },
      select: PUBLIC_FIELDS,
    });
    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async findBySlug(slug: string) {
    const venue = await this.prisma.venue.findUnique({ where: { slug } });
    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async findById(id: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id } });
    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async findByUserId(userId: string) {
    return this.prisma.venue.findMany({
      where: { userId },
      select: OWNER_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSpotifyStatus(id: string) {
    const venue = await this.findById(id);
    return {
      connected: !!venue.spotifyRefreshToken,
      tokenValid: !!venue.spotifyAccessToken && !!venue.tokenExpiresAt && new Date(venue.tokenExpiresAt) > new Date(),
    };
  }

  async verifyPin(slug: string, pin: string) {
    const venue = await this.findBySlug(slug);
    if (!venue.adminPin || !pin) return { ok: false };
    // Constant-time comparison to prevent timing attacks
    const a = Buffer.from(venue.adminPin);
    const b = Buffer.from(pin);
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    return { ok };
  }

  async update(slug: string, data: { name?: string; adminPin?: string; backgroundImage?: string }) {
    return this.prisma.venue.update({
      where: { slug },
      data,
      select: OWNER_FIELDS,
    });
  }

  async assertOwnership(slug: string, userId: string) {
    const venue = await this.findBySlug(slug);
    if (venue.userId !== userId) {
      throw new ForbiddenException('No tenés permiso para este venue');
    }
    return venue;
  }

  async delete(slug: string) {
    return this.prisma.venue.delete({ where: { slug } });
  }
}
