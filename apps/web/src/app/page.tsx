export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>🎵 BarJukebox</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>La jukebox democrática para tu bar</p>
    </main>
  );
}
