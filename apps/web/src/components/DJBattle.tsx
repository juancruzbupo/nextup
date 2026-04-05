'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useSessionId } from '@/hooks/useSessionId';
import { useToast } from './Toast';
import { Confetti } from './Confetti';

interface BattleRound {
  id: string;
  roundNum: number;
  songATitle?: string | null;
  songAArtist?: string | null;
  songBTitle?: string | null;
  songBArtist?: string | null;
  votesA: number;
  votesB: number;
  status: string;
}

interface Battle {
  id: string;
  djAName: string;
  djBName: string;
  status: string;
  rounds: BattleRound[];
}

interface DJBattleProps {
  venueId: string;
}

export function DJBattle({ venueId }: DJBattleProps) {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [votedRounds, setVotedRounds] = useState<Set<string>>(new Set());
  const sessionId = useSessionId();
  const toast = useToast();

  useEffect(() => {
    if (!venueId) return;
    apiFetch<Battle | null>(`/queue/${venueId}/battle/active`)
      .then(setBattle)
      .catch(() => {});

    // Poll every 5 seconds for battle updates
    const interval = setInterval(() => {
      apiFetch<Battle | null>(`/queue/${venueId}/battle/active`)
        .then(setBattle)
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [venueId]);

  if (!battle) return null;

  const currentRound = battle.rounds.find((r) => r.status === 'voting');
  const finishedRounds = battle.rounds.filter((r) => r.status === 'done');

  // Calculate total scores
  const totalA = battle.rounds.reduce((sum, r) => sum + r.votesA, 0);
  const totalB = battle.rounds.reduce((sum, r) => sum + r.votesB, 0);

  const handleVote = async (roundId: string, side: 'a' | 'b') => {
    if (votedRounds.has(roundId)) return;
    try {
      const result = await apiFetch<any>(`/queue/${venueId}/battle/round/${roundId}/vote`, {
        method: 'POST',
        headers: { 'x-session-id': sessionId },
        body: JSON.stringify({ side }),
      });
      if (result.alreadyVoted) {
        toast('Ya votaste en esta ronda', 'info');
      } else {
        toast(`Votaste por ${side === 'a' ? battle.djAName : battle.djBName}!`, 'success');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([30, 30, 30, 30, 60]);
        }
      }
      setVotedRounds((prev) => new Set(prev).add(roundId));
    } catch {
      toast('No se pudo votar', 'error');
    }
  };

  return (
    <div style={{
      padding: 16,
      borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(135deg, rgba(255,71,87,0.08), rgba(29,185,84,0.08))',
      border: '1px solid var(--border)',
      marginBottom: 16,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
          🎤 DJ Battle
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--danger-text)' }}>{battle.djAName}</p>
            <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 900 }}>{totalA}</p>
          </div>
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-tertiary)' }}>VS</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--accent)' }}>{battle.djBName}</p>
            <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 900 }}>{totalB}</p>
          </div>
        </div>
      </div>

      {/* Current voting round */}
      {currentRound && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 8 }}>
            Ronda {currentRound.roundNum} — ¡Votá tu favorita!
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleVote(currentRound.id, 'a')}
              disabled={votedRounds.has(currentRound.id)}
              style={{
                flex: 1, padding: 12, borderRadius: 'var(--radius-md)',
                background: votedRounds.has(currentRound.id) ? 'var(--bg-surface-1)' : 'rgba(255,71,87,0.15)',
                border: '1px solid rgba(255,71,87,0.3)', color: 'var(--text)', cursor: 'pointer',
                minHeight: 44, opacity: votedRounds.has(currentRound.id) ? 0.5 : 1,
              }}
            >
              <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{currentRound.songATitle || '...'}</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{currentRound.songAArtist || ''}</p>
              <p style={{ fontWeight: 800, marginTop: 4 }}>{currentRound.votesA} votos</p>
            </button>
            <button
              onClick={() => handleVote(currentRound.id, 'b')}
              disabled={votedRounds.has(currentRound.id)}
              style={{
                flex: 1, padding: 12, borderRadius: 'var(--radius-md)',
                background: votedRounds.has(currentRound.id) ? 'var(--bg-surface-1)' : 'var(--accent-subtle)',
                border: '1px solid rgba(29,185,84,0.3)', color: 'var(--text)', cursor: 'pointer',
                minHeight: 44, opacity: votedRounds.has(currentRound.id) ? 0.5 : 1,
              }}
            >
              <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{currentRound.songBTitle || '...'}</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{currentRound.songBArtist || ''}</p>
              <p style={{ fontWeight: 800, marginTop: 4 }}>{currentRound.votesB} votos</p>
            </button>
          </div>
        </div>
      )}

      {/* Finished rounds results */}
      {finishedRounds.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {finishedRounds.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Ronda {r.roundNum}</span>
              <span>{r.songATitle} ({r.votesA}) vs {r.songBTitle} ({r.votesB}) — {r.votesA > r.votesB ? '🏆 ' + battle.djAName : r.votesB > r.votesA ? '🏆 ' + battle.djBName : 'Empate'}</span>
            </div>
          ))}
        </div>
      )}

      {battle.status === 'finished' && (
        <>
          <Confetti trigger={true} />
          <div style={{ textAlign: 'center', marginTop: 12, padding: 16, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--accent-subtle), var(--bg-surface-2))', border: '1px solid var(--accent)', animation: 'fadeInUp var(--transition-slow) ease both' }}>
            <p style={{ fontWeight: 900, fontSize: 'var(--text-2xl)' }}>
              🏆 {totalA > totalB ? battle.djAName : totalB > totalA ? battle.djBName : 'Empate!'} gana la batalla!
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>
              {totalA} — {totalB}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
