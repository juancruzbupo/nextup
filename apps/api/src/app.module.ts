import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module';
import { VenuesModule } from './venues/venues.module';
import { AuthModule } from './auth/auth.module';
import { SpotifyModule } from './spotify/spotify.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        SPOTIFY_CLIENT_ID: Joi.string().optional().default(''),
        SPOTIFY_CLIENT_SECRET: Joi.string().optional().default(''),
        SPOTIFY_REDIRECT_URI: Joi.string().required(),
        FRONTEND_URL: Joi.string().default('http://localhost:3000'),
      }),
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 5 },
      { name: 'medium', ttl: 10000, limit: 30 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    PrismaModule,
    VenuesModule,
    AuthModule,
    SpotifyModule,
    QueueModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
