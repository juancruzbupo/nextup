'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';

type Tab = 'queue' | 'history' | 'stats' | 'settings';

interface AdminPanelConfig {
  entityId: string;
  entityType: 'venue' | 'event';
  /** Base path for API calls, e.g. '/venues' or '/events' */
  historyEndpoint: string;
  statsEndpoint: string;
  saveEndpoint: string;
  saveMethod?: string;
}

export function useAdminPanel(config: AdminPanelConfig) {
  const { entityId, historyEndpoint, statsEndpoint, saveEndpoint, saveMethod = 'PATCH' } = config;
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalPlayed: number; mostVoted: any | null; totalVotes: number } | null>(null);
  const [saved, setSaved] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!entityId) return;
    try {
      const data = await apiFetch<any[]>(historyEndpoint);
      setHistory(data);
    } catch {}
  }, [entityId, historyEndpoint]);

  const loadStats = useCallback(async () => {
    if (!entityId) return;
    try {
      const data = await apiFetch<{ totalPlayed: number; mostVoted: any | null; totalVotes: number }>(statsEndpoint);
      setStats(data);
    } catch {}
  }, [entityId, statsEndpoint]);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
    if (activeTab === 'stats') loadStats();
  }, [activeTab, loadHistory, loadStats]);

  const handleSave = useCallback(async (body: Record<string, any>) => {
    if (Object.keys(body).length === 0) return;
    const result = await apiFetch(saveEndpoint, { method: saveMethod, body: JSON.stringify(body) });
    setSaved(true);
    toast('Cambios guardados', 'success');
    setTimeout(() => setSaved(false), 2000);
    return result;
  }, [saveEndpoint, saveMethod, toast]);

  return { activeTab, setActiveTab, history, stats, saved, handleSave, loadHistory, loadStats };
}
