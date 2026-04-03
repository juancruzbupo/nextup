'use client';

import { useState } from 'react';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('nextup-session-id');
  if (!id) {
    id = generateUUID();
    localStorage.setItem('nextup-session-id', id);
  }
  return id;
}

export function useSessionId(): string {
  const [sessionId] = useState(getOrCreateSessionId);
  return sessionId;
}
