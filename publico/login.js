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
  const cuerpo = (p) => { try { const c = JSON.parse(atob(p.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); return c.exp > Date.now() / 1000 && c.aud === location.hostname ? c : null; } catch { return null; } };
  const limpiar = () => history.replaceState(null, '', location.pathname + location.search);
  let recien = false;
  const tomar = () => {
    const m = location.hash.match(/sesion=([\w-]+\.[\w-]+\.[\w-]+)/);
    if (m) { try { localStorage.setItem(LLAVE, m[1]); } catch {} limpiar(); recien = true; }
    else if (/salio=1/.test(location.hash)) { try { localStorage.removeItem(LLAVE); } catch {} limpiar(); }
  };
  const aqui = () => location.href.split('#')[0];
  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.7-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
  const estilo = () => { if (document.getElementById('login-ct-css')) return; const s = document.createElement('style'); s.id = 'login-ct-css'; s.textContent = '.login-ct{display:inline-flex;align-items:center;gap:8px;font:600 14px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}.login-ct button{display:inline-flex;align-items:center;gap:8px;background:#fff;color:#1f1f1f;border:1px solid #747775;border-radius:99px;padding:9px 14px;font:inherit;cursor:pointer}.login-ct button:hover{background:#f3f3f3}.login-ct img{width:28px;height:28px;border-radius:50%;display:block}.login-ct .n{max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.login-ct .s{background:transparent;color:inherit;border-color:currentColor;opacity:.75;padding:6px 10px;font-size:12px}'; document.head.appendChild(s); };
  const montar = (el) => {
    if (!el) return; estilo(); el.classList.add('login-ct'); const q = LoginCT.quien();
    el.innerHTML = q ? `${q.picture ? `<img src="${esc(q.picture)}" alt="" referrerpolicy="no-referrer">` : ''}<span class="n" title="${esc(q.email)}">${esc(q.name || q.email)}</span><button class="s" type="button" data-ct="salir">Salir</button>` : `<button type="button" data-ct="entrar">${G}Entrar con Google</button>`;
    el.querySelector('[data-ct="entrar"]')?.addEventListener('click', () => LoginCT.entrar());
    el.querySelector('[data-ct="salir"]')?.addEventListener('click', () => LoginCT.salir());
  };
  const montarTodos = () => document.querySelectorAll('[data-login-ct]').forEach(montar);
  tomar();
  window.LoginCT = {
    entrar(elegir) { location.href = EMISOR + '/?volver=' + encodeURIComponent(aqui()) + (elegir ? '&elegir=1' : ''); },
    pase() { const p = lee(); return p && cuerpo(p) ? p : ''; },
    quien() { const c = cuerpo(lee()); return c ? { sub: c.sub, email: c.email, name: c.name, picture: c.picture, exp: c.exp } : null; },
    salir() { try { localStorage.removeItem(LLAVE); } catch {} location.href = EMISOR + '/salir?volver=' + encodeURIComponent(aqui()); },
    montar, al(fn) { oyentes.push(fn); if (recien) fn(LoginCT.quien()); },
    recien: () => recien,
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montarTodos); else montarTodos();
  if (recien) setTimeout(() => oyentes.forEach((f) => f(LoginCT.quien())), 0);
})();
