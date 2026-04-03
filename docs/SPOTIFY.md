# Integracion Spotify — Nextup

## Requisitos

- Cuenta Spotify Premium (para controlar playback via API)
- App creada en developer.spotify.com/dashboard

## Configuracion por venue

Cada venue configura su propia app de Spotify Developer:

1. Ir a https://developer.spotify.com/dashboard
2. Crear app → seleccionar Web API
3. Agregar Redirect URI: `http://127.0.0.1:3001/auth/spotify/callback` (dev) o la URL de produccion
4. En el dashboard de Nextup → Config → pegar Client ID y Client Secret
5. Click "Conectar Spotify" → autorizar permisos

### Scopes requeridos
- `user-modify-playback-state` — play, pause, skip, add to queue
- `user-read-playback-state` — ver dispositivos y estado
- `user-read-currently-playing` — ver cancion actual

## Endpoints de Spotify usados

| Endpoint | Uso en Nextup |
|----------|---------------|
| `GET /v1/search` | Buscar canciones |
| `GET /v1/me/player/currently-playing` | Detectar cancion actual |
| `GET /v1/me/player/devices` | Auto-detectar dispositivos |
| `PUT /v1/me/player` | Transferir playback a dispositivo |
| `PUT /v1/me/player/play` | Forzar reproduccion de cancion |
| `POST /v1/me/player/queue` | Agregar cancion a cola de Spotify |
| `POST /v1/me/player/next` | Saltar cancion |
| `POST /api/token` | Intercambiar/refrescar tokens |

## Manejo de errores

| Error | Causa | Accion de Nextup |
|-------|-------|-----------------|
| 204 | Nada sonando | Retorna null, slow poll |
| 401 | Token expirado | Invalida cache, refresca, reintenta |
| 400 invalid_grant | Refresh token revocado | Limpia tokens, muestra "desconectado" |
| 404 NO_ACTIVE_DEVICE | Spotify cerrado | Auto-detecta dispositivo, toast al admin |
| 429 | Rate limited | Lee Retry-After, espera, reintenta |
| 502 | Error transitorio | Espera 1s, reintenta |

## Flujo del Song Watcher

```
1. Poll Spotify: GET /me/player/currently-playing
2. Si nada suena → slow poll (10s)
3. Si cambio la cancion:
   a. Marca anterior como played
   b. Actualiza ranking (VenueTrack)
   c. Emite WebSocket: queue-updated + now-playing-changed
4. Si quedan <30s de la cancion actual:
   a. Busca la mas votada no reproducida
   b. POST /me/player/queue para encolarla en Spotify
   c. Trackea que ya se encolo (evita duplicados)
5. Adaptative poll:
   - <10s restantes → poll cada 1.5s
   - <20s restantes → poll cada 3s
   - Normal → poll cada 5s
   - Nada sonando → poll cada 10s
```

## Tips para venues

- **Crossfade**: activar en Spotify app (no disponible en web player): Ajustes > Reproduccion > Crossfade (5 segundos recomendado)
- **Gapless playback**: Spotify lo hace automaticamente entre tracks
- **App de escritorio**: usar en vez del web player (mas features, mejor device detection)
- **Volumen**: controlar desde Spotify, no desde Nextup
