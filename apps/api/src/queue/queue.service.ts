import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  async getQueue(venueId: string) {
    return this.prisma.queuedSong.findMany({
      where: { venueId, played: false },
      orderBy: [{ votes: 'desc' }, { createdAt: 'asc' }],
      select: { id: true, venueId: true, spotifyId: true, spotifyUri: true, title: true, artist: true, albumArt: true, dedication: true, votes: true, played: true, playedAt: true, createdAt: true },
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
      dedication?: string;
    },
    sessionId: string,
  ) {
    // Check if already in queue (not played)
    const existing = await this.prisma.queuedSong.findFirst({
      where: { venueId, spotifyId: data.spotifyId, played: false },
    });
    if (existing) {
      return { alreadyExists: true, song: existing };
    }

    // Cooldown: don't allow re-adding a song played in the last 30 minutes
    const cooldownMs = 30 * 60 * 1000;
    const recentlyPlayed = await this.prisma.queuedSong.findFirst({
      where: {
        venueId,
        spotifyId: data.spotifyId,
        played: true,
        playedAt: { gte: new Date(Date.now() - cooldownMs) },
      },
    });
    if (recentlyPlayed) {
      const elapsedMs = Date.now() - new Date(recentlyPlayed.playedAt!).getTime();
      const remainingMinutes = Math.ceil((cooldownMs - elapsedMs) / 60000);
      return { cooldown: true, song: recentlyPlayed, cooldownMinutes: remainingMinutes };
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

  async vote(songId: string, sessionId: string, venueId?: string) {
    try {
      // Atomic transaction: create vote + increment count together
      const [, song] = await this.prisma.$transaction([
        this.prisma.vote.create({
          data: { songId, sessionId },
        }),
        this.prisma.queuedSong.update({
          where: { id: songId },
          data: { votes: { increment: 1 } },
        }),
      ]);

      // Update venue ranking (outside transaction — non-critical)
      await this.prisma.venueTrack.upsert({
        where: { venueId_spotifyId: { venueId: song.venueId, spotifyId: song.spotifyId } },
        update: { totalRequests: { increment: 1 } },
        create: { venueId: song.venueId, spotifyId: song.spotifyId, spotifyUri: song.spotifyUri, title: song.title, artist: song.artist, albumArt: song.albumArt, totalRequests: 1 },
      }).catch(() => {}); // Non-critical, don't fail the vote

      return { alreadyVoted: false, song };
    } catch (error: any) {
      // Unique constraint violation = already voted (race condition safe)
      if (error?.code === 'P2002') {
        return { alreadyVoted: true };
      }
      throw error;
    }
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
        data: { played: true, playedAt: new Date() },
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

  async getTopTracks(venueId: string, limit = 10) {
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
          song: { venueId },
        },
      }),
    ]);

    return { totalPlayed, mostVoted, totalVotes };
  }

  async getMyStats(venueId: string, sessionId: string) {
    const [songsAdded, votesGiven, topSong] = await Promise.all([
      this.prisma.queuedSong.count({
        where: { venueId, votes_rel: { some: { sessionId } } },
      }),
      this.prisma.vote.count({
        where: { sessionId, song: { venueId } },
      }),
      this.prisma.queuedSong.findFirst({
        where: { venueId, votes_rel: { some: { sessionId } } },
        orderBy: { votes: 'desc' },
        select: { title: true, artist: true, votes: true, albumArt: true },
      }),
    ]);
    return { songsAdded, votesGiven, topSong };
  }
}
