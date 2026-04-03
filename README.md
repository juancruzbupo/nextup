# Nextup

La musica la elige tu gente. Busca, vota y sona.

Nextup es una plataforma SaaS donde los clientes de cualquier espacio (bares, eventos, cumples, gym, comedores) eligen y votan las canciones que suenan en Spotify. El dueno del espacio conecta su cuenta de Spotify, genera un QR, y los clientes escanean para buscar, agregar y votar canciones desde el celular.

## Stack

- **Monorepo**: pnpm + Turborepo
- **Backend**: NestJS 11 + TypeScript (apps/api, puerto 3001)
- **Frontend**: Next.js 15 App Router + React 19 (apps/web, puerto 3000)
- **Base de datos**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.io (WebSockets)
- **Autenticacion**: JWT (httpOnly cookies) + bcrypt + Passport
- **Musica**: Spotify Web API

## Arquitectura

```
Cliente (celular)  <--WebSocket-->  NestJS API  <--REST-->  Spotify API
       |                               |
   Next.js SSR                    PostgreSQL
```

```
nextup/
  apps/
    api/          --> NestJS (backend)
    web/          --> Next.js (frontend)
  packages/
    database/     --> Prisma schema + client
    types/        --> TypeScript interfaces compartidas
```

## Setup local

### Requisitos

- Node.js 20+
- pnpm 9+
- Docker (para PostgreSQL)

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Levantar PostgreSQL con Docker

```bash
docker run -d --name nextup-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nextup \
  -p 5434:5432 \
  postgres:16-alpine
```

### 3. Configurar variables de entorno

**apps/api/.env**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/nextup
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
JWT_SECRET=tu-secret-de-desarrollo
JWT_REFRESH_SECRET=tu-refresh-secret-de-desarrollo
```

**apps/web/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Crear tablas en la DB

```bash
cd packages/database
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/nextup" pnpm exec prisma db push
```

### 5. Levantar el proyecto

```bash
pnpm dev
```

Esto levanta ambas apps en paralelo:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Configurar Spotify

1. Ir a https://developer.spotify.com/dashboard
2. Crear una app con Redirect URI: `http://127.0.0.1:3001/auth/spotify/callback`
3. Seleccionar Web API
4. Copiar Client ID y Client Secret al `.env`

## Flujo de uso

### Admin (dueno del espacio)

1. Registrarse en `/registro`
2. Crear un venue en `/dashboard/nuevo`
3. Conectar Spotify desde `/dashboard/[slug]`
4. Abrir Spotify y poner play a cualquier cancion
5. Generar QR desde la pestaña Config y ponerlo visible

### Cliente (persona en el espacio)

1. Escanear QR -> entra a `/venue/[slug]`
2. Ve que cancion esta sonando
3. Busca canciones y las agrega a la cola
4. Vota canciones de otros
5. La mas votada suena despues

### Staff (acceso rapido)

1. Entrar a `/admin/[slug]`
2. Ingresar PIN de 4 digitos
3. Puede skip, play, eliminar canciones

## Endpoints principales

### Auth
- `POST /auth/register` - Crear cuenta
- `POST /auth/login` - Iniciar sesion
- `POST /auth/refresh` - Refrescar token
- `GET /auth/me` - Usuario actual
- `POST /auth/logout` - Cerrar sesion
- `GET /auth/spotify` - OAuth Spotify
- `GET /auth/spotify/callback` - Callback OAuth

### Venues
- `POST /venues` - Crear venue (auth requerida)
- `GET /venues/my` - Mis venues (auth requerida)
- `GET /venues/:slug` - Datos del venue (publico)
- `PATCH /venues/:slug` - Actualizar venue (auth + ownership)
- `DELETE /venues/:slug` - Eliminar venue (auth + ownership)

### Queue
- `GET /queue/:venueId` - Cola actual (publico)
- `POST /queue/:venueId/add` - Agregar cancion (publico)
- `GET /queue/:venueId/search` - Buscar en Spotify (publico)
- `GET /queue/:venueId/now-playing` - Cancion actual (publico)
- `POST /queue/:venueId/skip` - Saltar cancion (admin)
- `POST /queue/:venueId/play/:songId` - Reproducir cancion (admin)
- `DELETE /queue/:venueId/songs/:songId` - Eliminar de cola (admin)
- `GET /queue/:venueId/history` - Historial (admin)
- `GET /queue/:venueId/stats` - Estadisticas (admin)

### WebSocket (Socket.io)
- `join-venue` - Unirse al room del venue
- `vote` - Votar una cancion
- `queue-updated` - Cola actualizada (server -> client)
- `now-playing-changed` - Cancion cambio (server -> client)

## Deploy

### Backend -> Railway
- PostgreSQL plugin para DB
- Build: `pnpm install && prisma generate && pnpm --filter @nextup/api build`
- Start: `pnpm --filter @nextup/api start:prod`

### Frontend -> Vercel
- Root: `apps/web`
- Build: `pnpm turbo build --filter=@nextup/web`
- Env: `NEXT_PUBLIC_API_URL=https://tu-api.railway.app`

### Spotify
- Actualizar Redirect URI en Spotify Dashboard con la URL de produccion

## Seguridad

- Autenticacion JWT con httpOnly cookies (access 15min + refresh 7 dias)
- Passwords hasheados con bcrypt (salt=12)
- Rate limiting global (5 req/s, 30 req/10s, 100 req/min por IP)
- Guard dual en endpoints admin (JWT owner + PIN staff)
- CORS configurado por dominio
- Token refresh con rotacion

## Licencia

MIT
