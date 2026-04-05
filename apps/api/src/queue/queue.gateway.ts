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
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
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

  private getSessionId(client: Socket): string | null {
    // Extract sessionId from httpOnly cookie in handshake
    const cookies = client.handshake.headers.cookie || '';
    const match = cookies.match(/nextup_session=([^;]+)/);
    if (match) return match[1];
    // Fallback to payload (backward compat)
    return null;
  }

  @SubscribeMessage('vote')
  async handleVote(
    @MessageBody() payload: VotePayload,
    @ConnectedSocket() client: Socket,
  ) {
    // Validate song belongs to the claimed venue
    const song = await this.queueService.findSong(payload.songId);
    if (!song || song.venueId !== payload.venueId) {
      client.emit('vote-error', { message: 'Canción no encontrada' });
      return;
    }

    // Use httpOnly cookie sessionId (tamper-proof), fallback to payload
    const sessionId = this.getSessionId(client) || payload.sessionId;
    if (!sessionId) {
      client.emit('vote-error', { message: 'Sin sesión' });
      return;
    }

    const result = await this.queueService.vote(payload.songId, sessionId);

    if (result.alreadyVoted) {
      client.emit('vote-error', { message: 'Ya votaste esta canción' });
      return;
    }

    // Emit lightweight delta for votes (avoids re-fetching full queue)
    if (result.song) {
      this.server.to(payload.venueId).emit('vote-update', {
        songId: payload.songId,
        votes: result.song.votes,
      });
    }
  }

  emitQueueUpdate(venueId: string, queue: QueuedSong[]) {
    this.server.to(venueId).emit('queue-updated', { queue });
  }

  emitNowPlaying(venueId: string, track: CurrentTrack) {
    this.server.to(venueId).emit('now-playing-changed', { track });
  }
}
