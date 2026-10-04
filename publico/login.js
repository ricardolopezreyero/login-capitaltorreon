// RLR · Login de CapitalTorreon para cualquier página: <script src="https://login.capitaltorreon.com/login.js" defer></script>
// Un elemento <div data-login-ct></div> se llena solo: «Entrar con Google» si no hay sesión, o la foto, el nombre y «Salir».
// LoginCT.entrar()  → va a entrar y vuelve a esta misma página con la sesión (si ya entró en otro servicio, ni pulsa Google)
// LoginCT.quien()   → { email, name, picture, sub, exp } si hay sesión vigente, o null
// LoginCT.pase()    → el pase firmado, para mandarlo a tu servidor (que lo verifica con verificar.js)
// LoginCT.salir()   → cierra la sesión aquí y en la casa, y vuelve a esta página
// LoginCT.montar(el)→ pinta el botón o la ficha en cualquier elemento; LoginCT.al(fn) avisa cuando cambia la sesión
// Todo funciona sin entrar; entrar solo agrega lo que cada servicio decida guardar.
(function () {
  const LLAVE = 'ct_sesion', EMISOR = 'https://login.capitaltorreon.com', oyentes = [];
  const lee = () => { try { return localStorage.getItem(LLAVE) || ''; } catch { return ''; } };
  const cuerpo = (p) => { try { const c = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(p.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0)))); return c.exp > Date.now() / 1000 && c.aud === location.hostname ? c : null; } catch { return null; } };      // el pase viene en UTF-8: los acentos llegan bien
  const limpiar = () => history.replaceState(null, '', location.pathname + location.search);
  let recien = false;
  const tomar = () => {
    const m = location.hash.match(/sesion=([\w-]+\.[\w-]+\.[\w-]+)/);
    if (m) { try { localStorage.setItem(LLAVE, m[1]); } catch {} limpiar(); recien = true; }
    else if (/salio=1/.test(location.hash)) { try { localStorage.removeItem(LLAVE); } catch {} limpiar(); }
  };
  const aqui = () => location.href.split('#')[0]; const aqui2 = aqui;
  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.7-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
  const estilo = () => { if (document.getElementById('login-ct-css')) return; const s = document.createElement('style'); s.id = 'login-ct-css'; s.textContent = '.login-ct{display:inline-flex;align-items:center;gap:8px;font:600 14px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}.login-ct button{display:inline-flex;align-items:center;gap:8px;background:#fff;color:#1f1f1f;border:1px solid #747775;border-radius:99px;padding:9px 14px;font:inherit;cursor:pointer}.login-ct button:hover{background:#f3f3f3}.login-ct img{width:28px;height:28px;border-radius:50%;display:block}.login-ct .n{max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.login-ct .g{width:40px;height:40px;padding:0;justify-content:center;border-radius:50%;box-shadow:0 2px 10px #0004}.login-ct .g svg{width:20px;height:20px}.login-ct .foto{width:40px;height:40px;padding:0;justify-content:center;border-radius:50%;background:#17181a;color:#f4f4f5;border-color:#3a3c42;box-shadow:0 2px 10px #0004}.login-ct .foto img,.login-ct .foto .ini{width:34px;height:34px}.login-ct .foto:hover{background:#222428}.login-ct .ini{width:28px;height:28px;border-radius:50%;background:#fff;color:#111;font-style:normal;display:grid;place-items:center;font-weight:800}.login-ct .v{font-style:normal;opacity:.6;font-size:11px}.login-ct-menu{position:absolute;z-index:2147483000;background:#17181a;color:#f4f4f5;border:1px solid #2a2c30;border-radius:16px;box-shadow:0 18px 50px #000a;padding:6px;font:14px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;animation:loginCtEntra .16s ease-out}@keyframes loginCtEntra{from{opacity:0;transform:translateY(-6px)}}.login-ct-menu .cab{padding:8px 12px 6px;color:#9a9ca3;font-size:12px}.login-ct-menu .it{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:11px;color:inherit;text-decoration:none}.login-ct-menu .it:hover{background:#24262b}.login-ct-menu .it.aqui{background:#1f2126}.login-ct-menu .it i{font-style:normal;font-size:22px;width:30px;text-align:center}.login-ct-menu .it span{flex:1;min-width:0}.login-ct-menu .it b{display:block;font-weight:700}.login-ct-menu .it small{display:block;color:#9a9ca3;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.login-ct-menu .q{background:transparent;border:0;color:#6b6e76;font-size:14px;padding:6px;border-radius:8px;cursor:pointer;opacity:0;transition:opacity .15s}.login-ct-menu .it:hover .q{opacity:1}@media(pointer:coarse){.login-ct-menu .q{opacity:.6}}.login-ct-menu .q:hover{background:#2c2e34;color:#ff8a80}.login-ct-menu .r{display:block;width:100%;background:transparent;border:0;color:#9a9ca3;font:inherit;font-size:12px;padding:8px 12px;text-align:left;cursor:pointer}.login-ct-menu .salir{display:block;width:100%;margin-top:4px;background:transparent;border:0;border-top:1px solid #2a2c30;color:#f4f4f5;font:inherit;font-weight:700;padding:11px 12px 8px;text-align:left;cursor:pointer;border-radius:0 0 12px 12px}.login-ct-menu .salir:hover{background:#24262b}.login-ct-menu .nuevo{font-size:10px;font-weight:800;letter-spacing:.04em;color:#111;background:#ffd23f;border-radius:99px;padding:2px 6px;margin-left:6px;vertical-align:middle}.login-ct-menu .cuenta{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:11px;color:inherit;text-decoration:none;border-top:1px solid #2a2c30;margin-top:4px}.login-ct-menu .cuenta:hover{background:#24262b}.login-ct-menu .cuenta i{font-style:normal;font-size:20px;width:30px;text-align:center}.login-ct-menu .cuenta small{display:block;color:#9a9ca3;font-size:12px}.login-ct-sug{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483000;max-width:min(520px,calc(100vw - 24px));background:#17181a;color:#f4f4f5;border:1px solid #2a2c30;border-radius:16px;box-shadow:0 18px 50px #000a;padding:12px 14px;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex;gap:12px;align-items:center;flex-wrap:wrap;animation:loginCtSube .25s ease-out}@keyframes loginCtSube{from{opacity:0;transform:translate(-50%,10px)}}.login-ct-sug .b{display:flex;gap:6px;margin-left:auto}.login-ct-sug button{font:inherit;font-weight:700;border-radius:99px;padding:7px 12px;cursor:pointer;border:1px solid #3a3c42;background:transparent;color:#f4f4f5}.login-ct-sug button.si{background:#fff;color:#111;border-color:#fff}'; document.head.appendChild(s); };
  // ── El menú de la casa: al tocar la foto salen todos los juegos y proyectos, con lo que esta persona usó más
  //    recientemente arriba, un botecito para quitar lo que no le interese, y «Salir» hasta abajo. El orden es de cada
  //    quien y viaja con su cuenta a todos los servicios (se guarda en la casa).
  const MENU_LLAVE = 'ct_menu';
  let catalogo = null, menuP = null;
  const leerMenu = () => { try { return JSON.parse(localStorage.getItem(MENU_LLAVE) || 'null') || { orden: [], ocultos: [] }; } catch { return { orden: [], ocultos: [] }; } };
  const guardarMenu = (m) => { try { localStorage.setItem(MENU_LLAVE, JSON.stringify(m)); } catch {} };
  const traerCatalogo = async () => { if (catalogo) return catalogo; try { const c = JSON.parse(localStorage.getItem('ct_catalogo') || 'null'); if (c && Date.now() - c.t < 3600000) return (catalogo = c.s); } catch {} const s = (await (await fetch(EMISOR + '/servicios.json')).json()).servicios; catalogo = s; try { localStorage.setItem('ct_catalogo', JSON.stringify({ t: Date.now(), s })); } catch {} return s; };
  const casaMenu = async (cambio) => { const pase = LoginCT.pase(); if (!pase) return null; try { const r = await fetch(EMISOR + '/api/menu', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pase, ...(cambio || {}) }) }); if (!r.ok) return null; const m = await r.json(); guardarMenu(m); return m; } catch { return null; } };
  const ordenar = (lista, m) => { const pos = (id) => { const i = m.orden.indexOf(id); return i < 0 ? 999 : i; }; return lista.filter((s) => !m.ocultos.includes(s.id)).sort((a, b) => pos(a.id) - pos(b.id)); };
  const cerrarMenu = () => { if (menuP) { menuP.remove(); menuP = null; } document.removeEventListener('pointerdown', fueraMenu, true); document.removeEventListener('keydown', escMenu, true); };
  const fueraMenu = (e) => { if (menuP && !menuP.contains(e.target) && !e.target.closest('[data-ct="foto"]')) cerrarMenu(); };
  const escMenu = (e) => { if (e.key === 'Escape') cerrarMenu(); };
  const pintarMenu = (ancla, lista, m) => {
    const aqui = location.hostname.replace(/^www\./, '');
    const abiertos = new Set(m.orden || []);
    const filas = ordenar(lista, m).map((s) => `<a class="it${s.host === aqui ? ' aqui' : ''}" href="${esc(s.url)}" data-id="${esc(s.id)}"><i>${s.ic}</i><span><b>${esc(s.n)}${!abiertos.has(s.id) && s.host !== aqui ? '<em class="nuevo">NUEVO</em>' : ''}</b><small>${esc(s.d)}</small></span><button type="button" class="q" data-q="${esc(s.id)}" title="Quitar de mi menú" aria-label="Quitar ${esc(s.n)} de mi menú">🗑</button></a>`).join('');
    const ocultos = m.ocultos.length;
    menuP.innerHTML = `<div class="cab"><small>Tus juegos y proyectos</small></div>${filas || '<div class="cab"><small>Quitaste todo. Abajo puedes restaurarlo.</small></div>'}${ocultos ? `<button type="button" class="r" data-ct="restaurar">Restaurar los ${ocultos} que quitaste</button>` : ''}<a class="cuenta" href="${EMISOR}/cuenta?volver=${encodeURIComponent(aqui2())}"><i>⚙️</i><span><b>Mi cuenta y superpoderes</b><small>Lo que la casa sabe de ti, para ajustarlo o borrarlo</small></span></a><button type="button" class="salir" data-ct="salir">Salir</button>`;
    menuP.querySelectorAll('a.it').forEach((a) => a.addEventListener('click', (e) => { if (e.target.closest('.q')) return; e.preventDefault(); const id = a.dataset.id; const mm = leerMenu(); mm.orden = [id, ...mm.orden.filter((x) => x !== id)]; guardarMenu(mm); casaMenu({ uso: id }).finally(() => { location.href = a.href; }); setTimeout(() => { location.href = a.href; }, 600); }));
    menuP.querySelectorAll('.q').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const id = b.dataset.q; const mm = leerMenu(); if (!mm.ocultos.includes(id)) mm.ocultos.push(id); guardarMenu(mm); casaMenu({ ocultar: id }); pintarMenu(ancla, lista, mm); }));
    menuP.querySelector('[data-ct="restaurar"]')?.addEventListener('click', () => { const mm = leerMenu(); mm.ocultos = []; guardarMenu(mm); casaMenu({ restaurar: 1 }); pintarMenu(ancla, lista, mm); });
    menuP.querySelector('[data-ct="salir"]').addEventListener('click', () => LoginCT.salir());
    const r = ancla.getBoundingClientRect(), w = Math.min(320, innerWidth - 16); menuP.style.width = w + 'px';
    menuP.style.top = Math.round(r.bottom + 8 + scrollY) + 'px'; menuP.style.left = Math.round(Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + scrollX) + 'px';
  };
  const abrirMenu = async (ancla) => {
    if (menuP) return cerrarMenu();
    menuP = document.createElement('div'); menuP.className = 'login-ct-menu'; menuP.setAttribute('role', 'menu'); document.body.appendChild(menuP);
    menuP.innerHTML = '<div class="cab"><small>Un momento…</small></div>';
    const r = ancla.getBoundingClientRect(); menuP.style.top = Math.round(r.bottom + 8 + scrollY) + 'px'; menuP.style.left = Math.round(Math.max(8, r.right - 320) + scrollX) + 'px';
    document.addEventListener('pointerdown', fueraMenu, true); document.addEventListener('keydown', escMenu, true);
    let lista = []; try { lista = await traerCatalogo(); } catch {}
    if (!menuP) return;
    pintarMenu(ancla, lista, leerMenu());
    casaMenu().then((m) => { if (m && menuP) pintarMenu(ancla, lista, m); });
  };
  const montar = (el) => {
    if (!el) return; estilo(); el.classList.add('login-ct'); const q = LoginCT.quien();
    // Discreto: sin sesión, solo la G de Google; con sesión, solo la foto (o la inicial). El nombre va en el título.
    el.innerHTML = q ? `<button type="button" class="foto" data-ct="foto" title="${esc(q.name || q.email)} · tus juegos y proyectos" aria-label="${esc(q.name || q.email)}: tus juegos y proyectos" aria-haspopup="menu">${q.picture ? `<img src="${esc(q.picture)}" alt="" referrerpolicy="no-referrer">` : '<i class="ini">' + esc((((q.name || '').split(' ').find((w) => w && !/^(ing|lic|dr|dra|mtro|mtra|arq|sr|sra|don|doña)\.?$/i.test(w)) || q.email || '?')[0]).toUpperCase()) + '</i>'}</button>` : `<button type="button" class="g" data-ct="entrar" title="Entrar con Google" aria-label="Entrar con Google">${G}</button>`;
    el.querySelector('[data-ct="entrar"]')?.addEventListener('click', () => LoginCT.entrar());
    el.querySelector('[data-ct="foto"]')?.addEventListener('click', (e) => abrirMenu(e.currentTarget));
  };
  const montarTodos = () => document.querySelectorAll('[data-login-ct]').forEach(montar);
  tomar();
  const usoAqui = () => { const h = location.hostname.replace(/^www\./, ''); traerCatalogo().then((l) => { const s = l.find((x) => x.host === h); if (!s) return; const mm = leerMenu(); if (mm.orden[0] === s.id) return; mm.orden = [s.id, ...mm.orden.filter((x) => x !== s.id)]; guardarMenu(mm); casaMenu({ uso: s.id }); }).catch(() => {}); };
  window.LoginCT = {
    entrar(elegir) { location.href = EMISOR + '/?volver=' + encodeURIComponent(aqui()) + (elegir ? '&elegir=1' : ''); },
    pase() { const p = lee(); return p && cuerpo(p) ? p : ''; },
    quien() { const c = cuerpo(lee()); return c ? { sub: c.sub, email: c.email, name: c.name, picture: c.picture, exp: c.exp } : null; },
    salir() { try { localStorage.removeItem(LLAVE); } catch {} location.href = EMISOR + '/salir?volver=' + encodeURIComponent(aqui()); },
    montar, al(fn) { oyentes.push(fn); if (recien) fn(LoginCT.quien()); }, menu: abrirMenu,
    recien: () => recien,
  };
  // ── Preferencias que viajan con la cuenta. Cada servicio declara qué claves de localStorage son personalización
  //    (<script src=".../login.js" data-prefs="clave1,clave2">). Desde ese momento: lo que la persona cambie se sube a su
  //    cuenta; al entrar en otro equipo (o con otra cuenta) se aplica lo suyo; al cambiar de cuenta cambian todas las
  //    preferencias; al salir, el equipo vuelve a los valores de fábrica. Gana siempre el cambio más reciente.
  const PREF_CLAVES = ((document.currentScript && document.currentScript.dataset.prefs) || '').split(',').map((x) => x.trim()).filter(Boolean);
  const P_SUB = 'ct_prefs_sub', P_T = 'ct_prefs_t';
  const marcas = () => { try { return JSON.parse(localStorage.getItem(P_T) || '{}'); } catch { return {}; } };
  const marcar = (k, t) => { const m = marcas(); m[k] = t; try { localStorage.setItem(P_T, JSON.stringify(m)); } catch {} };
  let subirT = 0, enVivo = null, aplicando = false;
  const subir = async () => { const pase = LoginCT.pase(); if (!pase || !PREF_CLAVES.length) return; const m = marcas(), set = {}, borrar = []; for (const k of PREF_CLAVES) { const v = localStorage.getItem(k); if (v === null) { if (m[k]) borrar.push(k); } else set[k] = { v, t: m[k] || 1 }; } try { await fetch(EMISOR + '/api/prefs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pase, set, borrar }) }); } catch {} };
  const programar = () => { clearTimeout(subirT); subirT = setTimeout(subir, 900); };
  if (PREF_CLAVES.length && typeof Storage !== 'undefined') {
    const si = Storage.prototype.setItem, ri = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (k, v) { si.call(this, k, v); if (this === localStorage && !aplicando && PREF_CLAVES.includes(k)) { marcar(k, Date.now()); programar(); } };
    Storage.prototype.removeItem = function (k) { ri.call(this, k); if (this === localStorage && !aplicando && PREF_CLAVES.includes(k)) { marcar(k, Date.now()); programar(); } };
  }
  const sincronizar = async () => {
    const q = LoginCT.quien(), pase = LoginCT.pase(); if (!q || !pase || !PREF_CLAVES.length) return;
    let antes = ''; try { antes = localStorage.getItem(P_SUB) || ''; } catch {}
    let nube, casaNube; try { const rr = await (await fetch(EMISOR + '/api/prefs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pase, casa: casaPendiente() }) })).json(); nube = rr.prefs || {}; casaNube = rr.casa || {}; } catch { return; }
    aplicarCasa(casaNube, true);
    const cambioCuenta = antes && antes !== q.sub, m = marcas(), cambios = {}, set = {};
    aplicando = true;
    for (const k of PREF_CLAVES) {
      const local = localStorage.getItem(k), tl = local === null ? 0 : (m[k] || 1), n = nube[k];
      if (cambioCuenta) { if (n) { if (local !== n.v) { localStorage.setItem(k, n.v); cambios[k] = n.v; } } else if (local !== null) { localStorage.removeItem(k); cambios[k] = null; } }
      else if (n && n.t >= tl) { if (local !== n.v) { localStorage.setItem(k, n.v); cambios[k] = n.v; } }
      else if (local !== null) set[k] = { v: local, t: tl };
    }
    aplicando = false;
    try { localStorage.setItem(P_SUB, q.sub); localStorage.setItem(P_T, JSON.stringify(cambioCuenta ? {} : m)); } catch {}
    if (Object.keys(set).length) { try { await fetch(EMISOR + '/api/prefs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pase, set }) }); } catch {} }
    if (Object.keys(cambios).length) { if (enVivo) enVivo(cambios); else if (!sessionStorage.getItem('ct_prefs_recarga')) { try { sessionStorage.setItem('ct_prefs_recarga', '1'); } catch {} location.reload(); } }
    else { try { sessionStorage.removeItem('ct_prefs_recarga'); } catch {} }
  };
  const limpiarPrefs = () => { aplicando = true; try { for (const k of PREF_CLAVES) localStorage.removeItem(k); localStorage.removeItem(P_SUB); localStorage.removeItem(P_T); } catch {} aplicando = false; };
  LoginCT.alPrefs = (fn) => { enVivo = fn; };
  LoginCT.prefs = () => Object.fromEntries(PREF_CLAVES.map((k) => [k, localStorage.getItem(k)]));
  const salirBase = LoginCT.salir; LoginCT.salir = () => { limpiarPrefs(); salirBase(); };
  // ── Superpoderes de la casa: ajustes que aplican en TODOS los servicios (texto grande, contraste, menos movimiento,
  //    silencio, modo noche). Viven en la cuenta (apartado «casa»); aquí se guardan en localStorage (ct_casa) y se ponen
  //    como clases en <html>: .ct-texto-grande .ct-contraste .ct-quieto .ct-silencio .ct-noche. Cada app los adopta
  //    como quiera; LoginCT.casa() los devuelve y LoginCT.alCasa(fn) avisa cuando cambian.
  const CASA_LLAVE = 'ct_casa', CASA_CLAVES = ['texto', 'contraste', 'movimiento', 'sonido', 'noche'];
  const leerCasa = () => { try { return JSON.parse(localStorage.getItem(CASA_LLAVE) || '{}'); } catch { return {}; } };
  let casaOyentes = [], casaPend = {};
  const casaPendiente = () => { const c = casaPend; casaPend = {}; return c; };
  const pintarCasa = (c) => { const h = document.documentElement; h.classList.toggle('ct-texto-grande', c.texto === 'grande'); h.classList.toggle('ct-contraste', c.contraste === '1'); h.classList.toggle('ct-quieto', c.movimiento === 'reducido'); h.classList.toggle('ct-silencio', c.sonido === 'silencio'); h.classList.toggle('ct-noche', c.noche === '1'); h.style.setProperty('--ct-texto', c.texto === 'grande' ? '1.15' : '1'); };
  const aplicarCasa = (nube, desdeNube) => { const local = leerCasa(); let cambio = false; for (const k of CASA_CLAVES) { const n = nube[k]; if (!n) continue; const l = local[k]; if (!l || l.t < n.t) { local[k] = { v: n.v, t: n.t }; cambio = true; } } if (cambio || desdeNube) { try { localStorage.setItem(CASA_LLAVE, JSON.stringify(local)); } catch {} pintarCasa(Object.fromEntries(Object.entries(local).map(([k, x]) => [k, x.v]))); if (cambio) casaOyentes.forEach((f) => f(LoginCT.casa())); } };
  LoginCT.casa = () => Object.fromEntries(Object.entries(leerCasa()).map(([k, x]) => [k, x.v]));
  LoginCT.casaPon = (k, v) => { if (!CASA_CLAVES.includes(k)) return; const local = leerCasa(); local[k] = { v: String(v), t: Date.now() }; try { localStorage.setItem(CASA_LLAVE, JSON.stringify(local)); } catch {} casaPend[k] = local[k]; pintarCasa(LoginCT.casa()); casaOyentes.forEach((f) => f(LoginCT.casa())); const pase = LoginCT.pase(); if (pase) fetch(EMISOR + '/api/prefs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pase, casa: casaPendiente() }) }).catch(() => {}); };
  LoginCT.alCasa = (fn) => { casaOyentes.push(fn); };
  pintarCasa(LoginCT.casa());
  if (!document.getElementById('login-ct-casa')) { const st = document.createElement('style'); st.id = 'login-ct-casa'; st.textContent = 'html.ct-quieto *,html.ct-quieto *::before,html.ct-quieto *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}'; (document.head || document.documentElement).appendChild(st); }

  // ── El uso: tiempo real de uso por servicio (pestaña visible y algo de actividad en los últimos 2 min), visitas y hora.
  //    Se manda cada minuto y al salir de la página. Solo con cuenta; sin cuenta no se guarda nada.
  let usoSeg = 0, usoT = Date.now(), usoAct = Date.now(), usoVisita = true;
  const esMovil = () => matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) <= 820;
  for (const ev of ['pointerdown', 'keydown', 'touchstart', 'wheel']) addEventListener(ev, () => { usoAct = Date.now(); }, { passive: true, capture: true });
  setInterval(() => { const ahora = Date.now(); if (!document.hidden && ahora - usoAct < 120000) usoSeg += Math.min(2, (ahora - usoT) / 1000); usoT = ahora; }, 1000);
  const mandarUso = (fin) => { const pase = LoginCT.pase(); const seg = Math.floor(usoSeg); if (!pase || (seg < 1 && !usoVisita)) return; const cuerpoU = JSON.stringify({ pase, seg, hora: new Date().getHours(), movil: esMovil() ? 1 : 0, visita: usoVisita ? 1 : 0 }); usoSeg -= seg; usoVisita = false; if (fin && navigator.sendBeacon) navigator.sendBeacon(EMISOR + '/api/uso', new Blob([cuerpoU], { type: 'application/json' })); else fetch(EMISOR + '/api/uso', { method: 'POST', headers: { 'content-type': 'application/json' }, body: cuerpoU, keepalive: true }).then((r) => r.json()).then((d) => { if (d && d.uso) sugerir(d.uso); }).catch(() => {}); };
  setInterval(() => mandarUso(false), 60000); addEventListener('pagehide', () => mandarUso(true)); document.addEventListener('visibilitychange', () => { if (document.hidden) mandarUso(true); });
  setTimeout(() => mandarUso(false), 4000);

  // ── Sugerencias: discretas, una a la vez, cada una se ofrece una sola vez y se puede decir «ahora no». Se deciden con
  //    lo que la persona hace de verdad: la app que sigue (lo que no ha abierto), el modo noche (si usa la casa de noche)
  //    y el texto grande (si está en el teléfono y lleva varias visitas).
  const SUG_LLAVE = 'ct_sug';
  const sugVistas = () => { try { return JSON.parse(localStorage.getItem(SUG_LLAVE) || '{}'); } catch { return {}; } };
  const sugMarcar = (id) => { const v = sugVistas(); v[id] = Date.now(); try { localStorage.setItem(SUG_LLAVE, JSON.stringify(v)); } catch {} const pase = LoginCT.pase(); if (pase) fetch(EMISOR + '/api/prefs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pase, casa: { ['sug.' + id]: { v: '1', t: Date.now() } } }) }).catch(() => {}); };
  let sugAbierta = false;
  const toast = (texto, si, no, alSi) => {
    if (sugAbierta || document.querySelector('.login-ct-sug')) return; sugAbierta = true; estilo();
    const d = document.createElement('div'); d.className = 'login-ct-sug'; d.setAttribute('role', 'status');
    d.innerHTML = `<span>${texto}</span><span class="b"><button type="button" class="si">${esc(si)}</button><button type="button" class="no">${esc(no)}</button></span>`;
    d.querySelector('.si').addEventListener('click', () => { alSi(); d.remove(); }); d.querySelector('.no').addEventListener('click', () => d.remove());
    document.body.appendChild(d); setTimeout(() => { if (d.isConnected) d.remove(); }, 25000);
  };
  const sugerir = async (uso) => {
    const q = LoginCT.quien(); if (!q || sugAbierta) return;
    const vistas = sugVistas(), casa = LoginCT.casa(), hoy = Date.now(), total = Object.values(uso).reduce((a, h) => a + (h.seg || 0), 0), visitas = Object.values(uso).reduce((a, h) => a + (h.visitas || 0), 0);
    const casaNube = Object.keys(casa); // ya aplicada
    let lista = []; try { lista = await traerCatalogo(); } catch { return; }
    const aqui = location.hostname.replace(/^www\./, '');
    // 1) la app que sigue: algo de la casa que nunca ha abierto, cuando ya lleva un rato en lo demás
    const noVistas = lista.filter((s) => !uso[s.host] && s.host !== aqui);
    if (total >= 600 && noVistas.length && !vistas['sig.' + noVistas[0].id]) { const s = noVistas[0]; sugMarcar('sig.' + s.id); return toast(`${s.ic} Lo que sigue en la casa: <b>${esc(s.n)}</b>. ${esc(s.d)}.`, 'Verlo', 'Ahora no', () => { const mm = leerMenu(); mm.orden = [s.id, ...mm.orden.filter((x) => x !== s.id)]; guardarMenu(mm); casaMenu({ uso: s.id }).finally(() => { location.href = s.url; }); setTimeout(() => { location.href = s.url; }, 600); }); }
    // 2) de noche: si la mitad o más del tiempo es entre 21 y 6, y no ha dicho nada del modo noche
    const horas = Object.values(uso).reduce((a, h) => a.map((x, i) => x + ((h.horas || [])[i] || 0)), Array(24).fill(0)), noche = horas.slice(21).concat(horas.slice(0, 6)).reduce((a, b) => a + b, 0);
    if (total >= 900 && noche / total >= 0.5 && !casa.noche && !vistas.noche) { sugMarcar('noche'); return toast('🌙 Te vemos seguido de noche. ¿Prendemos el <b>modo noche</b> en toda la casa? Menos brillo y menos movimiento.', 'Sí, de noche', 'Ahora no', () => { LoginCT.casaPon('noche', '1'); LoginCT.casaPon('movimiento', 'reducido'); }); }
    // 3) en el teléfono, con varias visitas, sin haber tocado el tamaño del texto
    if (esMovil() && visitas >= 3 && !casa.texto && !vistas.texto) { sugMarcar('texto'); return toast('🔎 ¿Texto más grande en el teléfono? Aplica en todos los servicios de la casa.', 'Sí, más grande', 'Así está bien', () => LoginCT.casaPon('texto', 'grande')); }
  };

  if (LoginCT.quien()) setTimeout(sincronizar, recien ? 0 : 400);
  oyentes.push(() => sincronizar());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montarTodos); else montarTodos();
  if (recien) setTimeout(() => oyentes.forEach((f) => f(LoginCT.quien())), 0);
  if (LoginCT.quien()) setTimeout(usoAqui, 1500);
  // Reconocer en silencio: si aquí no hay sesión (o le quedan menos de 7 días), se le pregunta a la casa en un marco oculto.
  // Si la persona ya entró en cualquier otro servicio, aparece dentro sin pulsar nada; si no, no pasa nada visible.
  const q0 = cuerpo(lee());
  if (!/salio=1/.test(location.hash) && (!q0 || q0.exp - Date.now() / 1000 < 7 * 86400) && !sessionStorage.getItem('ct_pregunte')) {
    try { sessionStorage.setItem('ct_pregunte', '1'); } catch {}
    const f = document.createElement('iframe'); f.src = EMISOR + '/renovar?para=' + encodeURIComponent(location.host); f.style.cssText = 'position:absolute;width:0;height:0;border:0;opacity:0;pointer-events:none'; f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    const fin = () => { try { f.remove(); } catch {} };
    addEventListener('message', (e) => {
      if (e.origin !== EMISOR || !e.data || e.source !== f.contentWindow) return;
      if (e.data.ct === 'pase' && typeof e.data.pase === 'string' && cuerpo(e.data.pase)) { try { localStorage.setItem(LLAVE, e.data.pase); } catch {} const nuevo = !q0; montarTodos(); if (nuevo) { oyentes.forEach((fn) => fn(LoginCT.quien())); setTimeout(usoAqui, 800); } }
      fin();
    });
    f.onerror = fin; setTimeout(fin, 15000);
    (document.body || document.documentElement).appendChild(f);
  }
})();
