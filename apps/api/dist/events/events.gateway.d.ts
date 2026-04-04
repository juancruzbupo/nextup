import { Server, Socket } from 'socket.io';
import { EventsService } from './events.service';
import type { VoteEventPayload, JoinEventPayload, EventSong, CurrentTrack } from '@nextup/types';
export declare class EventsGateway {
    private readonly eventsService;
    server: Server;
    constructor(eventsService: EventsService);
    handleJoinEvent(payload: JoinEventPayload, client: Socket): Promise<void>;
    handleVote(payload: VoteEventPayload, client: Socket): Promise<void>;
    emitQueueUpdate(eventId: string, queue: EventSong[]): void;
    emitNowPlaying(eventId: string, track: CurrentTrack): void;
    emitEventEnded(eventId: string): void;
}
