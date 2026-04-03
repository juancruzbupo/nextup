import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  async getQueue(venueId: string) {
    return this.prisma.queuedSong.findMany({
      where: { venueId, played: false },
      orderBy: { votes: 'desc' },
    });
  }

  async addSong(
    venueId: string,
    data: {
      spotifyId: string;
      spotifyUri: string;
      title: string;
      artist: string;
      albumArt?: string;
    },
    sessionId: string,
  ) {
    const existing = await this.prisma.queuedSong.findFirst({
      where: { venueId, spotifyId: data.spotifyId, played: false },
    });

    if (existing) {
      return { alreadyExists: true, song: existing };
    }

    const song = await this.prisma.queuedSong.create({
      data: { venueId, ...data },
    });

    await this.prisma.vote.create({
      data: { songId: song.id, sessionId },
    });

    return { alreadyExists: false, song };
  }

  async vote(songId: string, sessionId: string) {
    const existingVote = await this.prisma.vote.findUnique({
      where: { songId_sessionId: { songId, sessionId } },
    });

    if (existingVote) {
      return { alreadyVoted: true };
    }

    await this.prisma.vote.create({
      data: { songId, sessionId },
    });

    const song = await this.prisma.queuedSong.update({
      where: { id: songId },
      data: { votes: { increment: 1 } },
    });

    return { alreadyVoted: false, song };
  }

  async getNextSong(venueId: string) {
    return this.prisma.queuedSong.findFirst({
      where: { venueId, played: false },
      orderBy: [{ votes: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async markAsPlayed(spotifyId: string, venueId: string): Promise<boolean> {
    const song = await this.prisma.queuedSong.findFirst({
      where: { venueId, spotifyId, played: false },
    });

    if (song) {
      await this.prisma.queuedSong.update({
        where: { id: song.id },
        data: { played: true },
      });
      return true;
    }

    return false;
  }

  async findSong(songId: string) {
    return this.prisma.queuedSong.findUnique({ where: { id: songId } });
  }

  async deleteSong(songId: string) {
    await this.prisma.vote.deleteMany({ where: { songId } });
    return this.prisma.queuedSong.delete({ where: { id: songId } });
  }

  async getHistory(venueId: string) {
    return this.prisma.queuedSong.findMany({
      where: { venueId, played: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getStats(venueId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const venueSongs = await this.prisma.queuedSong.findMany({
      where: { venueId, createdAt: { gte: today } },
      select: { id: true },
    });
    const songIds = venueSongs.map((s) => s.id);

    const [totalPlayed, mostVoted, totalVotes] = await Promise.all([
      this.prisma.queuedSong.count({
        where: { venueId, played: true, createdAt: { gte: today } },
      }),
      this.prisma.queuedSong.findFirst({
        where: { venueId, createdAt: { gte: today } },
        orderBy: { votes: 'desc' },
      }),
      this.prisma.vote.count({
        where: {
          createdAt: { gte: today },
          songId: { in: songIds },
        },
      }),
    ]);

    return { totalPlayed, mostVoted, totalVotes };
  }
}
