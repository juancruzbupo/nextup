'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface LandingCTAProps {
  styles: { [key: string]: string };
}

export function LandingCTA({ styles }: LandingCTAProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.cta}>
        <Link href="/join" className={styles.secondaryBtn}>
          Tengo un código de evento
        </Link>
      </div>
    );
  }

  if (user) {
    return (
      <div className={styles.cta}>
        <Link href="/dashboard" className={styles.primaryBtn}>
          Ir a mi panel
        </Link>
        <Link href="/join" className={styles.secondaryBtn}>
          Tengo un código de evento
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.cta}>
      <Link href="/registro" className={styles.primaryBtn}>
        Registrarse gratis
      </Link>
      <Link href="/login" className={styles.secondaryBtn}>
        Iniciar sesión
      </Link>
      <Link href="/join" className={styles.secondaryBtn}>
        Tengo un código de evento
      </Link>
    </div>
  );
}
