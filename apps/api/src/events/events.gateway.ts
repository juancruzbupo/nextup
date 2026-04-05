import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SkipThrottle } from '@nestjs/throttler';
import { EventsService } from './events.service';
import type { VoteEventPayload, JoinEventPayload, EventSong, CurrentTrack } from '@nextup/types';

@SkipThrottle()
@WebSocketGateway({
  namespace: '/events',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class EventsGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly eventsService: EventsService) {}

  @SubscribeMessage('join-event')
  async handleJoinEvent(
    @MessageBody() payload: JoinEventPayload,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(payload.eventId);
    const queue = await this.eventsService.getQueue(payload.eventId);
    client.emit('queue-updated', { queue });
  }

  @SubscribeMessage('vote-event')
  async handleVote(
    @MessageBody() payload: VoteEventPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const song = await this.eventsService.findSong(payload.songId);
    if (!song || song.eventId !== payload.eventId) {
      client.emit('vote-error', { message: 'Canción no encontrada' });
      return;
    }

    // Use httpOnly cookie sessionId, fallback to payload
    const cookies = client.handshake.headers.cookie || '';
    const match = cookies.match(/nextup_session=([^;]+)/);
    const sessionId = match?.[1] || payload.sessionId;
    if (!sessionId) {
      client.emit('vote-error', { message: 'Sin sesión' });
      return;
    }

    const result = await this.eventsService.vote(payload.songId, sessionId);
    if (result.alreadyVoted) {
      client.emit('vote-error', { message: 'Ya votaste esta canción' });
      return;
    }

    const queue = await this.eventsService.getQueue(payload.eventId);
    this.emitQueueUpdate(payload.eventId, queue);
  }

  @SubscribeMessage('reaction-event')
  handleReaction(
    @MessageBody() payload: { eventId: string; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(payload.eventId).emit('reaction', { emoji: payload.emoji });
  }

  emitQueueUpdate(eventId: string, queue: EventSong[]) {
    this.server.to(eventId).emit('queue-updated', { queue });
  }

  emitNowPlaying(eventId: string, track: CurrentTrack) {
    this.server.to(eventId).emit('now-playing-changed', { track });
  }

  emitEventEnded(eventId: string) {
    this.server.to(eventId).emit('event-ended', { message: 'Este evento ha finalizado' });
  }
}
