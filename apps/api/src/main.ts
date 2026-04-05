import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { REDIS_CLIENT } from './redis/redis.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Use Redis adapter for WebSocket if Redis is available (enables multi-pod scaling)
  const redis = app.get(REDIS_CLIENT, { strict: false });
  if (redis) {
    try {
      const pubClient = redis.duplicate();
      const subClient = redis.duplicate();
      const adapter = createAdapter(pubClient, subClient);
      app.useWebSocketAdapter(new class extends IoAdapter {
        createIOServer(port: number, options?: any) {
          const server = super.createIOServer(port, options);
          server.adapter(adapter);
          return server;
        }
      }(app));
      console.log('WebSocket Redis adapter enabled');
    } catch (err) {
      console.warn('WebSocket Redis adapter failed, using default:', err);
    }
  }

  app.enableShutdownHooks();
  await app.listen(process.env.PORT || 3001);
}
bootstrap();
