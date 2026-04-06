import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module';
import { VenuesModule } from './venues/venues.module';
import { AuthModule } from './auth/auth.module';
import { SpotifyModule } from './spotify/spotify.module';
import { QueueModule } from './queue/queue.module';
import { EventsModule } from './events/events.module';
import { RedisModule } from './redis/redis.module';
import { ModerationModule } from './moderation/moderation.module';
import { SessionMiddleware } from './session/session.middleware';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        SPOTIFY_CLIENT_ID: Joi.string().required(),
        SPOTIFY_CLIENT_SECRET: Joi.string().required(),
        SPOTIFY_REDIRECT_URI: Joi.string().required(),
        FRONTEND_URL: Joi.string().default('http://localhost:3000'),
        REDIS_URL: Joi.string().optional(),
      }),
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 30 },
      { name: 'medium', ttl: 10000, limit: 200 },
      { name: 'long', ttl: 60000, limit: 600 },
    ]),
    RedisModule,
    ModerationModule,
    PrismaModule,
    VenuesModule,
    AuthModule,
    SpotifyModule,
    QueueModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('queue', 'events');
  }
}
