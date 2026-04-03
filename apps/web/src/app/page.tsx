import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <h1 className={styles.title}>Nextup</h1>
        <p className={styles.subtitle}>
          La música la elige tu gente.
          <br />
          Para bares, previas, eventos o lo que sea.
        </p>
        <div className={styles.features}>
          <div className={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span>Buscan canciones</span>
          </div>
          <div className={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5m-7 7 7-7 7 7" />
            </svg>
            <span>Votan sus favoritas</span>
          </div>
          <div className={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Suena en Spotify</span>
          </div>
        </div>
        <div className={styles.cta}>
          <Link href="/registro" className={styles.primaryBtn}>
            Registrarse gratis
          </Link>
          <Link href="/login" className={styles.secondaryBtn}>
            Iniciar sesión
          </Link>
        </div>
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
    </main>
  );
}
