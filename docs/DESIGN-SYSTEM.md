# Design System & Patrones — Nextup

Documentacion completa del sistema de diseno, tokens, patrones de arquitectura y buenas practicas implementadas.

---

## 1. Tokens de Color

### Base
| Token | Valor | Uso |
|-------|-------|-----|
| `--bg` | #0a0a0a | Background principal |
| `--text` | #e8e8e8 | Texto principal (4.6:1 contrast) |
| `--text-secondary` | #999999 | Texto secundario |
| `--text-tertiary` | #8a8a8a | Texto sutil (WCAG AA 4.52:1) |

### Superficies (3 niveles de elevacion)
| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-surface-1` | rgba(255,255,255,0.03) | Cards base |
| `--bg-surface-2` | rgba(255,255,255,0.06) | Cards hover |
| `--bg-surface-3` | rgba(255,255,255,0.10) | Cards elevadas |
| `--bg-card` | rgba(255,255,255,0.04) | Cards genericas |
| `--bg-card-solid` | rgba(20,20,20,0.85) | Cards solidas (glassmorphism) |
| `--bg-elevated` | rgba(255,255,255,0.07) | Elementos elevados |
| `--bg-glass` | rgba(255,255,255,0.05) | Glassmorphism |

### Acentos
| Token | Valor | Uso |
|-------|-------|-----|
| `--accent` | #1DB954 | Verde Spotify — acciones primarias |
| `--accent-hover` | #1ed760 | Hover de acciones primarias |
| `--accent-glow` | rgba(29,185,84,0.25) | Glow en focus/badges |
| `--accent-subtle` | rgba(29,185,84,0.1) | Background sutil verde |
| `--accent-blue` | #3b82f6 | Info/links |
| `--accent-amber` | #f59e0b | Ranking/badges |
| `--danger` | #ff4757 | Error/delete |

### Bordes
| Token | Valor | Uso |
|-------|-------|-----|
| `--border` | rgba(255,255,255,0.06) | Bordes default |
| `--border-hover` | rgba(255,255,255,0.12) | Bordes en hover |

---

## 2. Sombras (sistema de capas compuestas)

| Token | Valor | Uso |
|-------|-------|-----|
| `--shadow-sm` | 2 capas | Sombra sutil (botones, inputs) |
| `--shadow-md` | 2 capas | Sombra media (cards, dropdowns) |
| `--shadow-lg` | 3 capas | Sombra profunda (modals, overlays) |
| `--shadow-accent` | 2 capas verde | Sombra con color accent |

Las sombras usan multiples capas para simular profundidad realista (patron Vercel/Stripe).

---

## 3. Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | 8px | Album art, botones compactos |
| `--radius-md` | 12px | Inputs, cards pequenas |
| `--radius-lg` | 16px | Cards grandes, contenedores |
| `--radius-xl` | 20px | Contenedores principales |
| `--radius-full` | 9999px | Botones pill, badges, dots |

---

## 4. Tipografia

**Fuente:** Inter (Google Fonts) con fallback system stack

| Uso | Tamano | Peso | Letter-spacing |
|-----|--------|------|---------------|
| Hero titulo | 3rem | 900 | -0.04em |
| Titulos pagina | 1.5rem | 800 | -0.02em |
| Card nombres | 1.1rem | 700 | -0.01em |
| Botones | 0.95rem | 700 | — |
| Body texto | 0.9rem | 500-600 | — |
| Labels | 0.78rem | 600-700 | 0.06em uppercase |
| Captions | 0.65rem | 500 | tabular-nums |

---

## 5. Transiciones

| Token | Valor | Uso |
|-------|-------|-----|
| `--transition-fast` | 150ms ease | Hovers, toggles |
| `--transition-base` | 250ms ease | Cambios de estado |
| `--transition-slow` | 400ms ease | Entradas de pagina |
| `--transition-spring` | 500ms bounce | Votos, agregar |

Curva: `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design ease)
Spring: `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot bounce)

---

## 6. Animaciones (12 keyframes)

| Nombre | Duracion | Uso |
|--------|----------|-----|
| shimmer | 1.5s | Skeleton loading |
| pulseGlow | 2s | Badge "En vivo", "Tu cancion!" |
| eqBar1/2/3 | 0.7-0.9s | Equalizer NowPlaying |
| fadeInUp | slow | Entrada de paginas |
| fadeIn | base | Fade simple |
| slideIn | slow | Entrada de items de lista |
| borderSpin | 4s | Borde animado NowPlaying |
| breathe | 6s | Glow de landing |
| votePop | 500ms | Bounce al votar |
| addBounce | 500ms | Bounce al agregar |
| toastIn | 300ms | Entrada de toast |
| spin | 0.8s | Loading spinner |

---

## 7. Efectos visuales

### Glassmorphism
```css
backdrop-filter: blur(16-24px) saturate(120-150%);
background: rgba(20, 20, 20, 0.85-0.95);
border: 1px solid rgba(255, 255, 255, 0.04-0.06);
```
Usado en: NowPlaying, SearchBar results, Toast, Coachmark

### Noise texture
```css
body::before { background-image: url("data:image/svg+xml,..."); opacity: 0.025; }
```
SVG fractalNoise overlay en todo el body (patron Linear/Raycast)

### Gradientes ambientales
- Body: radial-gradient verde sutil en esquinas
- NowPlaying: conic-gradient animado en borde
- Dynamic album color: radial-gradient con color extraido del album art
- Landing: dot grid pattern (32x32px)
- Text gradient: linear-gradient en titulo hero

---

## 8. Accesibilidad (WCAG 2.1 AA)

### Color y contraste
- Texto principal: 4.6:1 sobre fondo oscuro
- Texto terciario: 4.52:1 (minimo AA)
- Nunca color-only para status (siempre con texto o icono)

### Interaccion
- Touch targets: minimo 44px en todos los botones
- `:focus-visible`: outline 2px verde con offset
- `-webkit-tap-highlight-color: transparent`
- Haptic feedback (navigator.vibrate) al votar

### Screen readers
- `aria-label` en todos los botones de iconos
- `aria-live="polite"` en NowPlaying y QueueList
- `role="alert"` en mensajes de error
- `role="list"` en QueueList y TopTracks
- `aria-describedby` en PIN inputs
- Clase `.sr-only` para contenido solo screen reader

### Reduced motion
```css
@media (prefers-reduced-motion: reduce) {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```
Override global + overrides especificos por componente

### Formularios
- Todos los inputs tienen `htmlFor`/`id` vinculados
- Inputs numericos usan `inputMode="numeric"`
- Zoom habilitado (sin maximumScale)

---

## 9. Arquitectura Backend (NestJS 11)

### Modulos
```
AppModule
├── ConfigModule (global, Joi validation)
├── ThrottlerModule (5/s, 30/10s, 100/min)
├── PrismaModule (@Global)
├── AuthModule (JWT + Passport + bcrypt)
├── VenuesModule (CRUD + ownership)
├── SpotifyModule (API integration)
├── QueueModule (cola + votos + watcher)
└── EventsModule (eventos temporales)
```

### Guards
- **JwtAuthGuard**: Passport strategy, lee cookie `access_token`
- **VenueAdminGuard**: dual auth (JWT owner O PIN staff), `crypto.timingSafeEqual`
- **ThrottlerGuard**: global, rate limiting por IP

### Middleware
- **SessionMiddleware**: genera UUID httpOnly cookie, 1 anio, secure en prod

### Service patterns
- **Token cache**: Map en memoria con TTL y cleanup periodico
- **Refresh lock**: Promise-based lock previene thundering herd
- **Atomic transactions**: `prisma.$transaction` para votos
- **Entity-aware**: SpotifyService acepta `entityType: 'venue' | 'event'`
- **Retry con backoff**: 429 (Retry-After), 401 (refresh), 502 (wait 1s)
- **Timeouts**: AbortController 8-10s en todas las llamadas externas

### Polling adaptativo (SongWatcher)
- `< 10s restantes`: poll cada 1.5s
- `< 20s restantes`: poll cada 3s
- `Normal`: poll cada 5s
- `Nada sonando`: poll cada 10s
- Venues y eventos en paralelo

---

## 10. Base de datos (Prisma + PostgreSQL)

### Modelos: 9
User, RefreshToken, Venue, QueuedSong, Vote, VenueTrack, Event, EventSong, EventVote

### Indexes estrategicos
| Modelo | Index | Query optimizado |
|--------|-------|-----------------|
| QueuedSong | (venueId, played) | getQueue |
| QueuedSong | spotifyId | cooldown check |
| Vote | songId | delete cascade |
| Vote | (songId, sessionId) unique | duplicado vote |
| VenueTrack | (venueId, totalRequests) | ranking |
| VenueTrack | (venueId, spotifyId) unique | upsert |
| Event | accessCode | guest lookup |
| EventSong | (eventId, played) | getQueue |

### Cascade deletes
- User → Venue, Event, RefreshToken
- Venue → QueuedSong, VenueTrack
- QueuedSong → Vote
- Event → EventSong
- EventSong → EventVote

---

## 11. Seguridad

| Capa | Implementacion |
|------|---------------|
| Auth | JWT httpOnly cookies (access 15min + refresh 7d con rotacion) |
| Passwords | bcrypt salt=12 |
| PINs | crypto.timingSafeEqual |
| Session | httpOnly cookie UUID (tamper-proof) |
| Rate limiting | 3 niveles via @nestjs/throttler |
| CORS | origin: FRONTEND_URL, credentials: true |
| WebSocket CORS | mismo FRONTEND_URL |
| Cookies cross-domain | sameSite: none + secure: true en prod |
| Tokens Spotify | nunca expuestos al frontend (retorna boolean) |
| Config validation | Joi schema al startup |
| Security headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Sentry | error tracking en backend + frontend |

---

## 12. Real-time

| Patron | Implementacion |
|--------|---------------|
| WebSocket | Socket.io con namespaces (default + /events) |
| Rooms | Segregados por venueId/eventId |
| Auto-reconnect | Backoff exponencial (1s → 10s max) |
| Optimistic updates | Vote se refleja antes de confirmacion server |
| Rollback | vote-error trigger re-sync de cola |
| NowPlaying | WebSocket instant + HTTP poll fallback (10s) |
| Progress bar | Interpolacion client-side (1s tick) |

---

## 13. Frontend

### Hooks
| Hook | Funcion |
|------|---------|
| useQueue | WebSocket generico (venue/event), votos, persistence |
| useBarQueue | Wrapper para venues |
| useEventQueue | Wrapper para eventos |
| useAuth | JWT auth state, login, register, logout, auto-refresh |
| useSessionId | UUID local (sync, fallback para HTTP sin cookie) |
| useAlbumColor | Extrae color dominante del album art (canvas 16x16) |

### Componentes
| Componente | Funcion |
|------------|---------|
| NowPlaying | Cancion actual con equalizer, progress bar, gradient border |
| SearchBar | Busqueda con debounce, AbortController, skeleton, entity-aware |
| QueueList | Cola con votos, badges, play/delete, React.memo |
| TopTracks | Ranking historico con add-to-queue |
| ShareButton | Web Share API + clipboard fallback |
| Toast | Notificaciones glassmorphism (success/error/info) |
| Coachmark | Tour onboarding con tooltips, position fixed |
| AnimatedNumber | Contador animado (ease-out cubic, 60fps) |

### State management
- No Redux/Zustand — estado local con useState + useEffect
- WebSocket para real-time sync
- localStorage para vote persistence y coachmark state
- httpOnly cookies para session y auth (server-side authority)
