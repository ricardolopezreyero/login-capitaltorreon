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
- **Entras una vez y ya estás dentro en todos.** El login guarda su propia sesión (una cookie segura, solo en su dominio). Si otro servicio te manda a entrar, el login te reconoce y te regresa al instante, sin volver a pulsar Google. «Salir» sale del servicio y de la casa.
- **Cada servidor verifica solo**, con la llave pública (`/.well-known/jwks.json`), sin secretos compartidos y sin preguntarle a nadie. Un pase de Mina no sirve en Video Room; el de la casa no sirve fuera del login; uno alterado o vencido no sirve en ningún lado.
- **Todo funciona sin entrar; entrar solo agrega.** Esa es nuestra forma de operar: nadie se topa con una puerta antes de usar el servicio. Entrar sirve para guardar, recuperar, ser reconocido.

### Cómo se pone en un servicio (dos líneas, antes de `</body>`)

```html
<div data-login-ct style="position:fixed;top:12px;right:12px;z-index:9999"></div>
<script src="https://login.capitaltorreon.com/login.js" defer></script>
```

El `div` se llena solo: «Entrar con Google» si no hay sesión; la foto, el nombre y «Salir» si ya entró. Puede ir donde se quiera (dentro del encabezado, por ejemplo).

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
8. **Antes de decir «el login no funciona»**, revisar en este orden: ¿la página carga `login.js`? ¿el dominio está en `CASA`? ¿el servidor verifica con la llave pública vigente? ¿el pase no venció (30 días)? En las apps instaladas (copia sin internet), el botón aparece al segundo arranque.

---

## 4. Piezas y dónde viven

| Pieza | Dónde |
|---|---|
| El servicio de login (Worker, página, `login.js`, `verificar.js`, llave pública) | repo `ricardolopezreyero/login-capitaltorreon`, local `~/Desktop/HTML/Login_CapitalTorreon` |
| Cliente OAuth y pantalla de consentimiento | Google Cloud, proyecto `capitaltorreon`, cliente «Login CapitalTorreon» (`619985558596-…`) |
| Llave privada de firma | secreto `LLAVE_PRIVADA` del Worker; copia fuera del repo |
| Privacidad y términos (los pide Google) | `login.capitaltorreon.com/privacidad` y `/terminos` |

— Ing. Ricardo López Reyero · CapitalTorreon · 4 de octubre de 2026
