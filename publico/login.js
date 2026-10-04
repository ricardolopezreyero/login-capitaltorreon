// RLR · Login de CapitalTorreon para cualquier página: <script src="https://login.capitaltorreon.com/login.js"></script>
// LoginCT.entrar()  → manda a entrar con Google y vuelve a esta misma página con la sesión
// LoginCT.quien()   → { email, name, picture, sub } si hay sesión vigente, o null
// LoginCT.pase()    → el pase firmado, para mandarlo a tu servidor (que lo verifica con verificar.js)
// LoginCT.salir()   → cierra la sesión en este navegador
(function () {
  const LLAVE = 'ct_sesion', EMISOR = 'https://login.capitaltorreon.com';
  const lee = () => { try { return localStorage.getItem(LLAVE) || ''; } catch { return ''; } };
  const tomar = () => { const m = location.hash.match(/sesion=([\w-]+\.[\w-]+\.[\w-]+)/); if (m) { try { localStorage.setItem(LLAVE, m[1]); } catch {} history.replaceState(null, '', location.pathname + location.search); } };
  const cuerpo = (p) => { try { const c = JSON.parse(atob(p.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); return c.exp > Date.now() / 1000 ? c : null; } catch { return null; } };
  tomar();
  window.LoginCT = {
    entrar() { location.href = EMISOR + '/?volver=' + encodeURIComponent(location.href.split('#')[0]); },
    pase() { const p = lee(); return p && cuerpo(p) ? p : ''; },
    quien() { const c = cuerpo(lee()); return c ? { sub: c.sub, email: c.email, name: c.name, picture: c.picture, exp: c.exp } : null; },
    salir() { try { localStorage.removeItem(LLAVE); } catch {} },
  };
})();
