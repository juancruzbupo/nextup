'use client';

import { QueueList } from './QueueList';
import { AnimatedNumber } from './AnimatedNumber';
import type { QueuedSong, EventSong } from '@nextup/types';

type Tab = 'queue' | 'history' | 'stats' | 'settings';
type SongItem = QueuedSong | EventSong;

interface AdminTabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  queue: SongItem[];
  onVote: (songId: string) => void;
  votedSongs: Set<string>;
  onDelete?: (songId: string) => void;
  onPlay?: (songId: string) => void;
  history: any[];
  stats: { totalPlayed: number; mostVoted: any | null; totalVotes: number } | null;
  saved: boolean;
  statsLabel?: { played: string; votes: string };
  settingsContent: React.ReactNode;
  styles: Record<string, string>;
  ariaPrefix?: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'queue', label: 'Cola' },
  { key: 'history', label: 'Historial' },
  { key: 'stats', label: 'Estadísticas' },
  { key: 'settings', label: 'Ajustes' },
];

export function AdminTabs({
  activeTab, setActiveTab, queue, onVote, votedSongs, onDelete, onPlay,
  history, stats, saved, statsLabel, settingsContent, styles, ariaPrefix = 'admin',
}: AdminTabsProps) {
  const playedLabel = statsLabel?.played || 'Canciones hoy';
  const votesLabel = statsLabel?.votes || 'Votos hoy';

  return (
    <>
      <nav className={styles.tabs} role="tablist" aria-label="Secciones">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`${ariaPrefix}-tabpanel-${tab.key}`}
            id={`${ariaPrefix}-tab-${tab.key}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section
        className={styles.tabContent}
        role="tabpanel"
        id={`${ariaPrefix}-tabpanel-${activeTab}`}
        aria-labelledby={`${ariaPrefix}-tab-${activeTab}`}
      >
        {activeTab === 'queue' && (
          <QueueList queue={queue} onVote={onVote} votedSongs={votedSongs} showDelete onDelete={onDelete} onPlay={onPlay} />
        )}

        {activeTab === 'history' && (
          <div>
            {history.length === 0 ? (
              <div className={styles.emptyState}><p>No hay historial todavía</p></div>
            ) : (
              <div className={styles.historyList}>
                {history.map((song: any) => (
                  <div key={song.id} className={styles.historyItem}>
                    {song.albumArt && <img src={song.albumArt} alt={`${song.title} — ${song.artist}`} className={styles.historyArt} />}
                    <div className={styles.historyInfo}>
                      <div className={styles.historyTitle}>{song.title}</div>
                      <div className={styles.historyArtist}>{song.artist} · {song.votes} votos</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'right', marginBottom: 8 }}>
              Actualizado: {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}><AnimatedNumber value={stats.totalPlayed} /></div>
                <div className={styles.statLabel}>{playedLabel}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}><AnimatedNumber value={stats.totalVotes} /></div>
                <div className={styles.statLabel}>{votesLabel}</div>
              </div>
              {stats.mostVoted && (
                <div className={styles.statCardWide}>
                  <div className={styles.statLabel}>Más votada</div>
                  <div className={styles.mostVotedTitle}>{stats.mostVoted.title}</div>
                  <div className={styles.mostVotedSub}>{stats.mostVoted.artist} · {stats.mostVoted.votes} votos</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && settingsContent}
      </section>
    </>
  );
}
