# Base de Datos — Nextup

ORM: Prisma 6 | DB: PostgreSQL 16

## Diagrama de modelos

```
User
├── id (cuid, PK)
├── email (unique)
├── passwordHash (bcrypt)
├── name
├── createdAt
├── updatedAt
├── venues[] → Venue
└── refreshTokens[] → RefreshToken

RefreshToken
├── id (cuid, PK)
├── token (unique, bcrypt hash)
├── userId → User (cascade delete)
├── expiresAt
└── createdAt

Venue
├── id (cuid, PK)
├── name
├── slug (unique)
├── adminPin (optional)
├── spotifyClientId (optional)
├── spotifyClientSecret (optional)
├── spotifyAccessToken (optional)
├── spotifyRefreshToken (optional)
├── tokenExpiresAt (optional)
├── backgroundImage (optional)
├── active (default: true)
├── userId → User (cascade delete)
├── createdAt
├── updatedAt
├── songs[] → QueuedSong
└── topTracks[] → VenueTrack

QueuedSong
├── id (cuid, PK)
├── venueId → Venue (cascade delete)
├── spotifyUri
├── spotifyId
├── title
├── artist
├── albumArt (optional)
├── votes (default: 1)
├── played (default: false)
├── createdAt
└── votes_rel[] → Vote

Vote
├── id (cuid, PK)
├── songId → QueuedSong (cascade delete)
├── sessionId
├── createdAt
└── @@unique([songId, sessionId])

VenueTrack
├── id (cuid, PK)
├── venueId → Venue (cascade delete)
├── spotifyId
├── spotifyUri
├── title
├── artist
├── albumArt (optional)
├── totalRequests (default: 1)
├── lastRequested
└── @@unique([venueId, spotifyId])
```

## Indexes

| Modelo | Index | Proposito |
|--------|-------|-----------|
| Venue | `userId` | Listar venues de un usuario |
| QueuedSong | `[venueId, played]` | Query de cola activa |
| QueuedSong | `spotifyId` | Deteccion de duplicados y markAsPlayed |
| Vote | `songId` | Borrado en cascada rapido |
| Vote | `[songId, sessionId]` unique | Prevenir doble voto |
| RefreshToken | `userId` | Buscar tokens de un usuario |
| VenueTrack | `[venueId, spotifyId]` unique | Una entrada por cancion por venue |
| VenueTrack | `[venueId, totalRequests]` | Query de ranking |

## Relaciones y cascadas

- `User` → `Venue`: 1:N, cascade delete (borrar user borra todos sus venues)
- `User` → `RefreshToken`: 1:N, cascade delete
- `Venue` → `QueuedSong`: 1:N, cascade delete (borrar venue borra toda la cola)
- `Venue` → `VenueTrack`: 1:N, cascade delete
- `QueuedSong` → `Vote`: 1:N, cascade delete (borrar cancion borra sus votos)

## Migraciones

En desarrollo:
```bash
cd packages/database
DATABASE_URL="..." pnpm exec prisma db push
```

En produccion (Railway):
```bash
pnpm exec prisma db push --skip-generate
```

Para migraciones formales:
```bash
pnpm exec prisma migrate dev --name descripcion
pnpm exec prisma migrate deploy  # produccion
```
