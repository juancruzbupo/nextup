# Backlog — Nextup

Funcionalidades pendientes priorizadas por impacto de negocio.

---

## P0 — Critico (necesario para monetizar)

### Monetizacion: Sistema de planes Freemium + Stripe
**Objetivo:** Generar revenue con modelo SaaS freemium.

**Planes:**
| Plan | Precio | Limites |
|------|--------|---------|
| Free | $0 | 1 venue, 20 canciones/dia, sin background custom |
| Pro | $9.99/mes | Venues ilimitados, canciones ilimitadas, background, top pedidas, QR custom |
| Business | $29.99/mes | Todo Pro + analytics avanzados, multiples admins por venue, soporte prioritario |

**Implementacion:**
- Modelo `Subscription` en Prisma (plan, status, stripeCustomerId, currentPeriodEnd)
- Campo `plan` en User (free/pro/business, default: free)
- Middleware de limites: chequea plan antes de crear venue o agregar cancion
- Integracion Stripe:
  - Stripe Checkout para upgrade
  - Stripe Webhooks para confirmar pago / cancelacion / renewal
  - Stripe Customer Portal para que el user gestione su suscripcion
- Pagina `/pricing` en la landing con comparacion de planes
- Pagina `/dashboard/billing` para ver plan actual y gestionar
- Banner en dashboard cuando se acercan al limite del plan free
- Estimado: 3-4 dias de desarrollo

### MusicProvider abstraction (requisito legal para monetizar)
**Objetivo:** Desacoplar la logica de votacion/cola del proveedor de musica para cumplir con las politicas de Spotify y poder monetizar legalmente.

**Implementacion:**
- Crear interfaz `MusicProvider` con metodos: searchTracks, getCurrentTrack, addToQueue, playTrack, skipTrack, getDevices
- Refactorizar SpotifyService actual como `SpotifyProvider` (implementa MusicProvider)
- Campo `musicProvider` en Venue ('spotify' | 'soundtrack' | 'feedfm')
- SpotifyProvider para uso personal (previas, cumples) — legal
- SoundtrackProvider o FeedFmProvider para uso comercial (venues) — licenciado
- QueueService, SongWatcher, gateway NO cambian — solo cambia el provider
- Ver docs/LEGAL.md para detalle completo
- Estimado: 3-4 dias

### Deploy a produccion
**Objetivo:** La app corriendo en internet, accesible para cualquiera.

**Pasos:**
- Deploy backend en Railway ($5/mes)
- Deploy frontend en Vercel (gratis)
- Configurar env vars de produccion
- Configurar Spotify redirect URI de produccion
- Configurar dominio custom (opcional)
- Ya documentado en DEPLOY.md

---

## P1 — Alto impacto (mejora retencion y UX)

### Share informativo por WhatsApp
- Boton "Compartir" en la pagina del cliente (venue y evento)
- Comparte mensaje tipo: "Estoy en [venue] y suena [cancion]. Veni a elegir la musica! nextup.app"
- NO comparte el link funcional del venue — solo marketing/invitacion
- La URL apunta a la landing de Nextup (genera awareness sin exponer el link de votacion)
- Para votar, hay que escanear el QR fisico en el lugar
- Usa Web Share API (navigator.share) con fallback a copiar texto
- Estimado: 2-3 horas

### Notificacion visual "tu cancion es la proxima"
- Badge o highlight especial cuando la cancion que el usuario agrego esta en posicion #1
- Sin push notifications — solo visual en la UI
- Comparar por sessionId para saber cual agrego el usuario
- Estimado: 2-3 horas

### Cooldown de canciones repetidas
- Evitar que la misma cancion se agregue dentro de los ultimos 30 minutos
- Chequeo en addSong: si spotifyId fue played en los ultimos N minutos, rechazar
- Configurable por venue (0 = sin cooldown)
- Estimado: 2 horas

### Modo "Que no suene" (lista negra)
- El admin puede bloquear canciones o artistas especificos
- Modelo BlockedTrack (venueId, spotifyId o artistName)
- SearchBar filtra los resultados bloqueados antes de mostrar
- Util para bares con estilo definido (rock bar no quiere cumbia)
- Estimado: 3-4 horas

### Filtro de contenido explicito
- El campo allowExplicit ya existe en eventos pero no se aplica
- Filtrar resultados de busqueda con el campo explicit de Spotify API
- Importante para cumpleanos de 15, corporativos, eventos familiares
- Estimado: 1 hora

### PWA (Progressive Web App)
- Instalable como app nativa desde el browser
- Icono en home screen, splash screen
- Funciona offline (muestra ultima cola conocida)
- Push notifications cuando la cancion del user esta por sonar
- next-pwa o @serwist/next para implementar
- Estimado: 1 dia

### Pay-per-event (eventos puntuales)
- Opcion de pagar $4.99 por un evento de 24hs sin suscripcion
- Ideal para cumpleanos, casamientos, previas
- Stripe Payment Links o Checkout session one-time
- Modelo `EventPass` en DB (userId, venueId, expiresAt)
- Estimado: 1-2 dias

### Multi-idioma (i18n)
- Soporte para espanol (actual) e ingles
- next-intl o next-i18next
- Detectar idioma del browser
- Expandir mercado a paises de habla inglesa
- Estimado: 2 dias

### Analytics avanzados para admins (plan Business)
- Canciones por hora del dia (grafico de barras)
- Dias mas activos de la semana
- Generos mas pedidos
- Cantidad de clientes unicos (por sessionId)
- Exportar a CSV
- Estimado: 2-3 dias

### Modo practica interactivo para dueños de bares
- Boton "Probar mi espacio" en admin que simula la experiencia completa
- Agrega canciones de ejemplo a una cola temporal, muestra votos, preview de 30s
- Todo sin afectar la cola real
- Reduce el miedo de Roberto (52) a "romper algo" antes de abrir
- Parcialmente cubierto por el link "Ver como cliente →" existente
- Estimado: 2-3 dias

### Undo de votos (deshacer voto accidental)
- Toast de 5 segundos "Votaste — Deshacer" despues de votar
- Requiere endpoint backend de un-vote (restar voto atomicamente, validar timing)
- Impacto bajo: votar "de mas" no es destructivo, la cancion solo sube un puesto
- Beneficia a Marta (65) con dedos grandes en pantalla chica
- Estimado: 1 dia (backend + frontend)

### Invitar por email/lista de invitados
- Enviar codigo de evento a una lista de emails
- Template personalizable ("Es el cumple de Sofia, veni a elegir la musica!")
- Requiere servicio de email (SendGrid/Resend)
- Estimado: 2 dias

### Bloquear canciones repetidas (lista negra por cancion)
- Admin puede banear canciones especificas de la busqueda
- Complementa el cooldown existente de 30 min
- Estimado: 3-4 horas

### Escalabilidad: Redis para token cache + horizontal scaling
- Migrar tokenCache de Map en memoria a Redis SETEX
- SongWatcher como workers separados (Bull queues)
- WebSocket con Redis adapter para multiples pods
- Necesario cuando superen ~100 venues activos
- Estimado: 1 semana

---

## P2 — Medio impacto (mejora el producto)

### Dedicatorias
- "Esta cancion va dedicada a..." con nombre del dedicante
- Se muestra en la UI cuando la cancion suena
- Matador para casamientos, cumpleanos, graduaciones
- Campo opcional al agregar cancion a la cola
- Estimado: 3-4 horas

### Pantalla para TV (/venue/[slug]/tv)
- Vista especial para poner en un TV del venue
- Muestra en grande: cancion actual + proximas 3
- Auto-refresh con WebSocket
- Diseno limpio, sin controles, solo informacion
- Estimado: 3-4 horas

### Cola prioritaria de pago
- El cliente paga para que su cancion suba al #1
- Integracion con Mercado Pago (Argentina) o Stripe
- Revenue share con el venue
- Este es el modelo de negocio de TouchTunes en USA
- Estimado: 1 semana

### Migrar historial a VenueTrack
- Script que recorre QueuedSong (played: true) y crea/actualiza VenueTrack
- Venues existentes tendrian ranking desde el dia 1
- One-time migration script
- Estimado: 2 horas

### Tests e2e
- Playwright para flows criticos:
  - Registro → crear venue → conectar Spotify → agregar cancion → votar
  - Login → dashboard → skip → play → delete
  - PIN access en /admin/[slug]
- CI: correr tests en GitHub Actions antes del deploy
- Estimado: 2-3 dias

### Cooldown de canciones repetidas
- Prevenir que la misma cancion se agregue cada 30 minutos
- Chequear en addSong si fue played en los ultimos N minutos
- Configurable por venue (0 = sin cooldown)
- Estimado: 3 horas

### Upload de imagen de fondo
- Reemplazar URL por upload directo
- Cloudinary o S3 para storage
- Resize automatico a 1080x1920
- Preview antes de guardar
- Estimado: 1 dia

### Notificaciones push
- Notificar al cliente cuando su cancion esta por sonar
- Web Push API + service worker
- Opt-in desde la pagina del venue
- Estimado: 2 dias

---

## P3 — Nice to have (diferenciadores)

### White-label / marca personalizada
- Logo custom en vez de "Nextup"
- Colores personalizados (accent color por venue)
- Dominio custom (mi-bar.com redirige a Nextup)
- Plan Business o addon $49.99/mes
- Estimado: 3-4 dias

### Modo DJ (control avanzado de reproduccion)
- Ajustar volumen desde Nextup
- Fade manual entre canciones
- Bloquear cola (pausar agregado de canciones)
- "Modo automatico" vs "Modo manual" (el admin decide cuando suena la proxima)
- Estimado: 2-3 dias

### Social features
- Reacciones en tiempo real a la cancion que suena (emojis tipo TouchTunes)
- "Dedicar" una cancion a alguien (mensaje + nombre)
- Compartir venue en redes sociales
- Estimado: 3 dias

### Integracion con Apple Music
- Alternativa a Spotify para venues que usan Apple Music
- Apple MusicKit JS para busqueda
- Apple Music API para playback control
- Estimado: 1 semana

### Gamificacion
- Puntos por agregar/votar canciones
- Leaderboard de "DJs" mas activos del venue
- Badges ("Primera cancion del dia", "10 votos en una noche")
- Estimado: 3-4 dias

### Command palette (admin)
- Cmd+K para acceso rapido en el dashboard
- Buscar venue, cancion, cambiar settings
- Tipo Linear/Vercel
- Estimado: 1 dia

---

## Completado

### Core
- [x] Monorepo setup (pnpm + Turborepo)
- [x] NestJS backend con auth JWT
- [x] Next.js frontend con App Router
- [x] Spotify OAuth + token management
- [x] Cola de canciones con votacion
- [x] WebSocket real-time (Socket.io)
- [x] Song watcher con adaptive polling
- [x] Sistema de autenticacion (register, login, refresh, logout)
- [x] Multi-tenancy (User → Venue)
- [x] Per-venue Spotify credentials
- [x] Top Pedidas (ranking historico)
- [x] Railway + Vercel deploy config
- [x] CI/CD (GitHub Actions)
- [x] Sentry error tracking

### UX/UI
- [x] UI moderna (glassmorphism, ambient color, animated border)
- [x] Landing page con mockup + CTAs auth-aware
- [x] Toast notifications con dismiss manual (4.5s)
- [x] Haptic feedback en votos
- [x] Animated counters (AnimatedNumber)
- [x] Background image por venue
- [x] Coachmark onboarding re-activable (boton ?)
- [x] Skeleton loading en dashboard y TopTracks
- [x] Badge "Popular" en resultados de busqueda (Spotify popularity)
- [x] Canciones en cola marcadas en busqueda (checkmark + "En cola")
- [x] "Votaste" y "suena en ~X canciones" en cola
- [x] "Se ordena por votos" hint en cola
- [x] "En vivo · X personas" listener count en tiempo real
- [x] QR visible por defecto en admin (no escondido en Ajustes)
- [x] "Ver como cliente →" link para probar sin miedo
- [x] WhatsApp share + Download QR como PNG
- [x] Confirmacion 2 toques para borrar canciones
- [x] Confirmacion antes de desconectar Spotify
- [x] Boton "Finalizar evento" visible en header
- [x] Horario inicio/fin visible para invitados del evento
- [x] Cooldown con minutos especificos ("Proba en 12 minutos")
- [x] Maximo de canciones con numero concreto
- [x] Evento finalizado con botones de salida
- [x] Skip button con toast de exito
- [x] Spotify OAuth toast de confirmacion al volver
- [x] Spotify token expirado: warning rojo + boton reconectar
- [x] "Spotify Premium requerido" explicito en setup
- [x] Busqueda deshabilitada: mensaje prominente con accion

### Texto y legal
- [x] Todo en español argentino (voseo), sin jerga tecnica
- [x] "Espacios" en vez de "Venues" en toda la UI
- [x] Tabs: "Estadisticas" y "Ajustes" en vez de "Stats"/"Config"
- [x] Disclaimer SADAIC/AADI-CAPIF en crear espacio y evento
- [x] Error de slug: "Ese nombre de enlace ya esta en uso"
- [x] Documentacion API, DESIGN-SYSTEM actualizada

### Accesibilidad (WCAG 2.1 AA)
- [x] Font sizes minimo 16px en mobile
- [x] Touch targets minimo 44px
- [x] Contraste WCAG AA en todos los textos
- [x] --text-on-accent token para botones
- [x] Tabs ARIA (role=tablist/tab/tabpanel, aria-selected)
- [x] Skip navigation global
- [x] Coachmark: focus restore, overlay keyboard, Escape, aria-dialog
- [x] NowPlaying: role=progressbar con aria-valuenow
- [x] Toast: aria-atomic, role=status
- [x] PIN input: aria-describedby + aria-invalid
- [x] SVGs decorativos: aria-hidden
- [x] Album art: alt text descriptivo
- [x] SearchBar: aria-live status region
- [x] Responsive breakpoints (dashboard, stats, landing)

### Escalabilidad
- [x] SongWatcher batching (10 venues por batch, 200ms delay)
- [x] Token cache bounded (max 500, cleanup cada 5 min, evict oldest)
- [x] WebSocket vote delta (enviar solo songId+votes, no cola completa)
- [x] Query select() en getQueue (solo campos necesarios)
- [x] Database indexes: Vote(createdAt), EventVote(createdAt), QueuedSong(votes)
- [x] Rate limiting per-IP (30/200/600)
- [x] Spotify retry jitter (previene thundering herd)
- [x] Frontend reconnect cap (30 attempts, 60s max)
- [x] Graceful shutdown en SongWatcher
- [x] Memory cleanup de Maps stale
- [x] Event queries con LIMIT y select()
- [x] dist/ y tsbuildinfo removidos del tracking
