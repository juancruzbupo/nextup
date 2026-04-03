'use client';

import { useEffect, useState } from 'react';

function generateUUID(): string {
  return crypto.randomUUID();
}

export function useSessionId(): string {
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    let id = localStorage.getItem('barjukebox-session-id');
    if (!id) {
      id = generateUUID();
      localStorage.setItem('barjukebox-session-id', id);
    }
    setSessionId(id);
  }, []);

  return sessionId;
}
