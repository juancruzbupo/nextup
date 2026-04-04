# Nextup — Resumen de Deploy en Produccion

## Stack final (100% gratuito)

| Pieza | Servicio | URL |
|---|---|---|
| **Web** (Next.js) | Vercel | `https://nextup-web-three.vercel.app` |
| **API** (NestJS) | Render | `https://nextup-e42r.onrender.com` |
| **Base de datos** | Neon (PostgreSQL) | `ep-proud-resonance-aja2ac28-pooler` |
| **Keep-alive** | UptimeRobot | Ping cada 5 min a `/health` |
| **Audio** | Spotify Web API | OAuth por venue |

---

## Pasos que funcionaron

### 1. Preparacion del codigo

- Agregado endpoint `GET /health` en NestJS para UptimeRobot
- CORS configurado con `FRONTEND_URL` como variable de entorno
- WebSocket Gateway con CORS para produccion
- Socket.io-client en el frontend conectando a `NEXT_PUBLIC_API_URL`
- Creado `render.yaml` en la raiz con build/start commands
- Creado `apps/web/vercel.json` con comandos para monorepo
- Eliminado `dist` del `.gitignore` — clave para que Render preservara el build
- Agregado `buildArtifactPaths: apps/api/dist` en render.yaml
- Corregido flujo OAuth Spotify: credenciales solo en env vars, no por venue
- Cross-domain cookies: `sameSite: 'none'` + `secure: true` en produccion
- Auth protection client-side (middleware deshabilitado por cross-domain)

### 2. Neon (Base de datos)

1. Crear cuenta en neon.tech
2. New Project → nombre `nextup`
3. Region: AWS US East 2 (Ohio) — misma region que Render
4. Connection string → tab `.env` → Connection pooling activado → Show password
5. Copiar `DATABASE_URL` con `-pooler` en el hostname

### 3. Render (API NestJS)

**Build Command final:**
```
npm install -g pnpm turbo && NODE_ENV=development pnpm install --frozen-lockfile && pnpm --filter @nextup/database exec prisma generate && pnpm --filter @nextup/database exec prisma db push && pnpm --filter @nextup/api build
```

**Start Command final:**
```
node apps/api/dist/main.js
```

**Variables de entorno:**
```
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-...-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
SPOTIFY_REDIRECT_URI=https://nextup-e42r.onrender.com/auth/spotify/callback
FRONTEND_URL=https://nextup-web-three.vercel.app
JWT_SECRET=[generado]
JWT_REFRESH_SECRET=[generado]
NODE_ENV=production
PORT=10000
```

**Problemas encontrados y soluciones:**
- `prisma: not found` → usar `NODE_ENV=development` durante el install para incluir devDependencies
- `turbo: not found` → agregar `npm install -g pnpm turbo` al inicio del build command
- `Cannot find module dist/main` → eliminar `dist` del `.gitignore` y agregar `buildArtifactPaths`
- `Can't reach database` → usar `db push` en lugar de `migrate deploy` (no habia archivos de migracion)
- Cross-domain cookies no se seteaban → `sameSite: 'none'` + `secure: true`
- Middleware de Next.js no veia cookies del API → proteccion client-side con useAuth

### 4. Spotify Developer App

1. Ir a developer.spotify.com/dashboard
2. Create App → nombre `Nextup`
3. Redirect URIs:
   - `https://nextup-e42r.onrender.com/auth/spotify/callback` (produccion)
   - `http://127.0.0.1:3001/auth/spotify/callback` (desarrollo local)
4. Copiar Client ID y Client Secret → pegarlos en Render como env vars

### 5. Vercel (Frontend Next.js)

**Configuracion del proyecto:**
- Root Directory: `apps/web`
- Framework: Next.js (autodetectado)

**`apps/web/vercel.json`:**
```json
{
  "installCommand": "cd ../.. && pnpm install",
  "buildCommand": "cd ../.. && pnpm --filter @nextup/web build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

**Variable de entorno:**
```
NEXT_PUBLIC_API_URL=https://nextup-e42r.onrender.com
```

**Problema encontrado:** Vercel no encontraba Next.js porque corria `pnpm install` solo desde `apps/web`. Solucion: `cd ../..` para instalar desde la raiz del monorepo.

### 6. UptimeRobot (Keep-alive)

1. Crear cuenta en uptimerobot.com
2. New Monitor → HTTP
3. URL: `https://nextup-e42r.onrender.com/health`
4. Interval: 5 minutos

Evita que Render duerma el servicio (ocurre tras 15 min de inactividad en free tier).

---

## Flujo OAuth Spotify

```
SPOTIFY_CLIENT_ID + SECRET en env vars de Render (de la plataforma)
        |
Dueno del venue hace click en "Conectar Spotify"
        |
Render redirige a accounts.spotify.com/authorize
        |
Venue autoriza con SU cuenta Spotify Premium
        |
Render recibe callback -> guarda access_token + refresh_token en Neon por venue
        |
Cada venue controla su propio Spotify independientemente
```

---

## Comandos utiles post-deploy

```bash
# Verificar API
curl https://nextup-e42r.onrender.com/health

# Forzar redeploy en Render
# Manual Deploy → Deploy latest commit

# Ver logs en vivo
# Render → Logs → Live tail

# Generar JWT secrets seguros
openssl rand -hex 32
```
