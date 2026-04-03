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

---

## P2 — Medio impacto (mejora el producto)

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

- [x] Monorepo setup (pnpm + Turborepo)
- [x] NestJS backend con auth JWT
- [x] Next.js frontend con App Router
- [x] Spotify OAuth + token management
- [x] Cola de canciones con votacion
- [x] WebSocket real-time (Socket.io)
- [x] Song watcher con adaptive polling
- [x] UI moderna (glassmorphism, ambient color, animated border)
- [x] Sistema de autenticacion (register, login, refresh, logout)
- [x] Multi-tenancy (User → Venue)
- [x] Per-venue Spotify credentials
- [x] Top Pedidas (ranking historico)
- [x] Toast notifications
- [x] Accesibilidad WCAG 2.1 AA
- [x] Rate limiting
- [x] Security headers
- [x] CI/CD (GitHub Actions)
- [x] Sentry error tracking
- [x] Railway + Vercel deploy config
- [x] Documentacion completa
- [x] Background image por venue
- [x] Haptic feedback
- [x] Animated counters
- [x] Landing page con mockup
