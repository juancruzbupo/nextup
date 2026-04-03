# Analisis Legal — Nextup

Ultima actualizacion: Abril 2026

## Spotify y uso comercial

### Resumen: usar Spotify en venues comerciales NO esta permitido

Spotify prohibe explicitamente el uso de su servicio y API para aplicaciones comerciales en venues:

| Politica | Que dice | Fuente |
|----------|----------|--------|
| **ToS Consumer** | "Spotify es solo para uso personal, no comercial" | spotify.com/legal/end-user-agreement |
| **Developer Policy** | "No construir productos para uso en negocios (bares, restaurants, retail)" | developer.spotify.com/policy |
| **Streaming SDA** | Apps que controlan playback (POST /queue, PUT /play) no pueden monetizarse | developer.spotify.com/policy |
| **Dev Mode (Feb 2026)** | Maximo 5 usuarios por Client ID en modo desarrollo | developer.spotify.com/blog/2026-02-06 |

### Precedentes

Apps similares que fueron cerradas o dejaron de funcionar:

| App | Que hacia | Estado |
|-----|-----------|--------|
| Jukestar | Social jukebox con Spotify | Rota, no funciona |
| Festify | Votacion de canciones en fiestas | Abandonada |
| Mubo | Jukebox para venues | Cerrada |
| OutLoud | Cola colaborativa | Cerrada |
| CrowdDJ | Votacion en bares | Cerrada |

Spotify depreco el Mobile Streaming SDK en 2022, eliminando la categoria entera.

### Riesgos

Spotify puede en cualquier momento:
1. Revocar las credenciales de la app
2. Bloquear el acceso a la API
3. Enviar un cease & desist
4. Banear la cuenta del venue

---

## Uso legal de Spotify con Nextup

### Que SI es legal

| Uso | Legal? | Por que |
|-----|--------|---------|
| Previas entre amigos | Si | Uso personal/social |
| Cumpleanos privados | Si | Uso personal |
| Asados / juntadas | Si | Uso personal |
| Eventos privados | Si | No es comercial |
| Testing / desarrollo | Si | Modo desarrollo |

### Que NO es legal

| Uso | Legal? | Por que |
|-----|--------|---------|
| Bar / restaurant abierto al publico | No | Uso comercial |
| Gym con clientes | No | Uso comercial |
| Local con musica de fondo | No | Uso comercial |
| Cobrar por el servicio de Nextup con Spotify | No | Monetizacion de Streaming SDA |

---

## Estrategia legal recomendada

### Fase 1: Validacion (ahora)
- Usar Spotify para probar con amigos, previas, eventos personales
- Esto es uso personal/social — es legal
- Validar product-market fit sin riesgo legal
- No monetizar todavia

### Fase 2: Abstraccion del music provider (antes de monetizar)
- Crear una interfaz `MusicProvider` que desacople la logica de cola/votacion del servicio de musica
- Integrar con proveedores licenciados para uso comercial:

| Proveedor | Catalogo | Licencia comercial | API |
|-----------|----------|-------------------|-----|
| **Soundtrack** (ex Spotify for Business) | 125M+ tracks | Si, incluida | Si |
| **Feed.fm** | Variable | Si, incluida | Si, disenada para apps |
| **Rockbot** | Curado | Si | Limitada |

- Spotify queda como opcion para uso personal (previas, cumples)
- Los venues comerciales usan Soundtrack o Feed.fm

### Fase 3: Comercial
- Venues usan proveedor licenciado → legal
- Personas usan su Spotify personal → legal
- Nextup cobra por la plataforma (votacion, cola, QR, analytics) → legal
- La musica la provee el servicio licenciado, no Nextup

---

## Licencias de musica en Argentina

### Organismos

| Organismo | Que cobra | A quien |
|-----------|-----------|---------|
| **SADAIC** | Derechos de autor (compositores) | Venues que reproducen musica publica |
| **AADI-CAPIF** | Derechos conexos (interpretes, sellos) | Venues que reproducen musica publica |

### Situacion actual
- Los venues deberian pagar SADAIC + AADI-CAPIF para reproducir musica publicamente
- Decreto 765/2024 y Decreto 150/2025 generaron incertidumbre regulatoria sobre las tarifas
- Nextup NO reemplaza esta obligacion — el venue es responsable de tener sus licencias
- Si Nextup usa Soundtrack/Feed.fm, esos servicios incluyen las licencias necesarias

### Como se protege Nextup
- Nextup es una plataforma de votacion y cola, NO un servicio de musica
- La reproduccion la controla el servicio de musica del venue (Spotify personal o proveedor licenciado)
- En los Terms of Service de Nextup, incluir clausula de que el venue es responsable de tener las licencias de musica correspondientes

---

## Implementacion tecnica: MusicProvider

Para desacoplar Nextup del proveedor de musica:

```typescript
interface MusicProvider {
  searchTracks(query: string): Promise<TrackResult[]>;
  getCurrentTrack(): Promise<CurrentTrack | null>;
  addToQueue(trackUri: string): Promise<void>;
  playTrack(trackUri: string): Promise<void>;
  skipTrack(): Promise<void>;
  getDevices(): Promise<Device[]>;
}
```

Implementaciones:
- `SpotifyProvider` — la actual (uso personal)
- `SoundtrackProvider` — para venues comerciales (futuro)
- `FeedFmProvider` — alternativa (futuro)

El QueueService, SongWatcher, y toda la logica de votacion NO cambian. Solo cambia el provider de musica.

---

## Resumen

| Aspecto | Estado | Accion |
|---------|--------|--------|
| Uso personal (previas, cumples) | Legal | Usar Spotify normalmente |
| Uso comercial (bares, gym) | NO legal con Spotify | Integrar proveedor licenciado |
| Monetizacion | NO legal con Spotify API | Cobrar por plataforma, no por musica |
| Licencias Argentina | Responsabilidad del venue | Clausula en ToS de Nextup |
| Music provider abstraction | Pendiente | Backlog P1 |
