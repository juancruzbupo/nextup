import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BarsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; slug: string; adminPin?: string }) {
    return this.prisma.bar.create({ data });
  }

  async findBySlug(slug: string) {
    const bar = await this.prisma.bar.findUnique({ where: { slug } });
    if (!bar) throw new NotFoundException('Bar not found');
    return bar;
  }

  async findById(id: string) {
    const bar = await this.prisma.bar.findUnique({ where: { id } });
    if (!bar) throw new NotFoundException('Bar not found');
    return bar;
  }

  async getSpotifyStatus(id: string) {
    const bar = await this.findById(id);
    return {
      connected: !!bar.spotifyRefreshToken,
      tokenValid: !!bar.spotifyAccessToken && !!bar.tokenExpiresAt && new Date(bar.tokenExpiresAt) > new Date(),
    };
  }

  async verifyPin(slug: string, pin: string) {
    const bar = await this.findBySlug(slug);
    return { ok: bar.adminPin === pin };
  }

  async update(slug: string, data: { name?: string; adminPin?: string }) {
    return this.prisma.bar.update({ where: { slug }, data });
  }
}
