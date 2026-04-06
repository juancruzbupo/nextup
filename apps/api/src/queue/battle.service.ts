import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BattleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(venueId: string, djAName: string, djBName: string, rounds = 3) {
    const battle = await this.prisma.dJBattle.create({
      data: { venueId, djAName, djBName },
    });
    // Create rounds
    for (let i = 1; i <= rounds; i++) {
      await this.prisma.battleRound.create({
        data: { battleId: battle.id, roundNum: i },
      });
    }
    return this.getFullBattle(battle.id);
  }

  async getActiveBattle(venueId: string) {
    return this.prisma.dJBattle.findFirst({
      where: { venueId, status: { not: 'finished' } },
      include: { rounds: { orderBy: { roundNum: 'asc' }, select: { id: true, roundNum: true, songATitle: true, songAArtist: true, songBTitle: true, songBArtist: true, votesA: true, votesB: true, status: true } } },
    });
  }

  async getFullBattle(battleId: string) {
    return this.prisma.dJBattle.findUnique({
      where: { id: battleId },
      include: { rounds: { orderBy: { roundNum: 'asc' }, select: { id: true, roundNum: true, songATitle: true, songAArtist: true, songBTitle: true, songBArtist: true, votesA: true, votesB: true, status: true } } },
    });
  }

  async setSong(roundId: string, side: 'a' | 'b', song: { spotifyUri: string; title: string; artist: string }) {
    const data = side === 'a'
      ? { songAUri: song.spotifyUri, songATitle: song.title, songAArtist: song.artist }
      : { songBUri: song.spotifyUri, songBTitle: song.title, songBArtist: song.artist };

    const round = await this.prisma.battleRound.update({
      where: { id: roundId },
      data,
    });

    // If both songs set, move to voting
    if (round.songAUri && round.songBUri) {
      await this.prisma.battleRound.update({
        where: { id: roundId },
        data: { status: 'voting' },
      });
    }

    return this.prisma.battleRound.findUnique({ where: { id: roundId } });
  }

  async vote(roundId: string, sessionId: string, side: 'a' | 'b') {
    try {
      await this.prisma.battleVote.create({
        data: { roundId, sessionId, side },
      });
      const field = side === 'a' ? 'votesA' : 'votesB';
      return this.prisma.battleRound.update({
        where: { id: roundId },
        data: { [field]: { increment: 1 } },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') return { alreadyVoted: true };
      throw error;
    }
  }

  async finishRound(roundId: string) {
    const round = await this.prisma.battleRound.update({
      where: { id: roundId },
      data: { status: 'done' },
    });

    // Check if all rounds are done → finish battle
    const battle = await this.prisma.dJBattle.findUnique({
      where: { id: round.battleId },
      include: { rounds: true },
    });
    if (battle && battle.rounds.every((r) => r.status === 'done')) {
      await this.prisma.dJBattle.update({
        where: { id: battle.id },
        data: { status: 'finished' },
      });
    }
    return round;
  }
}
