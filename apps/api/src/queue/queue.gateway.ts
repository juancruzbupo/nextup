import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SkipThrottle } from '@nestjs/throttler';
import { QueueService } from './queue.service';
import type { VotePayload, JoinVenuePayload, QueuedSong, CurrentTrack } from '@nextup/types';

@SkipThrottle()
@WebSocketGateway({ cors: { origin: '*' } })
export class QueueGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly queueService: QueueService) {}

  @SubscribeMessage('join-venue')
  async handleJoinVenue(
    @MessageBody() payload: JoinVenuePayload,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(payload.venueId);
    const queue = await this.queueService.getQueue(payload.venueId);
    client.emit('queue-updated', { queue });
  }

  // Backward compat for existing clients
  @SubscribeMessage('join-bar')
  async handleJoinBar(
    @MessageBody() payload: { barId?: string; venueId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const venueId = payload.venueId || payload.barId;
    if (!venueId) return;
    client.join(venueId);
    const queue = await this.queueService.getQueue(venueId);
    client.emit('queue-updated', { queue });
  }

  @SubscribeMessage('vote')
  async handleVote(
    @MessageBody() payload: VotePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.queueService.vote(payload.songId, payload.sessionId);

    if (result.alreadyVoted) {
      client.emit('vote-error', { message: 'Ya votaste esta canción' });
      return;
    }

    const queue = await this.queueService.getQueue(payload.venueId);
    this.emitQueueUpdate(payload.venueId, queue);
  }

  emitQueueUpdate(venueId: string, queue: QueuedSong[]) {
    this.server.to(venueId).emit('queue-updated', { queue });
  }

  emitNowPlaying(venueId: string, track: CurrentTrack) {
    this.server.to(venueId).emit('now-playing-changed', { track });
  }
}
