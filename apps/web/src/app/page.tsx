import Link from 'next/link';
import { LandingCTA } from '@/components/LandingCTA';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <h1 className={styles.title}>Nextup</h1>
        <p className={styles.subtitle}>
          Tu gente elige qué suena.
          <br />
          Escanean, votan y la más pedida suena.
        </p>
        <div className={styles.features}>
          <div className={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span>Escanean un QR y eligen canciones</span>
          </div>
          <div className={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5m-7 7 7-7 7 7" />
            </svg>
            <span>Votan y la más pedida suena después</span>
          </div>
          <div className={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Para bares, eventos, previas o lo que sea</span>
          </div>
        </div>
        <LandingCTA styles={styles} />
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: 24, maxWidth: 320, lineHeight: 1.5, textAlign: 'center' }}>
          Tenés un bar, gym o local? Registrate gratis, conectá Spotify y compartí el QR. En 2 minutos tus clientes eligen la música.
        </p>
      </div>

      {/* Product mockup */}
      <div className={styles.mockup}>
        <div className={styles.mockupPhone}>
          <div className={styles.mockupHeader}>
            <span className={styles.mockupDot} />
            <span className={styles.mockupName}>Previa de Santi</span>
            <span className={styles.mockupBadge}>EN VIVO</span>
          </div>
          <div className={styles.mockupNowPlaying}>
            <div className={styles.mockupArt} />
            <div>
              <div className={styles.mockupLabel}>SONANDO AHORA</div>
              <div className={styles.mockupTrack}>Lose Control</div>
              <div className={styles.mockupArtist}>Teddy Swims</div>
            </div>
          </div>
          <div className={styles.mockupQueue}>
            <div className={styles.mockupSong}>
              <span className={styles.mockupRank}>1</span>
              <div className={styles.mockupSongArt} />
              <div className={styles.mockupSongInfo}>
                <span>Milagros</span>
                <span className={styles.mockupSongArtist}>KAROL G</span>
              </div>
              <span className={styles.mockupVotes}>12</span>
            </div>
            <div className={styles.mockupSong}>
              <span className={styles.mockupRank}>2</span>
              <div className={styles.mockupSongArt} />
              <div className={styles.mockupSongInfo}>
                <span>Tus Ojos</span>
                <span className={styles.mockupSongArtist}>Los Cafres</span>
              </div>
              <span className={styles.mockupVotes}>8</span>
            </div>
            <div className={styles.mockupSong}>
              <span className={styles.mockupRank}>3</span>
              <div className={styles.mockupSongArt} />
              <div className={styles.mockupSongInfo}>
                <span>La Noche</span>
                <span className={styles.mockupSongArtist}>Tan Biónica</span>
              </div>
              <span className={styles.mockupVotes}>5</span>
            </div>
          </div>
        </div>
        <p className={styles.mockupCaption}>Así se ve la lista con los votos de tu gente</p>
      </div>

      <p className={styles.legalDisclaimer}>
        El organizador es responsable de contar con los permisos de reproducción
        correspondientes para el uso público de música en su establecimiento o evento.{' '}
        <Link href="/terminos" style={{ color: 'inherit', textDecoration: 'underline', opacity: 0.7 }}>
          Términos de servicio
        </Link>
      </p>
    </main>
  );
}
