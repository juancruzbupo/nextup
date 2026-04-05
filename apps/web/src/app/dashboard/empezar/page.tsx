'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import styles from './empezar.module.css';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) return null;

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <h1 className={styles.title}>¿Qué querés hacer?</h1>
        <p className={styles.subtitle}>Hola {user?.name}, elegí cómo usar Nextup</p>

        <div className={styles.options}>
          <button onClick={() => router.push('/dashboard/nuevo')} className={styles.option}>
            <div className={styles.optionIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className={styles.optionText}>
              <h2>Tengo un bar, local o gym</h2>
              <p>Tus clientes escanean un QR y eligen la música cada vez que van.</p>
            </div>
          </button>

          <button onClick={() => router.push('/dashboard/nuevo-evento')} className={styles.option}>
            <div className={styles.optionIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className={styles.optionText}>
              <h2>Organizo un evento</h2>
              <p>Cumple, casamiento, previa, corporativo. Compartís un código y tus invitados eligen la música.</p>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
