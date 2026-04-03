import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  async getQueue(barId: string) {
    return this.prisma.queuedSong.findMany({
      where: { barId, played: false },
      orderBy: { votes: 'desc' },
    });
  }

  async addSong(
    barId: string,
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
      where: { barId, spotifyId: data.spotifyId, played: false },
    });

    if (existing) {
      return { alreadyExists: true, song: existing };
    }

    const song = await this.prisma.queuedSong.create({
      data: { barId, ...data },
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

  async getNextSong(barId: string) {
    return this.prisma.queuedSong.findFirst({
      where: { barId, played: false },
      orderBy: { votes: 'desc' },
    });
  }

  async markAsPlayed(spotifyId: string, barId: string) {
    const song = await this.prisma.queuedSong.findFirst({
      where: { barId, spotifyId, played: false },
    });

    if (song) {
      await this.prisma.queuedSong.update({
        where: { id: song.id },
        data: { played: true },
      });
    }
  }

  async deleteSong(songId: string) {
    await this.prisma.vote.deleteMany({ where: { songId } });
    return this.prisma.queuedSong.delete({ where: { id: songId } });
  }

  async getHistory(barId: string) {
    return this.prisma.queuedSong.findMany({
      where: { barId, played: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getStats(barId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalPlayed, mostVoted, totalVotes] = await Promise.all([
      this.prisma.queuedSong.count({
        where: { barId, played: true, createdAt: { gte: today } },
      }),
      this.prisma.queuedSong.findFirst({
        where: { barId, createdAt: { gte: today } },
        orderBy: { votes: 'desc' },
      }),
      this.prisma.vote.count({
        where: { createdAt: { gte: today } },
      }),
    ]);

    return { totalPlayed, mostVoted, totalVotes };
  }
}
