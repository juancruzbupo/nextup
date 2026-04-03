import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: { email: string; password: string; name: string }) {
    if (!dto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      throw new BadRequestException('Email inválido');
    }
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }
    if (!dto.name?.trim()) {
      throw new BadRequestException('El nombre es requerido');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (existing) throw new ConflictException('El email ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        name: dto.name.trim(),
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return { user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }, ...tokens };
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const tokens = await this.generateTokens(user.id, user.email);
    return { user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }, ...tokens };
  }

  async generateTokens(userId: string, email: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    // Store refresh token hash in DB
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: {
        token: tokenHash,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(oldRefreshToken: string) {
    try {
      const payload = this.jwtService.verify(oldRefreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const storedTokens = await this.prisma.refreshToken.findMany({
        where: { userId: payload.sub },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      // Find matching token
      let matchedToken: typeof storedTokens[0] | null = null;
      for (const t of storedTokens) {
        if (await bcrypt.compare(oldRefreshToken, t.token)) {
          matchedToken = t;
          break;
        }
      }

      if (!matchedToken) throw new UnauthorizedException();

      // Delete old token (rotation)
      await this.prisma.refreshToken.delete({ where: { id: matchedToken.id } });

      // Clean up expired tokens
      await this.prisma.refreshToken.deleteMany({
        where: { userId: payload.sub, expiresAt: { lt: new Date() } },
      });

      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      // Delete all refresh tokens for this user (logout from all devices)
      await this.prisma.refreshToken.deleteMany({
        where: { userId: payload.sub },
      });
    } catch {
      // Token invalid, nothing to clean up
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
  }
}
