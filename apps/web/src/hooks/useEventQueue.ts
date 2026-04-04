'use client';

import { useQueue } from './useQueue';

export function useEventQueue(eventId: string) {
  return useQueue({ entityId: eventId, entityType: 'event' });
}
