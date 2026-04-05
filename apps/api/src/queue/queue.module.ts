import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { SongWatcherService } from './song-watcher.service';
import { BattleService } from './battle.service';
import { SpotifyModule } from '../spotify/spotify.module';
import { AuthModule } from '../auth/auth.module';
import { VenueAdminGuard } from '../auth/venue-admin.guard';

@Module({
  imports: [SpotifyModule, AuthModule],
  controllers: [QueueController],
  providers: [QueueService, QueueGateway, SongWatcherService, BattleService, VenueAdminGuard],
  exports: [QueueService, QueueGateway],
})
export class QueueModule {}
