import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  queuedSong: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  vote: {
    create: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  venueTrack: {
    upsert: jest.fn().mockResolvedValue({}),
  },
  $transaction: jest.fn(),
};

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<QueueService>(QueueService);
    jest.clearAllMocks();
  });

  describe('getQueue', () => {
    it('should return unplayed songs sorted by votes', async () => {
      const songs = [{ id: '1', votes: 5 }, { id: '2', votes: 3 }];
      mockPrisma.queuedSong.findMany.mockResolvedValue(songs);

      const result = await service.getQueue('venue-1');

      expect(mockPrisma.queuedSong.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { venueId: 'venue-1', played: false },
          orderBy: [{ votes: 'desc' }, { createdAt: 'asc' }],
        }),
      );
      expect(result).toEqual(songs);
    });
  });

  describe('addSong', () => {
    const songData = {
      spotifyId: 'spotify-123',
      spotifyUri: 'spotify:track:123',
      title: 'Test Song',
      artist: 'Test Artist',
      albumArt: 'https://example.com/art.jpg',
    };

    it('should return alreadyExists if song is in queue', async () => {
      const existing = { id: '1', ...songData };
      mockPrisma.queuedSong.findFirst
        .mockResolvedValueOnce(existing) // first call: check existing
        ;

      const result = await service.addSong('venue-1', songData, 'session-1');

      expect(result.alreadyExists).toBe(true);
      expect(result.song).toEqual(existing);
    });

    it('should return cooldown with minutes if played recently', async () => {
      mockPrisma.queuedSong.findFirst
        .mockResolvedValueOnce(null) // not in queue
        .mockResolvedValueOnce({     // recently played
          id: '1',
          ...songData,
          played: true,
          playedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
        });

      const result = await service.addSong('venue-1', songData, 'session-1');

      expect(result.cooldown).toBe(true);
      expect(result.cooldownMinutes).toBeGreaterThan(0);
      expect(result.cooldownMinutes).toBeLessThanOrEqual(20);
    });

    it('should create song and vote on success', async () => {
      mockPrisma.queuedSong.findFirst
        .mockResolvedValueOnce(null)  // not in queue
        .mockResolvedValueOnce(null); // no cooldown
      const created = { id: 'new-1', ...songData };
      mockPrisma.queuedSong.create.mockResolvedValue(created);
      mockPrisma.vote.create.mockResolvedValue({});

      const result = await service.addSong('venue-1', songData, 'session-1');

      expect(result.alreadyExists).toBe(false);
      expect(result.song).toEqual(created);
      expect(mockPrisma.vote.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { songId: 'new-1', sessionId: 'session-1' } }),
      );
    });

    it('should include dedication and groupName when provided', async () => {
      mockPrisma.queuedSong.findFirst.mockResolvedValue(null);
      mockPrisma.queuedSong.create.mockResolvedValue({ id: 'new-1' });
      mockPrisma.vote.create.mockResolvedValue({});

      await service.addSong('venue-1', { ...songData, dedication: 'Para Sofi', groupName: 'Mesa 5' }, 'session-1');

      expect(mockPrisma.queuedSong.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ dedication: 'Para Sofi', groupName: 'Mesa 5' }),
        }),
      );
    });
  });

  describe('vote', () => {
    it('should increment votes atomically', async () => {
      const song = { id: '1', venueId: 'v1', spotifyId: 's1', spotifyUri: 'u1', title: 'T', artist: 'A', votes: 2 };
      mockPrisma.$transaction.mockResolvedValue([{}, song]);

      const result = await service.vote('song-1', 'session-1');

      expect(result.alreadyVoted).toBe(false);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should return alreadyVoted on unique constraint violation', async () => {
      mockPrisma.$transaction.mockRejectedValue({ code: 'P2002' });

      const result = await service.vote('song-1', 'session-1');

      expect(result.alreadyVoted).toBe(true);
    });
  });

  describe('getGroupRanking', () => {
    it('should return top groups by votes', async () => {
      mockPrisma.queuedSong.groupBy.mockResolvedValue([
        { groupName: 'Mesa 5', _sum: { votes: 20 }, _count: 4 },
        { groupName: 'Los primos', _sum: { votes: 15 }, _count: 3 },
      ]);

      const result = await service.getGroupRanking('venue-1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Mesa 5');
      expect(result[0].totalVotes).toBe(20);
      expect(result[0].rank).toBe(1);
    });
  });
});
