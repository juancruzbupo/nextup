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

  // Track vote spikes per song (songId → { count, firstVoteAt })
  private voteSpikes = new Map<string, { count: number; firstVoteAt: number; title: string }>();
  private spikeCleanupInterval: ReturnType<typeof setInterval>;

  constructor(private readonly queueService: QueueService) {
    // Clean stale spike entries every 60s
    this.spikeCleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, spike] of this.voteSpikes.entries()) {
        if (now - spike.firstVoteAt > 120000) this.voteSpikes.delete(key);
      }
    }, 60000);
  }

  onModuleDestroy() {
    clearInterval(this.spikeCleanupInterval);
  }

  @SubscribeMessage('join-venue')
  async handleJoinVenue(
    @MessageBody() payload: JoinVenuePayload,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(payload.venueId);
    const queue = await this.queueService.getQueue(payload.venueId);
    client.emit('queue-updated', { queue });
    this.emitListenerCount(payload.venueId);

    client.on('disconnect', () => {
      this.emitListenerCount(payload.venueId);
    });
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

      // Track vote spikes for "Canción del momento"
      const now = Date.now();
      const spike = this.voteSpikes.get(payload.songId);
      if (spike && now - spike.firstVoteAt < 60000) {
        spike.count++;
        if (spike.count === 5) {
          this.server.to(payload.venueId).emit('trending-song', {
            songId: payload.songId,
            title: result.song.title,
            votes: result.song.votes,
          });
        }
      } else {
        this.voteSpikes.set(payload.songId, { count: 1, firstVoteAt: now, title: result.song.title });
      }
    }
  }

  @SubscribeMessage('reaction')
  handleReaction(
    @MessageBody() payload: { venueId: string; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast to everyone in the room except sender
    client.to(payload.venueId).emit('reaction', { emoji: payload.emoji });
  }

  emitQueueUpdate(venueId: string, queue: QueuedSong[]) {
    this.server.to(venueId).emit('queue-updated', { queue });
  }

  emitNowPlaying(venueId: string, track: CurrentTrack) {
    this.server.to(venueId).emit('now-playing-changed', { track });
  }

  private async emitListenerCount(venueId: string) {
    const room = this.server.sockets.adapter.rooms.get(venueId);
    const count = room ? room.size : 0;
    this.server.to(venueId).emit('listener-count', { count });
  }
}
