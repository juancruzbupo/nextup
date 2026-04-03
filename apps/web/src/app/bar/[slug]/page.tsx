'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useBarQueue } from '@/hooks/useBarQueue';
import { NowPlaying } from '@/components/NowPlaying';
import { SearchBar } from '@/components/SearchBar';
import { QueueList } from '@/components/QueueList';
import type { Bar } from '@barjukebox/types';
import styles from './page.module.css';

export default function BarPage() {
  const { slug } = useParams<{ slug: string }>();
  const [bar, setBar] = useState<Bar | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Bar>(`/bars/${slug}`)
      .then(setBar)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const { queue, vote, isConnected, votedSongs } = useBarQueue(bar?.id || '');

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonBar} />
          <div className={styles.skeletonBar} />
          <div className={styles.skeletonBar} />
        </div>
      </main>
    );
  }

  if (error || !bar) {
    return (
      <main className={styles.page}>
        <div className={styles.error}>
          <h1>Bar no encontrado</h1>
          <p>El bar que buscás no existe o fue desactivado.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.barName}>{bar.name}</h1>
        <div className={styles.connectionDot} data-connected={isConnected} />
      </header>

      <section className={styles.section}>
        <NowPlaying barId={bar.id} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Buscar y agregar</h2>
        <SearchBar barId={bar.id} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>En cola</h2>
        <QueueList queue={queue} onVote={vote} votedSongs={votedSongs} />
      </section>
    </main>
  );
}
