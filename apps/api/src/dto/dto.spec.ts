import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AddSongDto, CreateEventDto, CreateVenueDto, CreateBattleDto, BattleVoteDto } from './index';

describe('DTOs Validation', () => {
  describe('AddSongDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(AddSongDto, {
        spotifyId: '4iV5W9uYEdYUVa79Axb7Rh',
        spotifyUri: 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh',
        title: 'Lose Control',
        artist: 'Teddy Swims',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail without required fields', async () => {
      const dto = plainToInstance(AddSongDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept optional dedication and groupName', async () => {
      const dto = plainToInstance(AddSongDto, {
        spotifyId: 'id', spotifyUri: 'uri', title: 'T', artist: 'A',
        dedication: 'Para Sofi', groupName: 'Mesa 5',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject dedication over 100 chars', async () => {
      const dto = plainToInstance(AddSongDto, {
        spotifyId: 'id', spotifyUri: 'uri', title: 'T', artist: 'A',
        dedication: 'x'.repeat(101),
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateEventDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreateEventDto, {
        name: 'Cumple de Sofi',
        startsAt: '2026-04-10T21:00:00',
        endsAt: '2026-04-11T03:00:00',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail without name', async () => {
      const dto = plainToInstance(CreateEventDto, {
        startsAt: '2026-04-10T21:00:00',
        endsAt: '2026-04-11T03:00:00',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject PIN with letters', async () => {
      const dto = plainToInstance(CreateEventDto, {
        name: 'Test', startsAt: '2026-04-10T21:00:00', endsAt: '2026-04-11T03:00:00',
        adminPin: 'abcd',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateVenueDto', () => {
    it('should pass with valid slug', async () => {
      const dto = plainToInstance(CreateVenueDto, {
        name: 'Mi Bar', slug: 'mi-bar',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject slug with spaces or uppercase', async () => {
      const dto = plainToInstance(CreateVenueDto, {
        name: 'Mi Bar', slug: 'Mi Bar',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('BattleVoteDto', () => {
    it('should accept "a" or "b"', async () => {
      const dtoA = plainToInstance(BattleVoteDto, { side: 'a' });
      const dtoB = plainToInstance(BattleVoteDto, { side: 'b' });
      expect(await validate(dtoA)).toHaveLength(0);
      expect(await validate(dtoB)).toHaveLength(0);
    });

    it('should reject invalid side', async () => {
      const dto = plainToInstance(BattleVoteDto, { side: 'c' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateBattleDto', () => {
    it('should pass with DJ names', async () => {
      const dto = plainToInstance(CreateBattleDto, {
        djAName: 'DJ Lucas', djBName: 'DJ Sofi',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject rounds > 10', async () => {
      const dto = plainToInstance(CreateBattleDto, {
        djAName: 'A', djBName: 'B', rounds: 15,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
