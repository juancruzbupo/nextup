import { Module, forwardRef } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { SongWatcherService } from './song-watcher.service';
import { SpotifyModule } from '../spotify/spotify.module';

@Module({
  imports: [SpotifyModule],
  controllers: [QueueController],
  providers: [QueueService, QueueGateway, SongWatcherService],
  exports: [QueueService, QueueGateway],
})
export class QueueModule {}
