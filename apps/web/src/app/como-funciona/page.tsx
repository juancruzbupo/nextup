import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cómo funciona — Nextup',
  description: 'Guía completa para usar Nextup: cómo crear un espacio, organizar un evento y cómo votar canciones como invitado.',
};

export default function ComoFuncionaPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <Link href="/" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>← Volver</Link>

      <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, margin: '24px 0 8px', letterSpacing: '-0.02em' }}>Cómo funciona Nextup</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', marginBottom: 40, lineHeight: 1.6 }}>
        Nextup permite que tu gente elija qué música suena. Acá te explicamos todo paso a paso.
      </p>

      {/* ─── SECTION: Para dueños de bares / espacios ─── */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 20, color: 'var(--accent)' }}>
          Para dueños de bares, gyms y locales
        </h2>

        <Step num={1} title="Registrate y creá tu espacio">
          Ingresá a <strong>nextup.app</strong>, hacé click en &quot;Registrarse gratis&quot; y elegí &quot;Tengo un bar, local o gym&quot;.
          Poné el nombre de tu espacio y listo.
        </Step>

        <Step num={2} title="Conectá tu Spotify Premium">
          En el panel de tu espacio, tocá &quot;Conectar Spotify&quot;. Necesitás una cuenta <strong>Spotify Premium</strong> (la versión gratuita no funciona).
          Después de conectar, <strong>dejá Spotify abierto</strong> en el celular, compu o parlante donde querés que suene la música.
        </Step>

        <Step num={3} title="Compartí el QR con tus clientes">
          Una vez conectado Spotify, vas a ver tu QR y enlace. Podés:
          <ul style={{ paddingLeft: 20, marginTop: 8, lineHeight: 1.8 }}>
            <li><strong>Descargar el QR</strong> como imagen PNG para imprimir</li>
            <li><strong>Copiar el enlace</strong> para compartir por WhatsApp u otra app</li>
          </ul>
          Poné el QR visible en tu local (barra, mesas, entrada).
        </Step>

        <Step num={4} title="Gestioná la música desde tu panel">
          Desde tu panel podés:
          <ul style={{ paddingLeft: 20, marginTop: 8, lineHeight: 1.8 }}>
            <li><strong>Saltar canciones</strong> que no te gustan</li>
            <li><strong>Eliminar canciones</strong> de la cola (con confirmación)</li>
            <li><strong>Ver estadísticas</strong>: canciones del día, votos, más votada</li>
            <li><strong>Generar una playlist</strong> en Spotify con las más votadas</li>
            <li><strong>Ver como cliente</strong>: probá la experiencia antes de abrir</li>
          </ul>
        </Step>

        <Step num={5} title="Configurá las funcionalidades">
          En <strong>Ajustes → Funcionalidades</strong> podés activar o desactivar:
          <ul style={{ paddingLeft: 20, marginTop: 8, lineHeight: 1.8 }}>
            <li><strong>Dedicatorias</strong>: tus clientes pueden dedicar canciones</li>
            <li><strong>Mesas / Grupos</strong>: pueden ponerle nombre a su grupo</li>
            <li><strong>Reacciones con emojis</strong>: emojis flotantes mientras suena la música</li>
            <li><strong>Batalla de DJs</strong>: modo competencia entre dos DJs</li>
          </ul>
          Cada espacio es distinto. Un bar de rock puede querer solo votación, un bar de tragos puede activar todo.
        </Step>

        <Step num={6} title="PIN para empleados (opcional)">
          Si querés que tu bartender o empleado controle la música sin tu contraseña,
          creá un PIN de 4 dígitos en Ajustes. Ellos entran a <strong>/admin/tu-espacio</strong> y ponen el PIN.
        </Step>
      </div>

      {/* ─── SECTION: Para organizadores de eventos ─── */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 20, color: 'var(--accent)' }}>
          Para organizadores de eventos
        </h2>

        <Step num={1} title="Creá tu evento">
          Registrate, elegí &quot;Organizo un evento&quot; y completá: nombre, hora de inicio, hora de fin
          y máximo de canciones por persona.
        </Step>

        <Step num={2} title="Conectá Spotify y compartí el código">
          Igual que para espacios: conectá tu Spotify Premium y dejalo abierto.
          Tu evento tiene un <strong>código de 6 letras</strong> (ej: ABC123). Compartilo con tus invitados por:
          <ul style={{ paddingLeft: 20, marginTop: 8, lineHeight: 1.8 }}>
            <li><strong>WhatsApp</strong>: botón directo con mensaje pre-armado</li>
            <li><strong>QR</strong>: para mostrar en pantalla o imprimir</li>
            <li><strong>Copiar código</strong>: para pegar donde quieras</li>
          </ul>
        </Step>

        <Step num={3} title="Gestioná durante el evento">
          Tu panel tiene las mismas funciones que un espacio: cola, historial, estadísticas y ajustes.
          Además podés <strong>finalizar el evento</strong> cuando quieras desde el botón en la parte superior.
        </Step>

        <Step num={4} title="Activá funcionalidades sociales">
          En Ajustes podés activar dedicatorias, mesas/grupos y reacciones.
          Para un casamiento o cumpleaños, te recomendamos activar todo — es la experiencia completa.
        </Step>
      </div>

      {/* ─── SECTION: Para invitados ─── */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 20, color: 'var(--accent)' }}>
          Para invitados (los que eligen la música)
        </h2>

        <Step num={1} title="Escaneá el QR o ingresá el código">
          Si estás en un bar, <strong>escaneá el QR</strong> con la cámara de tu celular.
          Si te dieron un código de evento, entrá a <strong>nextup.app</strong> y tocá &quot;Tengo un código de evento&quot;.
          Poné las 6 letras y listo.
        </Step>

        <Step num={2} title="Buscá y agregá canciones">
          Usá el buscador para encontrar tu canción favorita. Tocá el botón <strong>+</strong> para agregarla a la cola.
          Si el organizador activó dedicatorias, vas a poder ponerle un mensaje (ej: &quot;Para Sofi&quot;).
        </Step>

        <Step num={3} title="Votá las que te gustan">
          En la cola vas a ver todas las canciones que la gente pidió. Tocá la <strong>flecha para arriba</strong> para votar.
          La canción con más votos suena primero. La cola se <strong>ordena automáticamente por votos</strong>.
        </Step>

        <Step num={4} title="Reaccioná mientras suena">
          Si el lugar tiene reacciones activadas, vas a ver 5 emojis debajo de la canción que está sonando.
          Tocá uno y va a flotar en la pantalla de todos. Es como un aplauso virtual.
        </Step>

        <Step num={5} title="Cuando tu canción suena...">
          Si la canción que votaste empieza a sonar, vas a ver un <strong>festejo con confetti</strong> y un cartel
          &quot;Tu canción está sonando!&quot;. Disfrutala.
        </Step>

        <Step num={6} title="Mirá tu resumen al final">
          Al final de la noche, bajá hasta el final de la página y tocá &quot;Ver mi resumen de la noche&quot;.
          Vas a ver cuántas canciones agregaste, cuántos votos diste y cuál fue tu hit de la noche.
          Podés compartirlo por <strong>WhatsApp</strong>.
        </Step>
      </div>

      {/* ─── FAQ ─── */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 20 }}>
          Preguntas frecuentes
        </h2>

        <Faq q="¿Necesito descargar una app?">
          No. Nextup funciona desde el navegador del celular. No necesitás descargar nada.
        </Faq>

        <Faq q="¿Necesito crear una cuenta para votar?">
          No. Los invitados pueden buscar, agregar canciones y votar sin crear cuenta.
          Solo el dueño del espacio o el organizador del evento necesita registrarse.
        </Faq>

        <Faq q="¿Qué pasa si la misma canción se pide muchas veces?">
          Si una canción ya está en la cola, no se puede agregar de nuevo. Si se reprodujo hace poco,
          hay un período de espera de 30 minutos antes de poder pedirla otra vez.
        </Faq>

        <Faq q="¿Necesito Spotify Premium?">
          Sí, el organizador necesita una cuenta Spotify Premium.
          La versión gratuita no permite controlar la reproducción desde Nextup.
          Los invitados no necesitan Spotify.
        </Faq>

        <Faq q="¿Spotify tiene que estar abierto?">
          Sí. Nextup controla la reproducción a través de Spotify. Dejá la app de Spotify
          abierta en el dispositivo donde querés que suene la música (celular, parlante, compu).
        </Faq>

        <Faq q="¿Cuánta gente puede votar al mismo tiempo?">
          No hay límite. Nextup está diseñado para funcionar con muchas personas votando a la vez.
        </Faq>

        <Faq q="¿Se puede bloquear canciones o artistas?">
          Todavía no, pero está en nuestro roadmap. Por ahora, el admin puede eliminar canciones
          de la cola manualmente.
        </Faq>
      </div>

      <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
        ¿Tenés más dudas?{' '}
        <Link href="/terminos" style={{ color: 'inherit', textDecoration: 'underline' }}>Términos de servicio</Link>
      </p>
    </main>
  );
}

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-start' }}>
      <span style={{
        width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: 'var(--text-on-accent)',
        fontWeight: 800, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{num}</span>
      <div>
        <h3 style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: 4 }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>{children}</p>
      </div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
      <summary style={{ fontWeight: 600, fontSize: 'var(--text-base)', cursor: 'pointer', color: 'var(--text)' }}>{q}</summary>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 'var(--text-sm)', marginTop: 8 }}>{children}</p>
    </details>
  );
}
