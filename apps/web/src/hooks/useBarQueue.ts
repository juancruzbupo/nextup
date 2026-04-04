'use client';

import { useQueue } from './useQueue';

export function useBarQueue(venueId: string) {
  return useQueue({ entityId: venueId, entityType: 'venue' });
}
