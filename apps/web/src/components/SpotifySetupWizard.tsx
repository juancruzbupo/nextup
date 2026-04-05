'use client';

import { API_URL } from '@/lib/api';

interface SpotifySetupWizardProps {
  entityId: string;
  entityType: 'venue' | 'event';
  styles: Record<string, string>;
}

export function SpotifySetupWizard({ entityId, entityType, styles }: SpotifySetupWizardProps) {
  const paramKey = entityType === 'event' ? 'eventId' : 'venueId';

  return (
    <div className={styles.setupWizard}>
      <h2 className={styles.setupTitle}>Configurá tu {entityType === 'event' ? 'evento' : 'espacio'} en 2 pasos</h2>
      <div className={styles.setupSteps}>
        <div className={styles.setupStep}>
          <span className={styles.stepNumber}>1</span>
          <div>
            <p className={styles.setupStepTitle}>Conectá tu Spotify Premium</p>
            <p className={styles.setupStepDesc}>
              Necesitás una cuenta Spotify Premium (la gratuita no funciona). Después de conectar, dejá Spotify abierto en el celular o la compu donde suena la música — Nextup lo controla desde ahí.
            </p>
            <a href={`${API_URL}/auth/spotify?${paramKey}=${entityId}`} className={styles.setupConnectBtn}>
              Conectar Spotify
            </a>
          </div>
        </div>
        <div className={styles.setupStepPending}>
          <span className={styles.stepNumberPending}>2</span>
          <div>
            <p className={styles.setupStepTitle}>Compartí el {entityType === 'event' ? 'código' : 'QR'} con tus {entityType === 'event' ? 'invitados' : 'clientes'}</p>
            <p className={styles.setupStepDesc}>Lo encontrás arriba de las pestañas una vez conectado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
