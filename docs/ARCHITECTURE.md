# Arquitectura de Nextup

## Overview

Nextup es una plataforma SaaS de jukebox democratica. Los clientes de un venue (bar, evento, previa, gym) escanean un QR, buscan canciones en Spotify, las agregan a una cola y votan. La cancion mas votada suena despues.

## Diagrama de arquitectura

```
                     ┌──────────────┐
                     │   Spotify    │
                     │   Web API    │
                     └──────┬───────┘
                            │ REST
                            │
┌─────────────┐    ┌────────┴────────┐    ┌──────────────┐
│   Cliente   │◄──►│    NestJS API   │◄──►│  PostgreSQL   │
│  (Next.js)  │    │   (Backend)     │    │   (Prisma)    │
│  port 3000  │    │   port 3001     │    │   port 5434   │
└─────────────┘    └─────────────────┘    └──────────────┘
       │                    │
       │              WebSocket (Socket.io)
       │◄───────────────────┘
       │
  Real-time updates
  (cola, now-playing, votos)
```

## Stack tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Frontend | Next.js (App Router) | 15 |
| UI | React | 19 |
| Backend | NestJS | 11 |
| ORM | Prisma | 6 |
| Base de datos | PostgreSQL | 16 |
| Real-time | Socket.io | 4 |
| Auth | JWT + Passport + bcrypt | - |
| Rate limiting | @nestjs/throttler | 6 |
| Error tracking | Sentry | 10 |
| Monorepo | pnpm + Turborepo | 9 / 2 |
| CI/CD | GitHub Actions | - |
| Deploy | Vercel (web) + Railway (api) | - |

## Estructura del monorepo

```
nextup/
├── apps/
│   ├── api/                    # NestJS backend
│   │   └── src/
│   │       ├── auth/           # Autenticacion (JWT, Spotify OAuth)
│   │       ├── venues/         # CRUD de venues
│   │       ├── queue/          # Cola, votos, WebSocket, song watcher
│   │       ├── spotify/        # Integracion con Spotify Web API
│   │       └── prisma/         # PrismaService (DB connection)
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/            # Pages (App Router)
│           │   ├── login/      # Login
│           │   ├── registro/   # Registro
│           │   ├── dashboard/  # Panel del admin (JWT auth)
│           │   ├── admin/      # Acceso staff (PIN auth)
│           │   ├── venue/      # Pagina del cliente
│           │   └── bar/        # Redirect backward compat
│           ├── components/     # UI components
│           ├── hooks/          # Custom React hooks
│           └── lib/            # Utilidades (api fetch)
├── packages/
│   ├── database/               # Prisma schema + client
│   │   └── prisma/
│   │       └── schema.prisma
│   └── types/                  # TypeScript interfaces compartidas
├── docs/                       # Documentacion
├── .github/workflows/          # CI/CD
├── turbo.json                  # Turborepo config
├── railway.toml                # Deploy backend
├── vercel.json                 # Deploy frontend
└── README.md
```

## Modulos del backend (NestJS)

### AuthModule
- `AuthController` — register, login, refresh, me, logout
- `AuthService` — bcrypt hashing, JWT generation, token rotation
- `JwtStrategy` — Passport strategy, lee token de httpOnly cookie
- `JwtAuthGuard` — protege rutas que requieren autenticacion
- `VenueAdminGuard` — acepta JWT (owner) O PIN (staff)
- `SpotifyAuthController` — OAuth flow con Spotify

### VenuesModule
- `VenuesController` — CRUD de venues con ownership checks
- `VenuesService` — logica de negocio, sanitizacion de datos

### QueueModule
- `QueueController` — endpoints de cola, busqueda, play, skip, stats
- `QueueService` — logica de cola, votos, ranking, historial
- `QueueGateway` — WebSocket (Socket.io) para actualizaciones real-time
- `SongWatcherService` — polling adaptativo de Spotify (detecta cambios de cancion)

### SpotifyModule
- `SpotifyService` — integracion con Spotify Web API (search, play, queue, skip, devices)

### PrismaModule
- `PrismaService` — conexion a PostgreSQL, lifecycle hooks

## Flujo de datos

### Cliente agrega cancion:
1. Cliente busca en SearchBar → `GET /queue/:venueId/search`
2. SpotifyService llama a Spotify Search API
3. Cliente toca "+" → `POST /queue/:venueId/add`
4. QueueService crea QueuedSong + Vote + VenueTrack (ranking)
5. QueueGateway emite `queue-updated` via WebSocket a todos en el room
6. Todos los clientes ven la cola actualizada instantaneamente

### Song Watcher (polling loop):
1. Cada 1.5-10s (adaptativo), consulta Spotify `/me/player/currently-playing`
2. Si la cancion cambio, marca la anterior como played
3. Si quedan <30s de la cancion actual, encola la proxima votada en Spotify
4. Emite `now-playing-changed` y `queue-updated` via WebSocket

### Autenticacion:
1. Register/Login → genera access_token (15min) + refresh_token (7d)
2. Tokens se envian como httpOnly cookies (no localStorage)
3. Frontend hace requests con `credentials: 'include'`
4. Middleware de Next.js protege `/dashboard/*`
5. JwtAuthGuard protege endpoints del backend
6. Refresh token rotation: cada refresh invalida el anterior
