import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; slug: string; adminPin?: string }, userId: string) {
    return this.prisma.venue.create({
      data: { ...data, userId },
    });
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
    return { ok: venue.adminPin === pin };
  }

  async update(slug: string, data: { name?: string; adminPin?: string; backgroundImage?: string }) {
    return this.prisma.venue.update({ where: { slug }, data });
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
