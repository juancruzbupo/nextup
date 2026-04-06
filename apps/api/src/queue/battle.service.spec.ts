import { Test, TestingModule } from '@nestjs/testing';
import { BattleService } from './battle.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  dJBattle: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  battleRound: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  battleVote: {
    create: jest.fn(),
  },
};

describe('BattleService', () => {
  let service: BattleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattleService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<BattleService>(BattleService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create battle with rounds', async () => {
      const battle = { id: 'b1', venueId: 'v1', djAName: 'DJ Lucas', djBName: 'DJ Sofi' };
      mockPrisma.dJBattle.create.mockResolvedValue(battle);
      mockPrisma.battleRound.create.mockResolvedValue({});
      mockPrisma.dJBattle.findUnique.mockResolvedValue({ ...battle, rounds: [{}, {}, {}] });

      const result = await service.create('v1', 'DJ Lucas', 'DJ Sofi', 3);

      expect(mockPrisma.dJBattle.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { venueId: 'v1', djAName: 'DJ Lucas', djBName: 'DJ Sofi' } }),
      );
      expect(mockPrisma.battleRound.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('vote', () => {
    it('should increment votesA when voting for side a', async () => {
      mockPrisma.battleVote.create.mockResolvedValue({});
      mockPrisma.battleRound.update.mockResolvedValue({ id: 'r1', votesA: 5, votesB: 3 });

      const result = await service.vote('r1', 'session-1', 'a');

      expect(mockPrisma.battleVote.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { roundId: 'r1', sessionId: 'session-1', side: 'a' } }),
      );
      expect(mockPrisma.battleRound.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { votesA: { increment: 1 } } }),
      );
    });

    it('should return alreadyVoted on duplicate', async () => {
      mockPrisma.battleVote.create.mockRejectedValue({ code: 'P2002' });

      const result = await service.vote('r1', 'session-1', 'a');

      expect(result).toEqual({ alreadyVoted: true });
    });
  });

  describe('finishRound', () => {
    it('should finish battle when all rounds done', async () => {
      mockPrisma.battleRound.update.mockResolvedValue({ id: 'r3', battleId: 'b1', status: 'done' });
      mockPrisma.dJBattle.findUnique.mockResolvedValue({
        id: 'b1',
        rounds: [
          { status: 'done' },
          { status: 'done' },
          { status: 'done' },
        ],
      });
      mockPrisma.dJBattle.update.mockResolvedValue({});

      await service.finishRound('r3');

      expect(mockPrisma.dJBattle.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'finished' } }),
      );
    });

    it('should NOT finish battle if rounds remain', async () => {
      mockPrisma.battleRound.update.mockResolvedValue({ id: 'r1', battleId: 'b1', status: 'done' });
      mockPrisma.dJBattle.findUnique.mockResolvedValue({
        id: 'b1',
        rounds: [
          { status: 'done' },
          { status: 'voting' },
          { status: 'picking' },
        ],
      });

      await service.finishRound('r1');

      expect(mockPrisma.dJBattle.update).not.toHaveBeenCalled();
    });
  });
});
