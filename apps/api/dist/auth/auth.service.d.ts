import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly config;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService);
    register(dto: {
        email: string;
        password: string;
        name: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            createdAt: Date;
        };
    }>;
    login(dto: {
        email: string;
        password: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            createdAt: Date;
        };
    }>;
    generateTokens(userId: string, email: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refreshTokens(oldRefreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<void>;
    validateUser(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
    } | null>;
}
