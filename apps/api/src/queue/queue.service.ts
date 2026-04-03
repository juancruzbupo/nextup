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

    // Update venue ranking
    await this.prisma.venueTrack.upsert({
      where: { venueId_spotifyId: { venueId, spotifyId: data.spotifyId } },
      update: { totalRequests: { increment: 1 }, lastRequested: new Date() },
      create: { venueId, spotifyId: data.spotifyId, spotifyUri: data.spotifyUri, title: data.title, artist: data.artist, albumArt: data.albumArt, totalRequests: 1 },
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

    // Update venue ranking
    await this.prisma.venueTrack.upsert({
      where: { venueId_spotifyId: { venueId: song.venueId, spotifyId: song.spotifyId } },
      update: { totalRequests: { increment: 1 } },
      create: { venueId: song.venueId, spotifyId: song.spotifyId, spotifyUri: song.spotifyUri, title: song.title, artist: song.artist, albumArt: song.albumArt, totalRequests: 1 },
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

      // Update venue ranking — song was played, boost its popularity
      await this.prisma.venueTrack.upsert({
        where: { venueId_spotifyId: { venueId, spotifyId: song.spotifyId } },
        update: { totalRequests: { increment: 1 }, lastRequested: new Date() },
        create: { venueId, spotifyId: song.spotifyId, spotifyUri: song.spotifyUri, title: song.title, artist: song.artist, albumArt: song.albumArt, totalRequests: 1 },
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

  async getTopTracks(venueId: string, limit = 15) {
    return this.prisma.venueTrack.findMany({
      where: { venueId },
      orderBy: { totalRequests: 'desc' },
      take: limit,
    });
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
