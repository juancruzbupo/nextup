# Flujos y Casos de Uso — Nextup

Documento detallado de todos los flujos posibles de la plataforma, organizados por tipo de usuario.

---

## Usuarios de la plataforma

| Rol | Quien es | Como accede |
|-----|----------|-------------|
| **Visitante** | Alguien que llega a nextup.app | Landing page |
| **Admin** | Dueno de un venue o organizador de un evento | Email + password (JWT) |
| **Staff** | Empleado del venue (mozo, encargado) | PIN de 4 digitos |
| **Cliente** | Persona en el venue o invitado al evento | QR o codigo de acceso |

---

## FLUJO 1: Visitante descubre Nextup

### Caso de uso
Una persona escucha sobre Nextup y entra a la web.

### Pasos
1. Entra a `nextup.app`
2. Ve la landing page con:
   - Titulo "Nextup" con tagline
   - 3 features: buscar, votar, conectar musica
   - Mockup del producto mostrando como se ve
   - Disclaimer legal al pie
3. Tiene 3 opciones:
   - **"Registrarse gratis"** → va a `/registro`
   - **"Iniciar sesion"** → va a `/login`
   - **"Tengo un codigo de evento"** → va a `/join`

### Resultado
El visitante entiende que es Nextup y elige su camino.

---

## FLUJO 2: Registro de nuevo usuario

### Caso de uso
Un dueno de bar o organizador de evento quiere usar Nextup.

### Pasos
1. Entra a `/registro`
2. Completa el formulario:
   - Nombre
   - Email
   - Contrasena (min 6 caracteres)
   - Confirmar contrasena
3. Click "Crear cuenta"
4. El sistema:
   - Valida email unico, contrasena valida
   - Hashea password con bcrypt (salt 12)
   - Genera JWT access token (15min) + refresh token (7 dias)
   - Setea cookies httpOnly
5. Redirige al dashboard `/dashboard`

### Errores posibles
- "El email ya esta registrado" → ya existe cuenta
- "La contrasena debe tener al menos 6 caracteres"
- "Las contrasenas no coinciden"

### Resultado
El usuario tiene cuenta y esta en el dashboard, listo para crear un venue o evento.

---

## FLUJO 3: Login de usuario existente

### Caso de uso
Un usuario registrado vuelve a entrar.

### Pasos
1. Entra a `/login`
2. Ingresa email y contrasena
3. Click "Ingresar"
4. Si ya estaba logueado (cookie valida), redirige automaticamente a `/dashboard`
5. Si la cookie expiro, el sistema refresca el token automaticamente

### Errores posibles
- "Email o contrasena incorrectos"

### Resultado
El usuario accede a su dashboard con sus venues y eventos.

---

## FLUJO 4: Crear un venue (lugar permanente)

### Caso de uso
Un dueno de bar, gym, comedor o restaurante quiere que sus clientes elijan la musica.

### Pasos
1. En el dashboard, click "+ Venue"
2. Completa el formulario en `/dashboard/nuevo`:
   - **Nombre**: "Mi Bar", "Gym Power", etc.
   - **Slug**: se genera automaticamente del nombre (editable). Es la URL: `/venue/mi-bar`
   - **PIN de admin** (opcional): 4 digitos para que empleados accedan al panel sin tu cuenta
3. Click "Crear venue"
4. Redirige al panel admin del venue `/dashboard/[slug]`

### Que pasa despues
- El venue aparece en la lista del dashboard
- Muestra "Spotify desconectado" — necesita conectar Spotify
- Los clientes pueden acceder a `/venue/[slug]` pero no podran buscar canciones hasta que Spotify este conectado

### Resultado
El venue existe, tiene una URL unica y un QR que se puede compartir.

---

## FLUJO 5: Conectar Spotify a un venue

### Caso de uso
El admin del venue conecta su cuenta Spotify Premium para que Nextup controle la musica.

### Pasos
1. En el panel del venue → pestaña Config
2. Seccion "Spotify" → click "Conectar Spotify"
3. Redirige a accounts.spotify.com
4. El usuario autoriza con su cuenta Spotify Premium
5. Spotify redirige al callback del backend
6. El backend guarda access_token + refresh_token del venue
7. Redirige al panel del venue con "Spotify conectado" en verde
8. El texto sugiere: "Despues comparti el QR de la pestana Config con tus clientes"

### Requisitos
- Cuenta Spotify Premium (no funciona con Free)
- La app de Spotify tiene que estar abierta en algun dispositivo para que el playback funcione

### Errores posibles
- "redirect_uri: Not matching configuration" → la URL de callback no esta configurada en Spotify Developer Dashboard
- "No active Spotify device" → Spotify no esta abierto en ningun dispositivo

### Resultado
El venue puede buscar canciones, controlar playback, y los clientes pueden agregar/votar.

---

## FLUJO 6: Compartir el venue con clientes

### Caso de uso
El admin quiere que sus clientes escaneen un QR para elegir musica.

### Pasos
1. En el panel del venue → pestaña Config
2. Click "Mostrar QR"
3. Aparece un QR code que apunta a `/venue/[slug]`
4. El admin puede:
   - Imprimir el QR y ponerlo en las mesas
   - Compartir la URL directamente
   - Sacar un screenshot

### Resultado
Los clientes escanean el QR desde el celular y entran a la pagina del venue.

---

## FLUJO 7: Cliente en un venue — buscar y agregar canciones

### Caso de uso
Un cliente en un bar escanea el QR y quiere pedir una cancion.

### Pasos
1. Escanea QR con la camara del celular
2. Abre `/venue/[slug]` en el browser (sin instalar app)
3. Ve:
   - Nombre del venue + badge "EN VIVO"
   - "Sonando ahora" con la cancion actual (si hay algo reproduciendose)
   - Buscador "Buscar cancion o artista..."
   - Cola de canciones (si hay)
   - "Top pedidas" con el ranking del venue
4. Busca una cancion en el buscador
5. Aparecen hasta 8 resultados de Spotify con album art
6. Toca el boton "+" para agregar a la cola
7. El boton cambia a check verde confirmando
8. La cancion aparece en la cola con 1 voto

### Si la cancion ya esta en la cola
- Aparece el mensaje "alreadyExists"
- No se duplica

### Si no hay nada sonando
- Muestra "Sin reproducir — Esperando que suene algo..."

### Si la cola esta vacia
- Muestra "La cola esta vacia — Busca una cancion y se el primero en agregar algo"

### Resultado
La cancion esta en la cola, visible para todos los clientes en tiempo real.

---

## FLUJO 8: Cliente en un venue — votar canciones

### Caso de uso
Un cliente ve una cancion en la cola que le gusta y quiere votarla para que suene antes.

### Pasos
1. Ve la cola con canciones ordenadas por votos
2. Toca el boton de voto (flecha arriba + contador)
3. Siente vibracion haptica (en Android)
4. El voto se refleja inmediatamente (optimistic update)
5. El boton cambia de color (verde = ya votaste)
6. El boton se deshabilita (no se puede votar dos veces la misma cancion)
7. La cola se reordena si el voto cambio la posicion

### Protecciones anti-fraude
- 1 voto por cancion por sesion (cookie httpOnly tamper-proof)
- Debounce de 500ms (no se puede spamear)
- Votos persistidos por venue en localStorage
- Atomic transaction en el backend (race condition safe)
- Validacion songId-venueId en el gateway

### Resultado
La cancion sube en la cola. La mas votada tiene el badge "Proxima" y suena despues.

---

## FLUJO 9: Sistema reproduce la siguiente cancion

### Caso de uso
La cancion actual termina y Nextup pone la siguiente mas votada.

### Pasos (automatico, sin intervencion humana)
1. El Song Watcher hace polling adaptativo a Spotify (1.5-10s segun contexto)
2. Detecta que la cancion actual esta por terminar (ultimos 30 segundos)
3. Busca la cancion mas votada en la cola (que no se haya reproducido)
4. La encola en Spotify via API (POST /me/player/queue)
5. Cuando la cancion anterior termina, Spotify reproduce la encolada
6. El watcher detecta el cambio de cancion
7. Marca la cancion como played (desaparece de la cola)
8. Actualiza el ranking (VenueTrack totalRequests +1)
9. Emite WebSocket: queue-updated + now-playing-changed
10. Todos los clientes ven la actualizacion en tiempo real

### Si no hay canciones en cola
- Spotify sigue con su playlist/album normal
- No se encola nada

### Si el Spotify del venue se desconecta
- El watcher detecta 401/invalid_grant
- Limpia tokens del venue
- El admin ve "Spotify desconectado" y puede reconectar

### Resultado
La musica fluye automaticamente, la cancion mas votada siempre suena despues.

---

## FLUJO 10: Admin gestiona el venue en tiempo real

### Caso de uso
El admin o staff del venue quiere controlar la musica.

### Pasos
1. Accede a `/dashboard/[slug]` (admin con JWT) o `/admin/[slug]` (staff con PIN)
2. Ve el panel con:
   - "Sonando ahora" con barra de progreso
   - Tabs: Cola, Historial, Stats, Config

### Acciones disponibles

**Saltar cancion:**
- Click en el boton skip en "Sonando ahora"
- Spotify salta a la siguiente
- Toast de error si Spotify no esta activo

**Reproducir cancion especifica:**
- Click en el boton play (verde) en una cancion de la cola
- Fuerza la reproduccion inmediata en Spotify
- Auto-detecta dispositivo si no hay uno activo

**Eliminar cancion de la cola:**
- Click en el boton X en una cancion
- La cancion desaparece de la cola para todos

**Ver historial:**
- Tab "Historial" muestra las ultimas 20 canciones reproducidas
- Con album art, titulo, artista y votos

**Ver estadisticas:**
- Tab "Stats" muestra:
  - Canciones reproducidas hoy (animated counter)
  - Votos totales hoy
  - Cancion mas votada del dia

**Configurar venue:**
- Tab "Config":
  - Seccion Spotify: conectar/desconectar
  - Tip DJ: activar crossfade
  - Nombre del venue
  - PIN de admin
  - Imagen de fondo (URL)
  - QR para clientes

### Resultado
El admin tiene control total sobre la musica sin tocar Spotify directamente.

---

## FLUJO 11: Crear un evento temporal

### Caso de uso
Alguien organiza un cumpleanos, casamiento, previa o evento corporativo y quiere que los invitados elijan la musica.

### Pasos
1. En el dashboard, click "+ Evento"
2. Completa el formulario en `/dashboard/nuevo-evento`:
   - **Nombre**: "Cumple de Sofi", "Casamiento J&M"
   - **Inicio**: fecha y hora de inicio
   - **Fin**: fecha y hora de finalizacion
   - **Max canciones por persona**: default 3
   - **PIN de admin** (opcional)
3. Click "Crear evento"
4. Redirige a `/dashboard/eventos/[eventId]`
5. Ve el codigo de acceso de 6 digitos en grande
6. Boton "Copiar codigo" para compartir facil
7. QR toggle para generar QR del evento

### Diferencias con un venue
- Tiene fecha de inicio y fin (se desactiva automaticamente)
- Acceso por codigo de 6 digitos (no por slug)
- Max canciones por persona configurable
- No tiene "Top pedidas" (los eventos son temporales)

### Resultado
El evento esta creado con un codigo unico listo para compartir.

---

## FLUJO 12: Invitado entra a un evento

### Caso de uso
Un invitado recibe un codigo de 6 digitos para unirse al evento.

### Pasos
1. Entra a `nextup.app` → click "Tengo un codigo de evento"
2. Va a `/join`
3. Ingresa el codigo de 6 digitos (teclado grande, auto-mayusculas)
4. Click "Entrar al evento"
5. El sistema valida:
   - Que el codigo exista
   - Que el evento este activo
   - Que no haya expirado
6. Redirige a `/event/[accessCode]`
7. Ve la interfaz del evento (similar a venue pero para eventos)

### Si el codigo es invalido
- "Codigo no encontrado o evento finalizado"

### Si el evento no tiene Spotify conectado
- La busqueda muestra: "El organizador todavia no conecto la musica. La busqueda estara disponible pronto."

### Si el evento ya termino
- Pagina: "Evento finalizado — Este evento ha terminado. Gracias por participar!"

### Resultado
El invitado esta en el evento y puede buscar, agregar y votar canciones.

---

## FLUJO 13: Organizador gestiona el evento

### Caso de uso
El organizador quiere controlar la musica durante el evento.

### Pasos
1. Accede a `/dashboard/eventos/[eventId]`
2. Ve:
   - Nombre del evento
   - Fecha y hora del evento
   - Estado de Spotify
   - Codigo de acceso grande + boton "Copiar codigo"
   - QR para compartir
   - Cola de canciones
   - "Sonando ahora"

### Acciones
- **Conectar Spotify** al evento (misma cuenta Premium)
- **Saltar cancion** (requiere PIN si se configuro)
- **Eliminar cancion** de la cola (requiere PIN)
- **Copiar codigo** con un tap

### Resultado
El organizador controla la musica del evento desde el celular.

---

## FLUJO 14: Evento expira automaticamente

### Caso de uso
El evento llega a su hora de finalizacion.

### Pasos (automatico)
1. El Song Watcher detecta que `endsAt < now`
2. Marca el evento como `active: false`
3. Emite WebSocket `event-ended` a todos los conectados
4. Los clientes ven: "Este evento ha finalizado"
5. El evento desaparece de la lista de eventos activos
6. Los datos persisten para el organizador (historial)

### Resultado
El evento se cierra sin que nadie tenga que hacer nada.

---

## FLUJO 15: Staff accede con PIN

### Caso de uso
Un mozo o encargado necesita saltar una cancion pero no tiene la cuenta del admin.

### Pasos
1. Entra a `/admin/[slug]`
2. Ingresa el PIN de 4 digitos
3. Accede al panel simplificado
4. Puede: saltar, eliminar, ver cola y now playing

### Proteccion
- PIN comparado con crypto.timingSafeEqual (anti timing attack)
- PIN almacenado en sesionStorage por tab
- Rate limiting global (5 req/s)

### Resultado
El staff controla la musica sin conocer las credenciales del admin.

---

## FLUJO 16: Top Pedidas — ranking historico

### Caso de uso
Un venue quiere que los clientes vean las canciones mas populares de ese lugar.

### Como funciona
1. Cada vez que alguien agrega una cancion a la cola → totalRequests +1
2. Cada vez que alguien vota una cancion → totalRequests +1
3. La seccion "Top pedidas" en `/venue/[slug]` muestra las 10 mas populares
4. Los clientes pueden agregar canciones del top a la cola con un tap
5. Si la cancion ya esta en la cola, el boton se deshabilita

### Datos que muestra
- Posicion (#1 en dorado, #2, #3...)
- Album art, titulo, artista
- Cantidad de veces pedida ("42 pedidas")

### Resultado
El venue tiene su propia "playlist popular" que se construye sola con el uso.

---

## FLUJO 17: Desconectar Spotify

### Caso de uso
El admin quiere desvincular su cuenta Spotify del venue o evento.

### Pasos
1. Panel admin → Config → Spotify
2. Click "Desconectar Spotify"
3. El backend limpia access_token, refresh_token, tokenExpiresAt
4. El estado cambia a "Spotify desconectado"
5. Los clientes ya no pueden buscar canciones
6. El Song Watcher deja de monitorear ese venue/evento

### Resultado
Spotify desvinculado. Puede reconectar en cualquier momento.

---

## FLUJO 18: Imagen de fondo personalizada

### Caso de uso
El admin quiere que la pagina del venue tenga el branding de su lugar.

### Pasos
1. Panel admin → Config → "Imagen de fondo (URL)"
2. Pega la URL de una imagen (recomendado: 1080x1920px, JPG, <300KB)
3. Click "Guardar cambios"
4. La imagen aparece como fondo en `/venue/[slug]` con overlay oscuro
5. Preview de la imagen actual aparece debajo del campo

### Resultado
El venue tiene su propia identidad visual. El overlay garantiza legibilidad.

---

## FLUJO 19: Color dinamico del album art

### Caso de uso
Los clientes ven la pagina del venue y el fondo cambia de color segun la cancion que suena.

### Como funciona (automatico)
1. NowPlaying recibe la cancion actual via WebSocket
2. Hook useAlbumColor extrae el color dominante del album art (canvas 16x16)
3. Aplica un radial-gradient ambiental con ese color
4. Transicion suave de 1.5s al cambiar de cancion
5. Si no hay cancion, usa verde Nextup por defecto

### Resultado
Experiencia visual inmersiva que cambia con cada cancion.

---

## FLUJO 20: Recuperacion de errores

### Caso de uso
Algo falla y el sistema se recupera sin intervencion.

### Escenarios y recuperacion

| Error | Recuperacion automatica |
|-------|------------------------|
| WebSocket se desconecta | Auto-reconnect con backoff (1s → 10s max) |
| Token de Spotify expira | Refresh automatico 2min antes de expiracion |
| Refresh token revocado | Limpia tokens, muestra "desconectado" |
| API rate limited (429) | Espera Retry-After, reintenta |
| Spotify 502 transitorio | Reintenta despues de 1s |
| No active Spotify device | Auto-detecta dispositivo disponible |
| Dashboard no carga venues | Reintenta fetch despues de 1s |
| Voto falla por red | Vote-error trigger re-sync de cola |

### Resultado
El sistema se recupera solo en la mayoria de los casos. El usuario rara vez necesita refrescar.

---

## FLUJO 21: Wizard de onboarding (nuevo usuario)

### Caso de uso
Un usuario se registra y no sabe si crear un venue o un evento.

### Pasos
1. Se registra en `/registro`
2. Redirige automaticamente a `/dashboard/empezar`
3. Ve 3 opciones claras:
   - "Tengo un bar, local o gym" → crea venue
   - "Organizo un evento" → crea evento
   - "Tengo un codigo de evento" → va a /join
4. Cada opcion tiene icono, titulo y descripcion del caso de uso
5. Si el usuario ya tiene venues o eventos, el dashboard normal se muestra directo

### Resultado
El usuario nuevo entiende inmediatamente que hacer sin confusion.

---

## FLUJO 22: Coachmark — guia interactiva

### Caso de uso
Un usuario (cliente o admin) entra por primera vez y necesita saber como usar la interfaz.

### Como funciona
1. Al entrar a una pagina por primera vez, aparece un tooltip con overlay oscuro
2. El tooltip apunta al elemento relevante con una flecha
3. Muestra un texto corto explicativo + contador de pasos
4. Boton "Siguiente" avanza al proximo paso
5. Boton "Entendido" cierra el tour en el ultimo paso
6. Se puede cerrar con X en cualquier momento
7. Se guarda en localStorage — no vuelve a aparecer

### Tours disponibles

**Dashboard (2 pasos):**
1. "Crea un venue o evento desde aca"
2. "Toca un venue para administrarlo y compartir el QR"

**Cliente en venue (3 pasos):**
1. "Busca una cancion y toca + para agregarla a la cola"
2. "Vota las canciones que te gustan. La mas votada suena despues."
3. "Aca estan las mas pedidas del lugar. Podes agregarlas directo."

**Cliente en evento (2 pasos):**
1. "Busca una cancion y toca + para agregarla"
2. "Vota las que te gustan. La mas votada suena despues."

**Admin del venue (2 pasos):**
1. "Aca ves lo que suena ahora. Podes saltar la cancion."
2. "Cola, historial, stats y config. En Config comparti el QR."

### Caracteristicas tecnicas
- Position fixed (sigue al scroll)
- Recalcula posicion en scroll y resize
- Glassmorphism + spring animation
- Respeta prefers-reduced-motion
- Per venue/evento (cada uno tiene su propio tour)

### Resultado
Cualquier persona, sin importar su edad o experiencia tecnologica, entiende como usar la app.
