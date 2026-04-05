# API Reference — Nextup

Base URL: `http://localhost:3001` (dev) o `https://tu-api.railway.app` (prod)

Autenticacion: httpOnly cookies (`access_token`, `refresh_token`)

Session: httpOnly cookie `nextup_session` (seteada automaticamente en el primer request a /queue/*).
Fuente de verdad para votos. El frontend usa header `x-session-id` como fallback si la cookie no esta disponible (cross-domain).

---

## Auth

### POST /auth/register
Crear cuenta nueva.

**Body:**
```json
{ "email": "user@email.com", "password": "123456", "name": "Juan" }
```
**Response:** `200` — setea cookies + devuelve user
```json
{ "user": { "id": "cuid", "email": "user@email.com", "name": "Juan", "createdAt": "..." } }
```
**Errores:** `400` email invalido / password corta, `409` email ya registrado

### POST /auth/login
Iniciar sesion.

**Body:**
```json
{ "email": "user@email.com", "password": "123456" }
```
**Response:** `200` — setea cookies + devuelve user
**Errores:** `401` credenciales invalidas

### POST /auth/refresh
Refrescar access token (usa refresh_token cookie).

**Response:** `200` — setea nuevas cookies
**Errores:** `401` no refresh token o token invalido

### GET /auth/me
Usuario actual (requiere auth).

**Response:** `200`
```json
{ "user": { "id": "cuid", "email": "...", "name": "...", "createdAt": "..." } }
```
**Errores:** `401` no autenticado

### POST /auth/logout
Cerrar sesion. Borra cookies y refresh token de DB.

**Response:** `200` `{ "ok": true }`

---

## Auth Spotify

### GET /auth/spotify?venueId=xxx
Redirige al OAuth de Spotify. Usa las credenciales del venue (o globales como fallback).

### GET /auth/spotify/callback
Callback de Spotify OAuth. Guarda tokens y redirige al dashboard.

---

## Venues

### POST /venues (auth requerida)
Crear venue.

**Body:**
```json
{ "name": "Mi Bar", "slug": "mi-bar", "adminPin": "1234" }
```
**Response:** `201` — venue creado (sin tokens sensibles)

### GET /venues/my (auth requerida)
Listar venues del usuario autenticado.

**Response:** `200` — array de venues

### GET /venues/:slug (publico)
Obtener datos publicos de un venue.

**Response:** `200`
```json
{ "id": "cuid", "name": "Mi Bar", "slug": "mi-bar", "active": true, "backgroundImage": null }
```

### GET /venues/:id/spotify-status (publico)
Estado de conexion de Spotify.

**Response:** `200`
```json
{ "connected": true, "tokenValid": true }
```

### POST /venues/:slug/verify-pin (publico)
Verificar PIN de admin (acceso staff).

**Body:** `{ "pin": "1234" }`
**Response:** `200` `{ "ok": true }` o `{ "ok": false }`

### PATCH /venues/:slug (auth + ownership)
Actualizar venue.

**Body:**
```json
{ "name": "Nuevo nombre", "adminPin": "5678", "backgroundImage": "https://...", "spotifyClientId": "xxx", "spotifyClientSecret": "xxx" }
```

### DELETE /venues/:slug (auth + ownership)
Eliminar venue y todos sus datos.

---

## Queue

### GET /queue/:venueId (publico)
Cola actual ordenada por votos.

**Response:** `200` — array de QueuedSong (played: false)

### POST /queue/:venueId/add (publico)
Agregar cancion a la cola.

**Session:** Cookie httpOnly `nextup_session` (seteada automaticamente). Fallback: header `x-session-id`
**Body:**
```json
{
  "spotifyId": "4iV5W9uYEdYUVa79Axb7Rh",
  "spotifyUri": "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
  "title": "Lose Control",
  "artist": "Teddy Swims",
  "albumArt": "https://i.scdn.co/image/..."
}
```
**Response:** `200` — Respuestas posibles:
- `{ alreadyExists: false, song: {...} }` — agregada exitosamente
- `{ alreadyExists: true, song: {...} }` — ya en cola
- `{ cooldown: true, cooldownMinutes: N }` — reproducida hace poco (30 min cooldown)

### GET /queue/:venueId/search?q=xxx (publico)
Buscar canciones en Spotify.

**Response:** `200` — array de TrackResult (max 8)

### GET /queue/:venueId/now-playing (publico)
Cancion actual en Spotify.

**Response:** `200` — CurrentTrack o `null`

### POST /queue/:venueId/skip (admin guard)
Saltar cancion actual.

**Auth:** JWT cookie (owner) o header `x-admin-pin` (staff)

### POST /queue/:venueId/play/:songId (admin guard)
Forzar reproduccion de una cancion de la cola.

**Auth:** JWT cookie o `x-admin-pin`
**Response:** `200` `{ "ok": true }` o `{ "ok": false, "error": "NO_DEVICE" }`

### DELETE /queue/:venueId/songs/:songId (admin guard)
Eliminar cancion de la cola.

### GET /queue/:venueId/history (publico)
Ultimas 20 canciones reproducidas.

### GET /queue/:venueId/stats (publico)
Estadisticas del dia: canciones tocadas, votos, mas votada.

### GET /queue/:venueId/top-tracks?limit=15 (publico)
Ranking historico de canciones mas pedidas del venue.

---

## Events

### POST /events (auth)
Crear evento. Body: `{ name, startsAt, endsAt, maxSongsPerUser?, adminPin? }`

### GET /events/my (auth)
Listar eventos del usuario.

### GET /events/code/:accessCode (publico)
Buscar evento por codigo de acceso.

### GET /events/:eventId/details (auth)
Detalles del evento (incluye `spotifyConnected`).

### PATCH /events/:eventId (auth)
Editar evento. Body: `{ name?, endsAt?, maxSongsPerUser?, adminPin? }`

### DELETE /events/:eventId (auth)
Cancelar evento (marca `active: false`).

### GET /events/:eventId/queue (publico)
Cola del evento.

### POST /events/:eventId/queue/add (publico, session)
Agregar cancion. Respuestas especiales:
- `{ alreadyExists: true }` — ya en cola
- `{ cooldown: true, cooldownMinutes: N }` — reproducida hace poco
- `{ limitReached: true, max: N }` — limite por persona alcanzado

### GET /events/:eventId/queue/search?q= (publico)
Buscar canciones en Spotify.

### GET /events/:eventId/history (auth)
Historial de canciones reproducidas (ultimas 50).

### GET /events/:eventId/stats (auth)
Estadisticas: canciones totales, votos totales, mas votada.

### GET /events/:eventId/now-playing (publico)
Cancion actual.

### POST /events/:eventId/skip (auth o PIN)
Saltar cancion actual.

### DELETE /events/:eventId/songs/:songId (auth o PIN)
Eliminar cancion de la cola.

---

## WebSocket (Socket.io)

Conectar a: `ws://localhost:3001` o `wss://tu-api.railway.app`

### Eventos del cliente → servidor

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `join-venue` | `{ venueId }` | Unirse al room del venue |
| `vote` | `{ venueId, songId, sessionId }` | Votar una cancion |

### Eventos del servidor → cliente

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `queue-updated` | `{ queue: QueuedSong[] }` | Cola actualizada |
| `now-playing-changed` | `{ track: CurrentTrack }` | Cambio de cancion |
| `vote-error` | `{ message: string }` | Error al votar (ya voto) |
