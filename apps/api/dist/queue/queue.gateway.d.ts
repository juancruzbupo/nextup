import { Server, Socket } from 'socket.io';
import { QueueService } from './queue.service';
import type { VotePayload, JoinVenuePayload, QueuedSong, CurrentTrack } from '@nextup/types';
export declare class QueueGateway {
    private readonly queueService;
    server: Server;
    constructor(queueService: QueueService);
    handleJoinVenue(payload: JoinVenuePayload, client: Socket): Promise<void>;
    handleJoinBar(payload: {
        barId?: string;
        venueId?: string;
    }, client: Socket): Promise<void>;
    private getSessionId;
    handleVote(payload: VotePayload, client: Socket): Promise<void>;
    emitQueueUpdate(venueId: string, queue: QueuedSong[]): void;
    emitNowPlaying(venueId: string, track: CurrentTrack): void;
}
