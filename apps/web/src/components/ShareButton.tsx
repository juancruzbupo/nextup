'use client';

import { useToast } from './Toast';
import styles from './ShareButton.module.css';

interface ShareButtonProps {
  venueName: string;
  currentTrack?: { name: string; artist: string } | null;
}

export function ShareButton({ venueName, currentTrack }: ShareButtonProps) {
  const toast = useToast();

  const getMessage = () => {
    if (currentTrack) {
      return `🎵 Estoy en ${venueName} y suena "${currentTrack.name}" de ${currentTrack.artist}. ¡Vení a elegir la música! nextup.app`;
    }
    return `🎵 Estoy en ${venueName}. ¡Vení a elegir la música! nextup.app`;
  };

  const handleShare = async () => {
    const message = getMessage();

    // Try native share (mobile)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ text: message });
        return;
      } catch {
        // User cancelled or not supported — fallback below
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(message);
      toast('Mensaje copiado para compartir', 'success');
    } catch {
      toast('No se pudo copiar', 'error');
    }
  };

  return (
    <button onClick={handleShare} className={styles.btn} aria-label="Compartir">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      <span>Compartir</span>
    </button>
  );
}
