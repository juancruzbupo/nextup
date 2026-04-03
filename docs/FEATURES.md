# Features — Nextup

## Para el cliente (persona en el venue)

### Acceso sin registro
- Escanea QR → entra a `/venue/[slug]` desde el celular
- No necesita cuenta, app, ni descarga
- Se identifica con UUID anonimo en localStorage

### Buscar canciones
- Buscador con debounce 300ms conectado a Spotify Search API
- Muestra hasta 8 resultados con album art, titulo, artista
- Boton "+" para agregar a la cola
- Feedback visual: check verde al agregar, "No se encontraron canciones" si vacio

### Votar
- Cada cancion en la cola tiene boton de voto con contador
- 1 voto por cancion por persona (tracking por sessionId)
- Optimistic update: el voto se refleja al instante
- Haptic feedback (vibracion 30ms) en mobile al votar
- Votos persistidos en localStorage por venue

### Ver que suena
- "Sonando ahora" con album art, titulo, artista, barra de progreso
- Equalizer animado (3 barras verdes)
- Barra de progreso con interpolacion client-side (no espera al poll)
- Timestamps mm:ss
- Animated gradient border premium
- Color ambiental dinamico extraido del album art

### Top Pedidas
- Ranking historico de canciones mas pedidas en ese venue
- Se construye organicamente con el uso (agregar + votar + reproducir)
- Boton "+" para agregar directo a la cola sin buscar
- Posicion #1 destacada en dorado

### Cola en tiempo real
- WebSocket (Socket.io) para actualizaciones instantaneas
- Posicion numerada, badge "Proxima" en la primera
- Auto-reconnect con backoff exponencial
- Badge "EN VIVO" con dot pulsante cuando conectado

---

## Para el admin (dueno del venue)

### Dashboard (`/dashboard`)
- Lista de todos sus venues con estado de Spotify
- Crear nuevo venue con nombre, slug auto-generado, PIN opcional
- Acceso via JWT (email + password)

### Panel del venue (`/dashboard/[slug]`)
- **Now Playing** con boton skip
- **Cola** con botones play (forzar reproduccion) y eliminar
- **Historial** de ultimas 20 canciones reproducidas
- **Stats** con animated counters: canciones hoy, votos hoy, mas votada
- **Config**:
  - Spotify Developer credentials (Client ID + Secret por venue)
  - Tip DJ para activar crossfade
  - Nombre y PIN del venue
  - Imagen de fondo personalizable (URL)
  - Generador de QR para imprimir

### Acceso staff (`/admin/[slug]`)
- Acceso rapido con PIN de 4 digitos (sin cuenta)
- Mismas funciones que el dashboard para la cola
- Pensado para encargados/mozos del venue

### Spotify device detection
- Auto-detecta dispositivos disponibles
- Si no hay dispositivo activo, transfiere playback automaticamente
- Toast con mensaje claro si no hay dispositivo

---

## Sistema de reproduccion

### Song Watcher (polling adaptativo)
- Polling dinamico: 1.5s (fin de cancion) → 5s (normal) → 10s (nada sonando)
- Detecta cambio de cancion y marca la anterior como played
- Encola la proxima mas votada 30s antes de que termine la actual
- Tracking de canciones ya encoladas para evitar duplicados
- Guard contra encolado de la cancion que ya esta sonando

### Spotify integration
- Credenciales per-venue (cada admin usa su Spotify Developer app)
- Fallback a credenciales globales del env
- Token cache en memoria (evita DB hit por request)
- Token refresh con lock (previene thundering herd)
- Refresh 2 minutos antes de expiracion
- Manejo de errores: 401 retry, 429 rate limit, 502 transient, invalid_grant
- Request timeout 8-10s con AbortController
- Device auto-detection para play sin reproduccion activa

---

## Seguridad

- JWT httpOnly cookies (access 15min + refresh 7d con rotacion)
- bcrypt salt=12 para passwords
- crypto.timingSafeEqual para PINs (previene timing attacks)
- Rate limiting: 5 req/s, 30 req/10s, 100 req/min por IP
- CORS configurado por dominio (no wildcard)
- WebSocket CORS = FRONTEND_URL
- Venues publicos no exponen tokens ni PINs (select fields)
- ConfigModule valida env vars al startup con Joi
- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Sentry error tracking (backend + frontend)

---

## Accesibilidad (WCAG 2.1 AA)

- Color contrast 4.5:1+ en todo el texto
- Form labels con htmlFor/id en todos los formularios
- aria-label en botones de iconos (play, skip, vote, add, delete)
- aria-live regions para contenido dinamico (now-playing, cola, toasts)
- role="alert" en mensajes de error
- role="list" en QueueList y TopTracks
- prefers-reduced-motion respetado en todas las animaciones
- Zoom habilitado (sin maximumScale)
- PIN inputs con inputMode="numeric"
- Touch targets 44px+ en botones interactivos
- Focus visible con outline verde
- sr-only class para screen readers

---

## UI/UX Premium

- Dark theme con background ambiental (radial gradients)
- Noise texture overlay (SVG)
- Glassmorphism en search results y NowPlaying
- Compound layered shadows (tipo Vercel/Stripe)
- Animated gradient border en NowPlaying (conic-gradient spin)
- Dynamic album color extraction (canvas)
- Sticky frosted glass header
- Toast notification system (success/error/info con glassmorphism)
- Skeleton shimmer loading states
- Animated number counters en stats (ease-out cubic)
- Vote bounce animation (spring easing)
- Staggered entry animations
- Landing page con CSS-only product mockup
- Dot grid background pattern
