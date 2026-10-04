<!-- RLR · Ricardo López Reyero -->
# El camino del login en CapitalTorreon

**Ver en vivo: https://login.capitaltorreon.com**

El login siempre fue lo complicado. Cada proyecto lo resolvía a su manera, cada cliente de Google pedía su lista de orígenes, y cada servicio nuevo volvía a tropezar con lo mismo. Este documento deja por escrito los dos caminos —el imperfecto, que ya no se usa, y el cómodo, que es el único de hoy— para que no se vuelva a improvisar.

---

## 1. El camino imperfecto (lo que ya no hacemos)

Así se hizo durante años, y así se seguía haciendo hasta el 4 de octubre de 2026:

1. **Un cliente de Google por proyecto** (o uno prestado de otro proyecto). Cada servicio nuevo obligaba a entrar a Google Cloud, crear o editar un cliente OAuth y agregar su dominio a «Orígenes autorizados de JavaScript». Con cientos de microservicios, eso es cientos de visitas a Google Cloud, y con que falte un origen el botón falla con un 403 que nadie entiende.
2. **El botón de Google dentro de cada página.** Cada proyecto cargaba la librería de Google, dibujaba su botón y decodificaba su token. Mismo código copiado y pegado, con pequeñas diferencias que luego se vuelven errores distintos.
3. **Cada servidor verificaba contra Google por su cuenta** (`tokeninfo`) y guardaba su propia idea de quién es la persona. Nada hablaba con nada: entrar en un servicio no servía en el de al lado.
4. **Secretos regados.** `GOOGLE_CLIENT_SECRET` por proyecto, confusiones entre el ID y el secreto, `invalid_client`, redirect URIs que no coincidían por una diagonal al final.
5. **Otros atajos:** enlaces mágicos al correo (La Vela, Cupido, el panel de CapitalTorreon), PINes, claves en la liga. Cada uno razonable solo, insoportable en conjunto.

Qué salía mal, siempre: *«no me sale el botón»*, *«me deja afuera»*, *«en este sitio sí entro y en este no»*, *«¿cuál era el cliente de este proyecto?»*.

Lo que sí rescatamos de ahí: la verificación del token de Google en el servidor (nunca confiar en lo que diga el navegador) y la idea de que entrar nunca es obligatorio.

---

## 2. El camino cómodo (el único de hoy)

Una sola puerta para toda la casa: **login.capitaltorreon.com**.

- **Google solo conoce un origen:** `https://login.capitaltorreon.com`. Un solo cliente OAuth («Login CapitalTorreon», proyecto `capitaltorreon`), una sola pantalla de consentimiento, publicada. Ningún servicio nuevo vuelve a tocar Google Cloud.
- **Cada servicio manda y recibe.** La página manda a `login.capitaltorreon.com/?volver=<su liga>`. La persona entra con Google ahí. El login verifica con Google, **firma un pase** (JWT ES256, 30 días, amarrado al dominio del servicio) y regresa a `<su liga>#sesion=<pase>`. El pase viaja después del `#`: nunca llega a ningún servidor por la dirección.
- **Entras una vez y ya estás dentro en todos, sin pulsar nada.** El login guarda su propia sesión (una cookie segura, solo en su dominio). Al abrir cualquier otro servicio de la casa, `login.js` le pregunta a la casa en un marco invisible y, si ya entraste, apareces dentro con tu nombre y tu foto antes de tocar nada. Lo mismo renueva la sesión cuando le quedan menos de 7 días: nadie se queda afuera a los 30 días a media partida. «Salir» sale del servicio y de la casa. Probado el 4 de octubre: entrar en La Vela y abrir 2048 por primera vez ya te muestra «Salir».
- **Cada servidor verifica solo**, con la llave pública (`/.well-known/jwks.json`), sin secretos compartidos y sin preguntarle a nadie. Un pase de Mina no sirve en Video Room; el de la casa no sirve fuera del login; uno alterado o vencido no sirve en ningún lado.
- **Todo funciona sin entrar; entrar solo agrega.** Esa es nuestra forma de operar: nadie se topa con una puerta antes de usar el servicio. Entrar sirve para guardar, recuperar, ser reconocido.

- **La foto es la puerta a todo el ecosistema.** Al tocarla salen todos los juegos y proyectos de la casa, con lo que esa persona usó más recientemente arriba, un bote para quitar lo que no le interese (y «restaurar» si se arrepiente), y «Salir» hasta abajo. El orden es de cada quien y viaja con su cuenta a todos los servicios (`/api/menu`, guardado por su identificador de Google). Así cada servicio le hace publicidad a los demás, y nadie vuelve a buscar una liga. El catálogo vive en `publico/servicios.json` del login: un servicio nuevo se agrega ahí, una sola vez, y aparece en el menú de todos.

- **Las preferencias viajan con la cuenta.** Cada servicio declara qué claves de `localStorage` son personalización (`data-prefs="clave1,clave2"` en la etiqueta del script). Desde ahí, todo lo que la persona cambie (el fondo del home, el sonido de un juego, el tamaño del texto, el acercamiento…) se guarda en su cuenta, por servicio, con la hora del cambio; al entrar en otro equipo se aplica lo suyo; **al cambiar de cuenta de Google cambian todas las preferencias** (correo de negocio y correo personal, cada uno con lo suyo); al salir, el equipo vuelve a los valores de fábrica. Gana siempre el cambio más reciente. Un servicio puede aplicar los cambios en vivo con `LoginCT.alPrefs(fn)`; si no, la página se recarga una vez para que se vean. `POST /api/prefs`.

- **Superpoderes de la persona.** En `login.capitaltorreon.com/cuenta` (desde el menú de la foto: «Mi cuenta y superpoderes») cada quien prende ajustes que aplican en **toda** la casa: texto más grande, alto contraste, menos movimiento, silencio y modo noche. Viajan con la cuenta (apartado «casa» de las preferencias) y `login.js` los pone como clases en `<html>` (`.ct-texto-grande .ct-contraste .ct-quieto .ct-silencio .ct-noche`, y la variable `--ct-texto`); «menos movimiento» apaga animaciones en cualquier página sin tocarla; cada app los traduce a lo suyo con `LoginCT.casa()` / `LoginCT.alCasa(fn)` (Mina ya lo hace). La misma página enseña **todo lo que la casa sabe de la persona** (correo, nombre, foto, superpoderes, preferencias por servicio, uso y menú), en crudo si quiere, y lo borra todo de una vez.
- **El uso se mide para servir, no para vender.** Con cuenta, `login.js` cuenta el tiempo real de uso por servicio (pestaña a la vista y actividad en los últimos 2 minutos), visitas, hora del día y si fue en teléfono o computadora (`POST /api/uso`). Sin cuenta no se guarda nada.
- **La casa sugiere, una vez y con permiso.** Con lo que la persona hace de verdad: la app que sigue (lo que no ha abierto, cuando ya lleva 10 min en la casa; el menú marca «NUEVO»), el modo noche (si la mitad del uso es entre las 21 y las 6) y el texto grande (en el teléfono, con tres visitas). Cada sugerencia sale una sola vez, discreta, abajo, con «Sí» y «Ahora no»; nunca se repite.

### Cómo se pone en un servicio (dos líneas, antes de `</body>`)

```html
<div data-login-ct style="position:fixed;top:12px;right:12px;z-index:9999"></div>
<script src="https://login.capitaltorreon.com/login.js" data-prefs="mi_clave_de_ajustes" defer></script>
```

`data-prefs` es opcional: son las claves de `localStorage` que guardan la personalización de ese servicio y que deben viajar con la cuenta.

El `div` se llena solo y es discreto (regla de Ricardo: es prácticamente el único botón arriba a la derecha): sin sesión, solo un botón redondo con la G de Google; con sesión, solo la foto o la inicial. Al tocarla sale el menú de la casa. Puede ir donde se quiera (dentro del encabezado, por ejemplo).

Desde la página: `LoginCT.quien()` → `{ sub, email, name, picture, exp }` o `null` · `LoginCT.pase()` → el pase para el servidor · `LoginCT.entrar()` / `LoginCT.entrar(true)` (elegir cuenta) / `LoginCT.salir()` · `LoginCT.al(fn)` avisa cuando alguien acaba de entrar.

En el Worker, para no confiar en el navegador: copiar [`publico/verificar.js`](../publico/verificar.js) y

```js
import { verificarPase } from "./verificar.js";
const quien = await verificarPase(pase, "mi-servicio.capitaltorreon.com");   // null si no sirve
```

La persona se identifica por `sub` (el identificador fijo de Google), no por el correo: el correo puede cambiar, el `sub` no.

### Dónde ya está

capitaltorreon.com, Mina, 2048, Carreteras de México, Cupido Algorítmico, Video Room, La Vela. **El ping pong no**: tiene su login propio, funciona y no se toca.

---

## 3. Reglas para no volver a tropezar

1. **Nunca más un cliente de Google por proyecto.** Si alguien propone «agrego el origen en Google Cloud», la respuesta es: no, se usa `login.js`.
2. **Nunca el botón de Google dentro de un servicio.** El botón vive en login.capitaltorreon.com; el servicio solo pinta el widget.
3. **Nunca confiar en el navegador.** Lo que se guarde por persona se guarda contra un pase verificado con `verificar.js`.
4. **Nunca el pase en la dirección antes del `#`** ni en registros del servidor. Después del `#` y en `localStorage` del servicio, nada más.
5. **Entrar nunca es obligatorio.** Si un servicio no sirve sin entrar, está mal planteado.
6. **Solo se vuelve a dominios de la casa** (`*.capitaltorreon.com`, `*.superleads.mx`, `*.ricardolopezreyero.com`, `localhost` para pruebas). Un dominio nuevo de la casa se agrega en `CASA`, en `src/index.js` del login, una sola vez.
7. **Si se pierde la llave privada** (`LLAVE_PRIVADA` del Worker; copia en `~/.llave-login-capitaltorreon.json`), se genera otra, se publica su pública en `jwks.json` y todas las sesiones caducan: nadie pierde nada más que volver a entrar.
8. **El reconocimiento en silencio solo habla con la casa.** El marco invisible solo acepta mensajes del origen `login.capitaltorreon.com`, y la casa solo manda el pase al origen exacto del servicio que preguntó (y solo si es de la casa). La página de entrar no se deja meter en marcos de nadie (`frame-ancestors 'none'`).
9. **Antes de decir «el login no funciona»**, revisar en este orden: ¿la página carga `login.js`? ¿el dominio está en `CASA`? ¿el servidor verifica con la llave pública vigente? ¿el pase no venció (30 días)? En las apps instaladas (copia sin internet), el botón aparece al segundo arranque.

---

## 4. Piezas y dónde viven

| Pieza | Dónde |
|---|---|
| El servicio de login (Worker, página, `login.js`, `verificar.js`, llave pública) | repo `ricardolopezreyero/login-capitaltorreon`, local `~/Desktop/HTML/Login_CapitalTorreon` |
| Cliente OAuth y pantalla de consentimiento | Google Cloud, proyecto `capitaltorreon`, cliente «Login CapitalTorreon» (`619985558596-…`) |
| Llave privada de firma | secreto `LLAVE_PRIVADA` del Worker; copia fuera del repo |
| Privacidad y términos (los pide Google) | `login.capitaltorreon.com/privacidad` y `/terminos` |

— Ing. Ricardo López Reyero · CapitalTorreon · 4 de octubre de 2026
