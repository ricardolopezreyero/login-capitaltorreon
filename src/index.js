// ─────────────────────────────────────────────────────────────────────────────
// Login de CapitalTorreon — Ricardo López Reyero (RLR)
// Un solo lugar donde la gente entra con Google. Google solo autoriza este origen; cada servicio manda a
// login.capitaltorreon.com/?volver=<su liga> y recibe de vuelta <su liga>#sesion=<pase firmado>. El pase lo firma este
// servicio (ES256) y cualquier servicio lo verifica solo con la llave pública (/.well-known/jwks.json), sin pedir nada aquí.
// ─────────────────────────────────────────────────────────────────────────────
const _RLR = "Ricardo López Reyero";
const _k = "EYE", _rev = 181218; // RLR · sello de autoría

const json = (o, status = 200, extra = {}) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...extra } });
const enc = (s) => new TextEncoder().encode(s);
const b64u = (u) => btoa(String.fromCharCode(...(u instanceof Uint8Array ? u : enc(u)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const limpio = (s, n) => String(s ?? "").replace(/[\u0000-\u001f<>"'`\\]/g, "").trim().slice(0, n);
// La sesión de la casa: una cookie HttpOnly en login.capitaltorreon.com con un pase propio (aud "login"). Con ella, quien ya
// entró una vez pasa directo a cualquier servicio sin volver a tocar Google; se borra en /salir.
const COOKIE = "ct_sesion";
const galleta = (v, dias) => `${COOKIE}=${v}; Path=/; Max-Age=${dias * 86400}; Secure; HttpOnly; SameSite=Lax`;
const leerGalleta = (request) => (request.headers.get("cookie") || "").split(/;\s*/).map((c) => c.split("=")).find((c) => c[0] === COOKIE)?.[1] || "";

// A dónde se puede volver: solo a los dominios de la casa (y a la computadora de pruebas).
const CASA = [/^([a-z0-9-]+\.)*capitaltorreon\.com$/i, /^([a-z0-9-]+\.)*superleads\.mx$/i, /^([a-z0-9-]+\.)*ricardolopezreyero\.com$/i];
function volverOk(v) {
  let u; try { u = new URL(v); } catch { return null; }
  const local = ["localhost", "127.0.0.1"].includes(u.hostname);
  if (!(local ? u.protocol === "http:" || u.protocol === "https:" : u.protocol === "https:")) return null;
  if (!local && !CASA.some((r) => r.test(u.hostname))) return null;
  u.hash = ""; return u;
}

// Google dice quién es: se pregunta por el pase que entregó su botón y se revisa que sea para nuestra app, de Google, vigente y con correo confirmado.
async function verificarGoogle(cred, env) {
  if (typeof cred !== "string" || cred.length < 100 || cred.length > 4096) return null;
  let p; try { const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(cred)); if (!r.ok) return null; p = await r.json(); } catch { return null; }
  if (!p || p.aud !== env.GOOGLE_CLIENT_ID || !["accounts.google.com", "https://accounts.google.com"].includes(p.iss)) return null;
  if (String(p.email_verified) !== "true" || !(Number(p.exp) * 1000 > Date.now()) || !/^\d{1,40}$/.test(p.sub || "")) return null;
  const foto = /^https:\/\/[a-z0-9.-]+\.googleusercontent\.com\/[^\s"'<>]*$/.test(p.picture || "") ? String(p.picture).slice(0, 400) : "";
  return { sub: p.sub, email: limpio(p.email, 120), nombre: limpio(p.name, 60), foto };
}

// El pase de la casa: un JWT ES256 con quién es, para qué servicio y hasta cuándo.
async function firmar(claims, env) {
  const jwk = JSON.parse(env.LLAVE_PRIVADA);
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const h = b64u(JSON.stringify({ alg: "ES256", typ: "JWT", kid: jwk.kid })), p = b64u(JSON.stringify(claims));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc(h + "." + p)));
  return h + "." + p + "." + b64u(sig);
}

async function paseDe(g, aud, env) {
  const ahora = Math.floor(Date.now() / 1000), dias = Math.max(1, Math.min(365, Number(env.DIAS) || 30));
  return { pase: await firmar({ iss: env.EMISOR, aud, sub: g.sub, email: g.email, name: g.name ?? g.nombre, picture: g.picture ?? g.foto, iat: ahora, exp: ahora + dias * 86400 }, env), exp: ahora + dias * 86400, dias };
}
const jwksDe = (env, request) => async () => JSON.parse(await (await env.ASSETS.fetch(new Request(new URL("/jwks.json", request.url)))).text());

export default {
  async fetch(request, env) {
    const u = new URL(request.url);
    const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type" };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    // La página de entrar con ?volver=: si ya hay sesión de la casa (y no se pidió elegir cuenta), pasa directo sin pulsar nada.
    if (u.pathname === "/" && request.method === "GET" && u.searchParams.get("volver") && !u.searchParams.has("elegir")) {
      const volver = volverOk(u.searchParams.get("volver")), g = await verificarPase(leerGalleta(request), env.EMISOR, jwksDe(env, request));
      if (volver && g && g.aud === "login") { const { pase, dias } = await paseDe(g, volver.hostname, env); return new Response(null, { status: 302, headers: { location: volver.href + "#sesion=" + pase, "set-cookie": galleta((await paseDe(g, "login", env)).pase, dias), "cache-control": "no-store" } }); }
    }
    // Reconocer en silencio: un servicio mete esta página en un marco oculto; si hay sesión de la casa, se le manda un pase
    // nuevo por postMessage, solo al origen del servicio. Así, quien ya entró en cualquier parte de la casa llega a un servicio
    // nuevo y ya está dentro, y una sesión por vencer se renueva sin que nadie haga nada.
    if (u.pathname === "/renovar" && request.method === "GET") {
      const para = volverOk("https://" + String(u.searchParams.get("para") || "").replace(/[^a-z0-9.:-]/gi, "")) || (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(u.searchParams.get("para") || "") ? new URL("http://" + u.searchParams.get("para")) : null);
      const g = para ? await verificarPase(leerGalleta(request), env.EMISOR, jwksDe(env, request)) : null;
      const cab = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": "frame-ancestors https://*.capitaltorreon.com https://*.superleads.mx https://*.ricardolopezreyero.com http://localhost:* http://127.0.0.1:*" };
      if (!para || !g || g.aud !== "login") return new Response(`<!doctype html><script>parent.postMessage({ ct: "nadie" }, ${JSON.stringify(para ? para.origin : "*")});</script>`, { headers: cab });
      const { pase, dias } = await paseDe(g, para.hostname, env);
      return new Response(`<!doctype html><script>parent.postMessage({ ct: "pase", pase: ${JSON.stringify(pase)} }, ${JSON.stringify(para.origin)});</script>`, { headers: { ...cab, "set-cookie": galleta((await paseDe(g, "login", env)).pase, dias) } });
    }
    // Salir de la casa: se borra la cookie y se vuelve al servicio (que borra la suya).
    if (u.pathname === "/salir") {
      const volver = volverOk(u.searchParams.get("volver") || "");
      return new Response(null, { status: 302, headers: { location: volver ? volver.href + "#salio=1" : "/", "set-cookie": galleta("", 0), "cache-control": "no-store" } });
    }
    // ¿Quién soy? (para la página de entrar, que lo enseña y ofrece «seguir como…»)
    if (u.pathname === "/api/quien" && request.method === "GET") {
      const g = await verificarPase(leerGalleta(request), env.EMISOR, jwksDe(env, request));
      return json(g && g.aud === "login" ? { email: g.email, name: g.name, picture: g.picture } : {}, 200);
    }

    if (u.pathname === "/api/cliente") return json({ id: env.GOOGLE_CLIENT_ID, emisor: env.EMISOR }, 200, cors);

    // La llave pública, para que cada servicio verifique los pases sin preguntar aquí.
    if (u.pathname === "/.well-known/jwks.json" || u.pathname === "/llave") {
      const r = await env.ASSETS.fetch(new Request(new URL("/jwks.json", request.url), request));
      return new Response(r.body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=3600", ...cors } });
    }

    // Entrar: el navegador manda el pase de Google y a dónde quiere volver; sale con el pase de la casa.
    if (u.pathname === "/api/entrar" && request.method === "POST") {
      let d; try { d = await request.json(); } catch { return json({ error: "datos" }, 400, cors); }
      const volver = volverOk(d.volver); if (!volver) return json({ error: "volver" }, 400, cors);
      const g = await verificarGoogle(d.credential, env); if (!g) return json({ error: "google" }, 401, cors);
      const { pase, exp, dias } = await paseDe(g, volver.hostname, env), casa = await paseDe(g, "login", env);
      return json({ pase, volver: volver.href + "#sesion=" + pase, exp }, 200, { ...cors, "set-cookie": galleta(casa.pase, dias) });
    }

    // Verificar un pase desde un servidor (quien no quiera verificar con la llave pública).
    if (u.pathname === "/api/verificar" && request.method === "POST") {
      let d; try { d = await request.json(); } catch { return json({ error: "datos" }, 400, cors); }
      const r = await verificarPase(String(d.pase || ""), env.EMISOR, jwksDe(env, request));
      if (r && r.aud === "login") return json({ error: "pase" }, 401, cors);      // el pase de la casa no sirve fuera de aquí
      return r ? json({ ok: 1, ...r }, 200, cors) : json({ error: "pase" }, 401, cors);
    }

    // El menú personal: qué servicio usó más recientemente cada persona y cuáles quitó. Se identifica con su pase (cualquier
    // servicio de la casa) y se guarda por su identificador de Google, así la viaja a todos los servicios.
    if (u.pathname === "/api/menu" && request.method === "POST") {
      let d; try { d = await request.json(); } catch { return json({ error: "datos" }, 400, cors); }
      const g = await verificarPase(String(d.pase || ""), env.EMISOR, jwksDe(env, request));
      if (!g || g.aud === "login") return json({ error: "pase" }, 401, cors);
      const llave = "menu:" + g.sub, ids = (a) => (Array.isArray(a) ? a : []).map((x) => String(x).replace(/[^a-z0-9-]/gi, "").slice(0, 32)).filter(Boolean).slice(0, 100);
      let m = (await env.MENU.get(llave, "json")) || { orden: [], ocultos: [] };
      if (d.uso) { const id = ids([d.uso])[0]; if (id) { m.orden = [id, ...m.orden.filter((x) => x !== id)].slice(0, 100); m.ocultos = m.ocultos.filter((x) => x !== id); } }
      if (d.ocultar) { const id = ids([d.ocultar])[0]; if (id && !m.ocultos.includes(id)) m.ocultos.push(id); }
      if (d.restaurar) m.ocultos = [];
      if (d.uso || d.ocultar || d.restaurar) { m.t = Date.now(); await env.MENU.put(llave, JSON.stringify(m)); }
      return json(m, 200, cors);
    }
    // Las preferencias: lo que cada persona personaliza en cada servicio (el fondo del home, el sonido de un juego, el
    // tamaño del texto…) viaja con su cuenta. Un blob por persona, con un apartado por servicio; cada valor lleva su hora
    // para que gane el cambio más reciente entre equipos. Se identifica con el pase del servicio.
    if (u.pathname === "/api/prefs" && request.method === "POST") {
      let d; try { d = await request.json(); } catch { return json({ error: "datos" }, 400, cors); }
      const g = await verificarPase(String(d.pase || ""), env.EMISOR, jwksDe(env, request));
      if (!g || g.aud === "login") return json({ error: "pase" }, 401, cors);
      const llave = "prefs:" + g.sub, host = g.aud, ok = (k) => typeof k === "string" && /^[\w.:-]{1,64}$/.test(k);
      let todo = (await env.MENU.get(llave, "json")) || {}; let p = todo[host] || {}, casa = todo["*"] || {}, cambio = false;
      // Las sugerencias se retiraron (5-oct-2026): se limpian las marcas que dejaron.
      for (const k of Object.keys(casa)) if (k.startsWith("sug.")) { delete casa[k]; cambio = true; }
      const poner = (dest, lista) => { for (const [k, x] of Object.entries(lista).slice(0, 60)) { if (!ok(k) || !x || typeof x.v !== "string" || x.v.length > 20000) continue; const t = Math.min(Date.now() + 60000, Math.floor(Number(x.t)) || Date.now()); if (!dest[k] || dest[k].t < t) { dest[k] = { v: x.v, t }; cambio = true; } } };
      if (d.set && typeof d.set === "object") poner(p, d.set);
      if (d.casa && typeof d.casa === "object") poner(casa, d.casa);             // los superpoderes: aplican en toda la casa
      if (Array.isArray(d.borrar)) for (const k of d.borrar.slice(0, 60)) { if (ok(k) && p[k]) { delete p[k]; cambio = true; } }
      if (cambio) { todo[host] = p; todo["*"] = casa; const texto = JSON.stringify(todo); if (texto.length > 400000) return json({ error: "grande" }, 413, cors); await env.MENU.put(llave, texto); }
      return json({ prefs: p, casa }, 200, cors);
    }
    // El uso: cuánto tiempo pasa cada persona en cada servicio, cuántas visitas, a qué horas y desde qué equipo. Solo se
    // enseña a la propia persona en /cuenta, donde también se borra. Ningún servicio lo usa para interrumpir a nadie.
    if (u.pathname === "/api/uso" && request.method === "POST") {
      let d; try { d = await request.json(); } catch { return json({ error: "datos" }, 400, cors); }
      const g = await verificarPase(String(d.pase || ""), env.EMISOR, jwksDe(env, request));
      if (!g || g.aud === "login") return json({ error: "pase" }, 401, cors);
      const llave = "uso:" + g.sub, todo = (await env.MENU.get(llave, "json")) || {}, h = todo[g.aud] || { seg: 0, visitas: 0, horas: Array(24).fill(0), movil: 0, escritorio: 0, primera: Date.now(), ult: 0 };
      const seg = Math.max(0, Math.min(600, Math.floor(Number(d.seg)) || 0)), hora = Math.max(0, Math.min(23, Math.floor(Number(d.hora)) || 0));
      h.seg += seg; if (d.visita) h.visitas++; h.horas[hora] = (h.horas[hora] || 0) + seg; if (d.movil) h.movil += seg; else h.escritorio += seg; h.ult = Date.now();
      todo[g.aud] = h; await env.MENU.put(llave, JSON.stringify(todo));
      return json({ uso: todo }, 200, cors);
    }
    // Mi cuenta: todo lo que la casa sabe de la persona, para verlo, ajustarlo o borrarlo. Con la cookie de la casa.
    if (u.pathname === "/api/cuenta") {
      const g = await verificarPase(leerGalleta(request), env.EMISOR, jwksDe(env, request));
      if (!g || g.aud !== "login") return json({ error: "sesion" }, 401);
      if (request.method === "POST") {
        let d; try { d = await request.json(); } catch { return json({ error: "datos" }, 400); }
        if (d.borrar === "todo") { await Promise.all([env.MENU.delete("prefs:" + g.sub), env.MENU.delete("uso:" + g.sub), env.MENU.delete("menu:" + g.sub)]); return json({ ok: 1, borrado: 1 }); }
        if (d.casa && typeof d.casa === "object") { const todo = (await env.MENU.get("prefs:" + g.sub, "json")) || {}, casa = todo["*"] || {}; for (const [k, v] of Object.entries(d.casa).slice(0, 30)) { if (!/^[\w.:-]{1,64}$/.test(k)) continue; if (v === null || v === "") delete casa[k]; else if (typeof v === "string" && v.length < 200) casa[k] = { v, t: Date.now() }; } todo["*"] = casa; await env.MENU.put("prefs:" + g.sub, JSON.stringify(todo)); }
      }
      const [prefs, uso, menu] = await Promise.all([env.MENU.get("prefs:" + g.sub, "json"), env.MENU.get("uso:" + g.sub, "json"), env.MENU.get("menu:" + g.sub, "json")]);
      return json({ quien: { sub: g.sub, email: g.email, name: g.name, picture: g.picture }, casa: Object.fromEntries(Object.entries((prefs && prefs["*"]) || {}).filter(([k]) => !k.startsWith("sug."))), prefs: prefs || {}, uso: uso || {}, menu: menu || { orden: [], ocultos: [] } });
    }
    if (u.pathname.startsWith("/api/")) return json({ error: "no" }, 404, cors);
    const r = await env.ASSETS.fetch(request);
    if (u.pathname === "/servicios.json" || u.pathname === "/login.js" || u.pathname === "/verificar.js") { const h = new Headers(r.headers); h.set("access-control-allow-origin", "*"); h.set("cache-control", "public, max-age=300, stale-while-revalidate=86400"); return new Response(r.body, { status: r.status, headers: h }); }
    if ((r.headers.get("content-type") || "").includes("text/html")) { const h = new Headers(r.headers); h.set("content-security-policy", "frame-ancestors 'none'"); h.set("x-frame-options", "DENY"); h.set("referrer-policy", "strict-origin-when-cross-origin"); return new Response(r.body, { status: r.status, headers: h }); }
    return r;
  },
};

// La misma verificación que usan los servicios (está copiada en verificar.js para quien la quiera pegar en su Worker).
async function verificarPase(pase, emisor, jwks) {
  const [h, p, s] = pase.split("."); if (!h || !p || !s) return null;
  const de = (x) => Uint8Array.from(atob(x.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  let cab, cuerpo; try { cab = JSON.parse(new TextDecoder().decode(de(h))); cuerpo = JSON.parse(new TextDecoder().decode(de(p))); } catch { return null; }
  if (cab.alg !== "ES256" || cuerpo.iss !== emisor || !(cuerpo.exp > Date.now() / 1000)) return null;
  const jwk = ((await jwks()).keys || []).find((k) => k.kid === cab.kid); if (!jwk) return null;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, de(s), enc(h + "." + p));
  return ok ? cuerpo : null;
}
