# Nextup — Guia de Deploy a Produccion

## Limites de los planes gratuitos

### Vercel (Frontend) — Hobby Plan (gratis)
| Recurso | Limite |
|---------|--------|
| Proyectos | **Ilimitados** |
| Deployments | Ilimitados |
| Bandwidth | 100 GB/mes |
| Build minutes | 6,000 min/mes |
| Builds simultanenos | 1 |
| Funciones serverless | 100 GB-hours/mes |
| Optimizacion de imagenes | 1,000/mes |

Podes tener todos los proyectos que quieras en el plan gratis.

### Railway (Backend) — Trial / Hobby
| Recurso | Trial (gratis) | Hobby ($5/mes) |
|---------|----------------|----------------|
| Credito | $5 una vez | $5 incluidos |
| Proyectos | Limitados | Ilimitados |
| Horas de ejecucion | 500 hrs/mes | Ilimitadas |
| RAM por servicio | 512 MB | 8 GB |
| PostgreSQL | Incluido | Incluido |
| Networking | 100 GB | Ilimitado |

**Importante**: Railway no tiene plan gratis permanente. El trial de $5 dura aproximadamente 1 mes con uso bajo. Despues necesitas el plan Hobby ($5/mes).

### Alternativas gratuitas para el backend
Si Railway se queda corto, estas opciones tienen free tier permanente:

| Plataforma | DB Gratis | Compute Gratis |
|-----------|-----------|----------------|
| **Render** | No | 750 hrs/mes (se duerme tras 15min inactividad) |
| **Fly.io** | No | 3 VMs compartidas |
| **Neon** (solo DB) | 0.5 GB storage | 190 compute hrs/mes |
| **Supabase** (solo DB) | 500 MB, 2 proyectos | N/A |

---

## Paso a paso: Deploy

### 1. Deploy Backend en Railway

1. Ir a [railway.app](https://railway.app) y loguearse con GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Seleccionar `juancruzbupo/nextup`
4. Railway detecta el `railway.toml` automaticamente

**Agregar PostgreSQL:**
5. En el proyecto, click "New" → "Database" → "PostgreSQL"
6. Railway genera `DATABASE_URL` automaticamente

**Configurar variables de entorno:**
7. Click en el servicio del repo → "Variables" → agregar:
```
JWT_SECRET=<generar con: openssl rand -hex 32>
JWT_REFRESH_SECRET=<generar con: openssl rand -hex 32>
SPOTIFY_CLIENT_ID=<tu client id>
SPOTIFY_CLIENT_SECRET=<tu client secret>
SPOTIFY_REDIRECT_URI=<se configura despues, ver paso 8>
FRONTEND_URL=<se configura despues del deploy de Vercel>
SENTRY_DSN=<opcional, de sentry.io>
```

8. Una vez desplegado, Railway asigna una URL tipo:
   `https://nextup-production-xxxx.up.railway.app`
   Copiar esta URL.

### 2. Deploy Frontend en Vercel

1. Ir a [vercel.com](https://vercel.com) y loguearse con GitHub
2. Click "Add New Project" → importar `juancruzbupo/nextup`
3. Vercel detecta el `vercel.json` automaticamente
4. En "Environment Variables" agregar:
```
NEXT_PUBLIC_API_URL=https://nextup-production-xxxx.up.railway.app
NEXT_PUBLIC_SENTRY_DSN=<opcional, de sentry.io>
```
5. Click "Deploy"
6. Una vez desplegado, Vercel asigna una URL tipo:
   `https://nextup-xxxx.vercel.app`

### 3. Configurar URLs cruzadas

Ahora que tenes ambas URLs, hay que conectarlas:

**En Railway (variables del backend):**
- `FRONTEND_URL` = `https://nextup-xxxx.vercel.app`
- `SPOTIFY_REDIRECT_URI` = `https://nextup-production-xxxx.up.railway.app/auth/spotify/callback`

**En Spotify Developer Dashboard:**
- Ir a tu app en [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
- Settings → Redirect URIs → agregar la URL de produccion:
  `https://nextup-production-xxxx.up.railway.app/auth/spotify/callback`

### 4. Configurar Sentry (opcional)

1. Crear cuenta en [sentry.io](https://sentry.io) (gratis: 5K errors/mes)
2. Crear proyecto "nextup-api" (Node.js) → copiar DSN → pegar en Railway como `SENTRY_DSN`
3. Crear proyecto "nextup-web" (Next.js) → copiar DSN → pegar en Vercel como `NEXT_PUBLIC_SENTRY_DSN`

### 5. Verificar

- [ ] Abrir `https://nextup-xxxx.vercel.app` → ver landing de Nextup
- [ ] Registrarse con email y contraseña
- [ ] Crear un venue
- [ ] Conectar Spotify al venue
- [ ] Abrir la URL del venue en el celular
- [ ] Buscar y agregar canciones
- [ ] Verificar que Sentry recibe eventos (si configurado)

---

## CI/CD automatico

Cada push a `main` dispara:
1. **GitHub Actions**: type-check + build (si falla, no se despliega)
2. **Vercel**: rebuild y deploy automatico del frontend
3. **Railway**: rebuild y deploy automatico del backend

No necesitas hacer nada manual despues del setup inicial.

---

## Comandos utiles

```bash
# Generar secrets seguros para produccion
openssl rand -hex 32

# Ver logs de Railway
railway logs

# Ver estado del deploy de Vercel
vercel ls

# Correr migraciones manualmente en Railway
railway run pnpm exec prisma db push --schema=packages/database/prisma/schema.prisma
```

---

## Costos estimados

| Servicio | Plan | Costo |
|----------|------|-------|
| Vercel | Hobby | Gratis |
| Railway | Hobby | $5/mes |
| Sentry | Free | Gratis (5K errors/mes) |
| Spotify API | Free | Gratis |
| Dominio (opcional) | - | ~$12/anio |
| **Total** | | **$5/mes** |
