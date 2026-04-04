import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Servicio — Nextup',
};

export default function TerminosPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <Link href="/" style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>← Volver</Link>

      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '24px 0 8px' }}>Términos de Servicio</h1>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: 40 }}>
        Última actualización: Abril 2026
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>1. Qué es Nextup</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Nextup es una plataforma de gestión de colas de reproducción musical colaborativa.
          Permite a los asistentes de un venue o evento votar canciones que se reproducen
          a través del servicio de streaming que el organizador tiene contratado.
          Nextup no provee, almacena ni distribuye contenido musical.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>2. Responsabilidad del organizador</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          El usuario que crea un venue o evento en Nextup (el &quot;Organizador&quot;) es el único
          responsable de:
        </p>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: 20, marginTop: 8 }}>
          <li>Contar con las licencias y permisos necesarios para la reproducción pública
          de música en su establecimiento o evento, incluyendo pero no limitado a los
          pagos correspondientes a SADAIC, AADI-CAPIF y cualquier otro organismo de
          gestión colectiva aplicable.</li>
          <li>Cumplir con los términos de servicio del proveedor de streaming que utilice
          (por ejemplo, Spotify, Apple Music, etc.).</li>
          <li>Asegurarse de que el uso de música en su establecimiento o evento sea legal
          conforme a la legislación argentina y de su jurisdicción.</li>
        </ul>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 12 }}>
          Nextup no asume ninguna responsabilidad por el uso de música no licenciada
          por parte del Organizador.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>3. Uso permitido</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Nextup puede utilizarse para:
        </p>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: 20, marginTop: 8 }}>
          <li>Gestionar la cola de reproducción en bares, restaurantes, comedores y establecimientos similares.</li>
          <li>Organizar la música en eventos privados como casamientos, cumpleaños y reuniones.</li>
          <li>Controlar la música en gimnasios, espacios de coworking y locales comerciales.</li>
          <li>Uso personal en reuniones sociales y previas.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>4. Limitación de responsabilidad</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Nextup se provee &quot;tal como está&quot;. No garantizamos disponibilidad continua del servicio
          ni compatibilidad con todos los proveedores de streaming. El servicio puede modificarse
          o interrumpirse en cualquier momento.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>5. Datos y privacidad</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Los únicos datos que recopilamos son los necesarios para el funcionamiento del
          servicio: email, nombre y tokens del servicio de streaming del organizador. Los votos de los
          asistentes son anónimos y se identifican únicamente por un ID de sesión temporal
          que no se asocia a ningún dato personal.
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>6. Contacto</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Para consultas sobre estos términos podés escribirnos a través de nuestro sitio web.
        </p>
      </section>

      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
        Al registrarte en Nextup, aceptás estos términos de servicio.
      </p>
    </main>
  );
}
