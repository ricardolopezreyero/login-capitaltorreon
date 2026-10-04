<!-- RLR · Ricardo López Reyero -->
# Login de CapitalTorreon

**Ver en vivo: https://login.capitaltorreon.com**

Un solo login con Google para todos los servicios de CapitalTorreon. Google solo conoce **un** origen autorizado (`https://login.capitaltorreon.com`); cada servicio nuevo no necesita tocar Google Cloud nunca.

## Cómo entra un servicio (dos líneas)

En cualquier página, antes de `</body>`:

```html
<div data-login-ct style="position:fixed;top:12px;right:12px;z-index:9999"></div>
<script src="https://login.capitaltorreon.com/login.js" defer></script>
```

El `div` se llena solo y es discreto: sin sesión, solo un botón redondo con la G de Google; con sesión, solo la foto (o la inicial). Al tocar la foto sale el menú de la casa, con «Salir» al final. Puede ir donde quieras (dentro del encabezado, por ejemplo). **Todo funciona sin entrar; entrar solo agrega.**

- Quien ya entró en cualquier otro servicio de la casa **aparece dentro sin pulsar nada**: `login.js` le pregunta a la casa en un marco invisible (`/renovar`) y, si hay sesión, monta la ficha al instante. La sesión se renueva sola cuando le quedan menos de 7 días.
- `LoginCT.quien()` → `{ sub, email, name, picture, exp }` si hay sesión vigente, o `null`.
- `LoginCT.pase()` → el pase firmado, para mandarlo al servidor del servicio.
- `LoginCT.entrar()` / `LoginCT.entrar(true)` (elegir otra cuenta) / `LoginCT.salir()` (sale aquí y de la casa).
- `LoginCT.al(fn)` avisa cuando alguien acaba de entrar; `LoginCT.montar(el)` pinta la ficha en otro elemento.
- **Preferencias con la cuenta:** `data-prefs="clave1,clave2"` en la etiqueta del script declara qué claves de `localStorage` son personalización; se guardan por persona y por servicio (`/api/prefs`), se aplican en cualquier equipo, cambian al cambiar de cuenta y se limpian al salir. `LoginCT.alPrefs(fn)` las aplica en vivo; sin eso, la página se recarga una vez.
- **Superpoderes y Mi cuenta** (`/cuenta`): texto grande, contraste, menos movimiento, silencio y modo noche para toda la casa (clases en `<html>`, `LoginCT.casa()`, `LoginCT.alCasa(fn)`); uso por servicio (`/api/uso`); sugerencias automáticas de una sola vez; ver y borrar todo lo guardado (`/api/cuenta`).
- **Al tocar la foto** sale el menú de la casa: todos los juegos y proyectos (`publico/servicios.json`), en el orden de uso de cada persona (se guarda en `/api/menu`), con bote para quitar y «Salir» al final. Un servicio nuevo se agrega al catálogo una sola vez y aparece en el menú de todos.

Ya está en: capitaltorreon.com, Mina, 2048, Carreteras, Cupido, Video Room y La Vela.

En el Worker del servicio, para no confiar en el navegador, copia [`publico/verificar.js`](publico/verificar.js) y:

```js
import { verificarPase } from "./verificar.js";
const quien = await verificarPase(pase, "mi-servicio.capitaltorreon.com");   // null si no sirve; si no, { sub, email, name, picture }
```

La verificación es local, con la llave pública de `/.well-known/jwks.json` (se trae una vez por hora). También existe `POST /api/verificar` `{ pase }` para quien prefiera preguntar.

## El camino del login

Por qué existe este servicio, qué camino dejamos atrás y las reglas para no tropezar otra vez: [docs/El_Camino_del_Login_v1_2026-10-04_1135.md](docs/El_Camino_del_Login_v1_2026-10-04_1135.md).

## Qué hay

| Archivo | Qué es |
|---|---|
| `src/index.js` | El Worker: `/api/cliente`, `POST /api/entrar` (verifica con Google y firma el pase ES256), `/.well-known/jwks.json`, `POST /api/verificar` |
| `publico/index.html` | La página de entrar (botón oficial de Google) |
| `publico/login.js` | El script para cualquier página |
| `publico/verificar.js` | La verificación para cualquier Worker |
| `publico/jwks.json` | La llave pública |

A dónde se puede volver: solo `*.capitaltorreon.com`, `*.superleads.mx`, `*.ricardolopezreyero.com` y `localhost` (pruebas).

## Secretos y variables

- `LLAVE_PRIVADA` (secreto del Worker): la llave privada ES256, en JWK. Se generó una vez y vive fuera del repo (`~/.llave-login-capitaltorreon.json`). Si se pierde, se genera otra, se publica su pública en `jwks.json` y todas las sesiones viejas caducan.
- `GOOGLE_CLIENT_ID` (variable en `wrangler.jsonc`): el cliente OAuth «CapitalTorreon» de Google Cloud, proyecto `capitaltorreon`, con un solo origen autorizado: `https://login.capitaltorreon.com`.

## Probar y publicar

```bash
cd ~/Desktop/HTML/Login_CapitalTorreon
```

```bash
npx wrangler deploy
```
