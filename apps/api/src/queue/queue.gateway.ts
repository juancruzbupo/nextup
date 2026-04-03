import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QueueService } from './queue.service';
import type { VotePayload, JoinBarPayload, QueuedSong } from '@barjukebox/types';

@WebSocketGateway({ cors: { origin: '*' } })
export class QueueGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly queueService: QueueService) {}

  @SubscribeMessage('join-bar')
  async handleJoinBar(
    @MessageBody() payload: JoinBarPayload,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(payload.barId);
    const queue = await this.queueService.getQueue(payload.barId);
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

    const queue = await this.queueService.getQueue(payload.barId);
    this.emitQueueUpdate(payload.barId, queue);
  }

  emitQueueUpdate(barId: string, queue: QueuedSong[]) {
    this.server.to(barId).emit('queue-updated', { queue });
  }
}
