import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SpotifyModule } from '../spotify/spotify.module';

@Module({
  imports: [SpotifyModule],
  controllers: [AuthController],
})
export class AuthModule {}
