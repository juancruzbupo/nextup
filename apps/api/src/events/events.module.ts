import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsGateway } from './events.gateway';
import { SpotifyModule } from '../spotify/spotify.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SpotifyModule, AuthModule],
  controllers: [EventsController],
  providers: [EventsService, EventsGateway],
  exports: [EventsService, EventsGateway],
})
export class EventsModule {}
