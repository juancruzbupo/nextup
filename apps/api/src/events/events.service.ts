import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function generateAccessCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: {
      name: string;
      startsAt: string;
      endsAt: string;
      adminPin?: string;
      maxSongsPerUser?: number;
      allowExplicit?: boolean;
    },
    ownerId: string,
  ) {
    if (!data.name?.trim()) throw new BadRequestException('Nombre requerido');
    if (!data.startsAt || !data.endsAt) throw new BadRequestException('Fechas requeridas');

    const slug = toSlug(data.name) + '-' + Date.now().toString(36);
    let accessCode = generateAccessCode();

    // Ensure unique access code
    while (await this.prisma.event.findUnique({ where: { accessCode } })) {
      accessCode = generateAccessCode();
    }

    return this.prisma.event.create({
      data: {
        name: data.name.trim(),
        slug,
        accessCode,
        adminPin: data.adminPin,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        maxSongsPerUser: data.maxSongsPerUser ?? 3,
        allowExplicit: data.allowExplicit ?? true,
        ownerId,
      },
    });
  }

  async findByAccessCode(code: string) {
    const event = await this.prisma.event.findUnique({ where: { accessCode: code } });
    if (!event) throw new NotFoundException('Evento no encontrado');
    if (!event.active || new Date() > event.endsAt) {
      throw new NotFoundException('Evento finalizado');
    }
    return {
      id: event.id,
      name: event.name,
      accessCode: event.accessCode,
      active: event.active,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      maxSongsPerUser: event.maxSongsPerUser,
      spotifyConnected: !!event.spotifyRefreshToken,
      enableDedications: event.enableDedications,
      enableGroupNames: event.enableGroupNames,
      enableReactions: event.enableReactions,
    };
  }

  async findByOwner(ownerId: string) {
    const events = await this.prisma.event.findMany({
      where: { ownerId },
      orderBy: { startsAt: 'desc' },
      select: {
        id: true, name: true, slug: true, accessCode: true,
        startsAt: true, endsAt: true, active: true, createdAt: true,
        spotifyRefreshToken: true,
      },
    });
    // Don't expose raw token — return boolean
    return events.map(({ spotifyRefreshToken, ...rest }) => ({
      ...rest,
      spotifyConnected: !!spotifyRefreshToken,
    }));
  }

  async findById(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Evento no encontrado');
    return event;
  }

  async assertOwnership(eventId: string, userId: string) {
    const event = await this.findById(eventId);
    if (event.ownerId !== userId) throw new ForbiddenException();
    return event;
  }

  async update(eventId: string, data: { name?: string; endsAt?: string; maxSongsPerUser?: number; allowExplicit?: boolean; adminPin?: string; enableDedications?: boolean; enableGroupNames?: boolean; enableReactions?: boolean }) {
    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.endsAt ? { endsAt: new Date(data.endsAt) } : {}),
        ...(data.maxSongsPerUser !== undefined ? { maxSongsPerUser: data.maxSongsPerUser } : {}),
        ...(data.allowExplicit !== undefined ? { allowExplicit: data.allowExplicit } : {}),
        ...(data.adminPin ? { adminPin: data.adminPin } : {}),
        ...(data.enableDedications !== undefined ? { enableDedications: data.enableDedications } : {}),
        ...(data.enableGroupNames !== undefined ? { enableGroupNames: data.enableGroupNames } : {}),
        ...(data.enableReactions !== undefined ? { enableReactions: data.enableReactions } : {}),
      },
    });
  }

  async cancel(eventId: string) {
    return this.prisma.event.update({
      where: { id: eventId },
      data: { active: false },
    });
  }

  // Queue methods
  async getQueue(eventId: string) {
    return this.prisma.eventSong.findMany({
      where: { eventId, played: false },
      orderBy: [{ votes: 'desc' }, { createdAt: 'asc' }],
      take: 200,
      select: { id: true, eventId: true, spotifyId: true, spotifyUri: true, title: true, artist: true, albumArt: true, dedication: true, groupName: true, votes: true, played: true, playedAt: true, createdAt: true, addedBy: true },
    });
  }

  async addSong(
    eventId: string,
    data: { spotifyId: string; spotifyUri: string; title: string; artist: string; albumArt?: string; dedication?: string; groupName?: string },
    sessionId: string,
  ) {
    const existing = await this.prisma.eventSong.findFirst({
      where: { eventId, spotifyId: data.spotifyId, played: false },
    });
    if (existing) return { alreadyExists: true, song: existing };

    // Cooldown: 30 minutes (uses playedAt for accuracy)
    const recentlyPlayed = await this.prisma.eventSong.findFirst({
      where: {
        eventId,
        spotifyId: data.spotifyId,
        played: true,
        playedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
    });
    if (recentlyPlayed) return { cooldown: true, song: recentlyPlayed };

    // Enforce maxSongsPerUser
    const event = await this.findById(eventId);
    const userSongCount = await this.prisma.eventSong.count({
      where: { eventId, addedBy: sessionId, played: false },
    });
    if (userSongCount >= event.maxSongsPerUser) {
      return { limitReached: true, max: event.maxSongsPerUser };
    }

    const song = await this.prisma.eventSong.create({
      data: { eventId, addedBy: sessionId, ...data },
    });

    await this.prisma.eventVote.create({
      data: { songId: song.id, sessionId },
    });

    return { alreadyExists: false, song };
  }

  async vote(songId: string, sessionId: string) {
    try {
      const [, song] = await this.prisma.$transaction([
        this.prisma.eventVote.create({ data: { songId, sessionId } }),
        this.prisma.eventSong.update({
          where: { id: songId },
          data: { votes: { increment: 1 } },
        }),
      ]);
      return { alreadyVoted: false, song };
    } catch (error: any) {
      if (error?.code === 'P2002') return { alreadyVoted: true };
      throw error;
    }
  }

  async getHistory(eventId: string) {
    return this.prisma.eventSong.findMany({
      where: { eventId, played: true },
      orderBy: { playedAt: 'desc' },
      take: 50,
    });
  }

  async getStats(eventId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalPlayed = await this.prisma.eventSong.count({
      where: { eventId, played: true },
    });

    const totalVotes = await this.prisma.eventSong.aggregate({
      where: { eventId },
      _sum: { votes: true },
    });

    const mostVoted = await this.prisma.eventSong.findFirst({
      where: { eventId },
      orderBy: { votes: 'desc' },
    });

    return {
      totalPlayed,
      totalVotes: totalVotes._sum.votes || 0,
      mostVoted,
    };
  }

  async getMyStats(eventId: string, sessionId: string) {
    const [songsAdded, votesGiven, topSong] = await Promise.all([
      this.prisma.eventSong.count({
        where: { eventId, addedBy: sessionId },
      }),
      this.prisma.eventVote.count({
        where: { sessionId, song: { eventId } },
      }),
      this.prisma.eventSong.findFirst({
        where: { eventId, addedBy: sessionId },
        orderBy: { votes: 'desc' },
        select: { title: true, artist: true, votes: true, albumArt: true },
      }),
    ]);
    return { songsAdded, votesGiven, topSong };
  }

  async getNextSong(eventId: string) {
    return this.prisma.eventSong.findFirst({
      where: { eventId, played: false },
      orderBy: [{ votes: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async markAsPlayed(spotifyId: string, eventId: string): Promise<boolean> {
    const song = await this.prisma.eventSong.findFirst({
      where: { eventId, spotifyId, played: false },
    });
    if (song) {
      await this.prisma.eventSong.update({
        where: { id: song.id },
        data: { played: true, playedAt: new Date() },
      });
      return true;
    }
    return false;
  }

  async findSong(songId: string) {
    return this.prisma.eventSong.findUnique({ where: { id: songId } });
  }

  async deleteSong(songId: string) {
    await this.prisma.eventVote.deleteMany({ where: { songId } });
    return this.prisma.eventSong.delete({ where: { id: songId } });
  }

  async verifyPin(eventId: string, pin: string) {
    const event = await this.findById(eventId);
    if (!event.adminPin || !pin) return false;
    const crypto = await import('crypto');
    const a = Buffer.from(event.adminPin);
    const b = Buffer.from(pin);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  // Auto-expire events
  async deactivateExpired() {
    const now = new Date();
    await this.prisma.event.updateMany({
      where: { active: true, endsAt: { lt: now } },
      data: { active: false },
    });
  }
}
