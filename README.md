<!-- RLR · Ricardo López Reyero -->
# Login de CapitalTorreon

**Ver en vivo: https://login.capitaltorreon.com**

Un solo login con Google para todos los servicios de CapitalTorreon. Google solo conoce **un** origen autorizado (`https://login.capitaltorreon.com`); cada servicio nuevo no necesita tocar Google Cloud nunca.

## Cómo entra un servicio (dos líneas)

En cualquier página:

```html
<script src="https://login.capitaltorreon.com/login.js"></script>
<button onclick="LoginCT.entrar()">Entrar</button>
```

- `LoginCT.entrar()` manda a `login.capitaltorreon.com/?volver=<esta página>`; la persona entra con Google y vuelve a la misma página con `#sesion=<pase>` (el script lo guarda solo y limpia la liga).
- `LoginCT.quien()` → `{ sub, email, name, picture, exp }` si hay sesión vigente (30 días), o `null`.
- `LoginCT.pase()` → el pase firmado, para mandarlo al servidor del servicio.
- `LoginCT.salir()` → cierra la sesión en ese navegador.

En el Worker del servicio, para no confiar en el navegador, copia [`publico/verificar.js`](publico/verificar.js) y:

```js
import { verificarPase } from "./verificar.js";
const quien = await verificarPase(pase, "mi-servicio.capitaltorreon.com");   // null si no sirve; si no, { sub, email, name, picture }
```

La verificación es local, con la llave pública de `/.well-known/jwks.json` (se trae una vez por hora). También existe `POST /api/verificar` `{ pase }` para quien prefiera preguntar.

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
