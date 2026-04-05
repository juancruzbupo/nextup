# Componentes Frontend — Nextup

## Hooks

### useAuth (`hooks/useAuth.tsx`)
Estado de autenticacion global.
- `user` — usuario actual o null
- `loading` — true mientras verifica auth
- `login(email, password)` — login con cookies
- `register(email, password, name)` — registro
- `logout()` — cierra sesion
- Auto-verifica `/auth/me` al montar, refresca si 401

### useBarQueue (`hooks/useBarQueue.ts`)
Cola en tiempo real via WebSocket.
- `queue` — array de QueuedSong ordenado por votos
- `nowPlaying` — CurrentTrack del WebSocket
- `vote(songId)` — vota con optimistic update + haptic feedback
- `isConnected` — estado de conexion WebSocket
- `votedSongs` — Set de IDs ya votados (persistido per-venue en localStorage)
- Auto-reconnect con backoff exponencial
- `withCredentials: true` — envia cookie httpOnly en WebSocket handshake
- Vote debounce 500ms con ref (previene double-click)
- Chequea socket.connected antes de emitir (no silent failures)
- Sort consistente: votes desc + createdAt asc (igual que backend)

### useSessionId (`hooks/useSessionId.ts`)
UUID local para UI (tracking de votedSongs en el frontend).
- Generacion sincrona (no async)
- Fallback para contextos sin crypto.randomUUID (HTTP en mobile)
- Nota: la autoridad del sessionId para votos es la cookie httpOnly del backend, no este UUID

### useAlbumColor (`hooks/useAlbumColor.ts`)
Extrae color dominante del album art.
- Usa canvas 16x16 para sampling
- Filtra pixels muy oscuros/claros
- Retorna [r, g, b] para ambient gradient
- Fallback a verde Nextup [29, 185, 84]

---

## Componentes

### NowPlaying (`components/NowPlaying.tsx`)
Muestra la cancion que esta sonando.
- **Props**: `venueId`, `onSkip?`, `externalTrack?`
- Animated gradient border (conic-gradient spin)
- Equalizer animado (3 barras)
- Progress bar con interpolacion client-side (1s tick)
- HTTP poll cada 10s como fallback
- Acepta track externo via prop (evita WebSocket duplicado)

### SearchBar (`components/SearchBar.tsx`)
Buscador de canciones en Spotify.
- **Props**: `venueId`
- Debounce 300ms con AbortController
- Skeleton shimmer durante carga
- "No se encontraron canciones" si vacio
- Anti double-click en agregar
- Glassmorphism en dropdown de resultados

### QueueList (`components/QueueList.tsx`)
Lista de canciones en cola.
- **Props**: `queue`, `onVote`, `votedSongs`, `showDelete?`, `onDelete?`, `onPlay?`
- React.memo para evitar re-renders
- Posicion numerada (#1, #2...)
- Badge "Proxima" (amber) en la primera
- Boton vote con bounce animation + haptic
- Botones play/delete opcionales (admin)
- aria-live region para screen readers

### TopTracks (`components/TopTracks.tsx`)
Ranking historico de canciones mas pedidas.
- **Props**: `venueId`, `queue`
- Fetch on mount (GET /queue/:venueId/top-tracks)
- Posicion con #1 en dorado
- Badge "X pedidas" en amber
- Boton "+" deshabilitado si ya esta en cola
- Se oculta si no hay datos

### Toast (`components/Toast.tsx`)
Sistema de notificaciones.
- **Provider**: `ToastProvider` (en providers.tsx)
- **Hook**: `useToast()` → `toast(message, type)`
- Tipos: success (verde), error (rojo), info (azul)
- Auto-dismiss 3 segundos
- Glassmorphism, spring animation
- aria-live="polite"

### AnimatedNumber (`components/AnimatedNumber.tsx`)
Contador animado para stats.
- **Props**: `value`, `duration?`
- requestAnimationFrame a 60fps
- Ease-out cubic easing
- Respeta prefers-reduced-motion

### Coachmark (`components/Coachmark.tsx`)
Tour interactivo de onboarding.
- **Props**: `id` (key unica para localStorage), `steps` (array de { target, text, position? })
- Position fixed — sigue al scroll
- Recalcula en scroll + resize (capture phase)
- Overlay oscuro con click-to-close
- Flecha apuntando al target element
- Contador de pasos + Siguiente / Entendido
- Glassmorphism + spring animation
- Se muestra solo una vez por id (localStorage)
- Respeta prefers-reduced-motion

---

## Pages

| Ruta | Tipo | Auth | Descripcion |
|------|------|------|-------------|
| `/` | Server | No | Landing page con mockup |
| `/login` | Client | No (redirect si auth) | Login form |
| `/registro` | Client | No (redirect si auth) | Register form → wizard |
| `/dashboard` | Client | JWT | Lista de venues (redirect a wizard si vacio) |
| `/dashboard/empezar` | Client | JWT | Wizard onboarding (venue/evento/join) |
| `/dashboard/nuevo` | Client | JWT | Crear venue |
| `/dashboard/nuevo-evento` | Client | JWT | Crear evento |
| `/dashboard/[slug]` | Client | JWT | Admin del venue |
| `/dashboard/eventos` | Client | JWT | Lista de eventos |
| `/dashboard/eventos/[eventId]` | Client | JWT | Admin del evento |
| `/venue/[slug]` | Client | No | Pagina del cliente (venue) |
| `/event/[accessCode]` | Client | No | Pagina del cliente (evento) |
| `/join` | Client | No | Ingresar codigo de evento |
| `/admin/[slug]` | Client | PIN | Acceso staff |
| `/bar/[slug]` | Server | No | Redirect → /venue/[slug] |
| `/terminos` | Server | No | Terminos de servicio |

---

## CSS Design System

### Variables principales (`globals.css`)

| Variable | Valor | Uso |
|----------|-------|-----|
| `--bg` | `#0a0a0a` | Background principal |
| `--bg-surface-1` | `rgba(255,255,255,0.03)` | Cards nivel 1 |
| `--bg-surface-2` | `rgba(255,255,255,0.06)` | Cards nivel 2 (hover) |
| `--bg-surface-3` | `rgba(255,255,255,0.10)` | Cards nivel 3 (elevated) |
| `--text` | `#e8e8e8` | Texto principal |
| `--text-secondary` | `#999999` | Texto secundario |
| `--text-tertiary` | `#8a8a8a` | Texto terciario (WCAG AA) |
| `--accent` | `#1DB954` | Verde Spotify |
| `--accent-amber` | `#f59e0b` | Dorado (badges, ranking) |
| `--accent-blue` | `#3b82f6` | Azul (info) |
| `--radius-sm/md/lg/xl` | `8/12/16/20px` | Border radius |
| `--transition-fast/base/slow` | `150/250/400ms` | Transiciones |
| `--transition-spring` | `500ms cubic-bezier(0.34,1.56,0.64,1)` | Spring easing |

### Efectos visuales
- Noise texture: SVG fractalNoise overlay en body::before
- Ambient gradients: radial-gradient en body background
- Glassmorphism: backdrop-filter blur(20px) saturate(150%)
- Compound shadows: 3-layer box-shadow
- Animated gradient border: @property + conic-gradient spin
