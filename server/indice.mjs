// Este es nuestro servidor. Se ocupa del acceso con Google y de crear eventos. Los secretos nunca se mandan al celular.
import http from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// Pedimos acceso a eventos de calendarios propios; acá usamos el calendario principal.
const scope = 'https://www.googleapis.com/auth/calendar.events.owned';
// Creamos códigos aleatorios largos para que no se puedan adivinar.
const secret = () => randomBytes(32).toString('hex');
const hash = value => createHash('sha256').update(value).digest('hex');
// Volvemos a validar en el servidor: no confiamos solo en lo que revisó el celular.
export function validarEvento(body, now = Date.now()) {
  const { summary, start, end } = body;
  if (typeof summary !== 'string' || !summary.trim() || summary.length > 1000)
    throw new Error('Escribí una actividad de hasta 1000 caracteres.');
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (typeof start !== 'string' || typeof end !== 'string' || !iso.test(start) || !iso.test(end))
    throw new Error('Fecha u hora inválida.');
  const a = Date.parse(start), b = Date.parse(end);
  if (!Number.isFinite(a) || !Number.isFinite(b) || new Date(a).toISOString() !== start || new Date(b).toISOString() !== end || a <= now || ![10, 30, 60, 90, 120].includes((b - a) / 60000))
    throw new Error('Usá una fecha futura y una duración de 10, 30, 60, 90 o 120 minutos.');
  return { summary: summary.trim(), start, end };
}
// Armamos el servidor que recibe los pedidos de la app.
export function crearServidor(env = process.env, request = fetch) {
  // Estos mapas viven en memoria: al reiniciar el servidor se pierden las sesiones.
  const flows = new Map(), polls = new Map(), sessions = new Map(), limits = new Map();
  const publicUrl = (env.PUBLIC_URL || env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
  const redirect = publicUrl + '/auth/callback';
  const configured = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && /^https:\/\//.test(publicUrl);
  // Las llamadas a Google tienen un tiempo de espera máximo de 15 segundos.
  async function google(url, options = {}) {
    const response = await request(url, { ...options, signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    return { response, result };
  }
  // Respondemos en JSON y pedimos que la respuesta no quede guardada en caché.
  function json(res, status, value) {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
  }
  // Esta es la página que ves al volver de Google; los mensajes los controla el servidor.
  function page(res, message) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'", 'Referrer-Policy': 'no-referrer' });
    res.end('<!doctype html><meta name="viewport" content="width=device-width"><title>WorkFlow</title><body style="background:#0d1230;color:white;font:20px system-ui;padding:40px"><h1>WorkFlow</h1><p>' + message + '</p><p>Podés cerrar esta pestaña y volver a Expo Go.</p></body>');
  }
  return http.createServer(async (req, res) => {
    try {
      // Limpiamos intentos vencidos y limitamos pedidos antes de procesar la ruta.
      const now = Date.now();
      for (const [key, value] of flows) if (value.expires < now) { flows.delete(key); polls.delete(value.pollToken); }
      for (const [key, value] of sessions) if (value.expires < now) sessions.delete(key);
      for (const [key, value] of limits) if (value.until < now) limits.delete(key);
      const ip = req.socket.remoteAddress;
      const count = limits.get(ip) || { n: 0, until: now + 60000 };
      count.n++; limits.set(ip, count);
      if (count.n > 120) return json(res, 429, { error: 'Demasiados intentos. Esperá un minuto.' });
      const url = new URL(req.url, 'http://localhost');
      // Esta ruta dice si la API está viva y si tiene configuración, sin mostrar secretos.
      if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, googleConfigured: Boolean(configured) });
      // Leemos JSON con un límite de tamaño para no aceptar pedidos enormes.
      let body = {};
      if (req.method === 'POST') {
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 8192) return json(res, 413, { error: 'Solicitud demasiado grande.' }); }
        try { body = JSON.parse(raw || '{}'); } catch { return json(res, 400, { error: 'JSON inválido.' }); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'Solicitud inválida.' });
      }
      // Paso 1: creamos un intento de ingreso que dura diez minutos.
      if (req.method === 'POST' && url.pathname === '/auth/start') {
        if (!configured) return json(res, 503, { error: 'Configurá Google OAuth y PUBLIC_URL HTTPS en la API.' });
        if (flows.size >= 1000) return json(res, 503, { error: 'Intentá nuevamente más tarde.' });
        const state = secret(), pollToken = secret();
        flows.set(state, { pollToken, expires: now + 600000 });
        polls.set(pollToken, state);
        return json(res, 200, { pollToken, url: publicUrl + '/auth/browser?state=' + state });
      }
      // Paso 2: el navegador recibe una cookie y lo mandamos a Google con PKCE.
      if (req.method === 'GET' && url.pathname === '/auth/browser') {
        const state = url.searchParams.get('state'), flow = flows.get(state);
        if (!flow || flow.cookie) return page(res, 'Este enlace venció. Iniciá sesión nuevamente.');
        flow.cookie = secret();
        flow.verifier = randomBytes(32).toString('base64url');
        const params = new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirect, response_type: 'code',
          scope: 'openid email profile ' + scope, state,
          code_challenge: createHash('sha256').update(flow.verifier).digest('base64url'),
          code_challenge_method: 'S256', prompt: 'select_account consent',
        });
        res.writeHead(302, {
          Location: 'https://accounts.google.com/o/oauth2/v2/auth?' + params,
          'Set-Cookie': 'wf_oauth=' + flow.cookie + '; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=600',
          'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
        });
        return res.end();
      }
      // Paso 3: Google vuelve acá. Revisamos estado y cookie antes de intercambiar el código.
      if (req.method === 'GET' && url.pathname === '/auth/callback') {
        const state = url.searchParams.get('state'), flow = flows.get(state);
        const cookie = (req.headers.cookie || '').split('; ').find(x => x.startsWith('wf_oauth='))?.slice(9);
        if (!flow || !flow.cookie || cookie !== flow.cookie || flow.used) return page(res, 'La autorización no es válida. Iniciá sesión nuevamente.');
        flow.used = true;
        if (url.searchParams.has('error') || !url.searchParams.get('code')) {
          flow.error = 'No se autorizó el acceso. Volvé a conectar Google.';
          return page(res, 'No se autorizó el acceso al calendario.');
        }
        // Anotamos en qué etapa falla, sin imprimir códigos ni tokens privados.
        let authStage = 'token';
        try {
          const { response, result } = await google('https://oauth2.googleapis.com/token', {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ code: url.searchParams.get('code'), client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirect, grant_type: 'authorization_code', code_verifier: flow.verifier }),
          });
          if (!response.ok || !result.access_token) throw new Error('token_exchange');
          authStage = 'permissions';
          if (!(result.scope || '').split(' ').includes(scope)) throw new Error('calendar_permission');
          authStage = 'profile';
          const profile = await google('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: 'Bearer ' + result.access_token } });
          if (!profile.response.ok || !profile.result.email || !profile.result.email_verified) throw new Error('No se pudo verificar la cuenta de Google.');
          // El token de Google queda acá y dura como máximo una hora.
          flow.account = { accessToken: result.access_token, expires: now + Math.min(Number(result.expires_in) || 3600, 3600) * 1000, email: profile.result.email, name: profile.result.name || profile.result.email };
          return page(res, 'Cuenta conectada. Volvé a la app y tocá «Ya autoricé, continuar».');
        } catch (error) {
          const networkCode = error.cause?.code;
          console.error('OAuth falló', { stage: authStage, networkCode: ['EACCES', 'EPERM', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'].includes(networkCode) ? networkCode : undefined });
          flow.error = networkCode === 'EACCES' || networkCode === 'EPERM'
            ? 'El servidor no tiene permiso para conectarse a Google. Revisá cómo se inició la API.'
            : authStage === 'permissions'
              ? 'Falta autorizar Google Calendar. Iniciá sesión nuevamente y aceptá el permiso del calendario.'
              : authStage === 'profile'
                ? 'No se pudo verificar tu cuenta con Google. Iniciá sesión nuevamente.'
                : 'No se pudo intercambiar la autorización con Google. Iniciá sesión nuevamente.';
          return page(res, flow.error);
        }
      }
      // Paso 4: el celular recibe su propia sesión; nunca recibe el token de Google.
      if (req.method === 'POST' && url.pathname === '/auth/finish') {
        const state = polls.get(body.pollToken), flow = flows.get(state);
        if (!flow) return json(res, 401, { error: 'La solicitud venció. Volvé a conectar Google.' });
        if (flow.error) return json(res, 400, { error: flow.error });
        if (!flow.account) return json(res, 200, { pending: true });
        // Las rutas privadas necesitan la sesión que mandó el celular.
      const token = secret();
        sessions.set(token, flow.account);
        flows.delete(state); polls.delete(body.pollToken);
        return json(res, 200, { token, email: flow.account.email, name: flow.account.name });
      }
      const token = req.headers.authorization?.replace(/^Bearer /, '');
      const account = sessions.get(token);
      if (req.method === 'POST' && url.pathname === '/auth/logout') {
        sessions.delete(token);
        return json(res, 200, { ok: true });
      }
      if (!account) return json(res, 401, { error: 'La sesión venció. Cerrá sesión e ingresá nuevamente.' });
      // Crear evento: validamos, enviamos a Google y recuperamos el existente si fue un reintento.
      if (req.method === 'POST' && url.pathname === '/events') {
        let event;
        try { event = validarEvento(body); } catch (error) { return json(res, 400, { error: error.message }); }
        // Google acepta este identificador. El mismo evento y sesión generan el mismo ID para no duplicarlo.
        const id = hash(token + JSON.stringify(event));
        const endpoint = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
        let result = await google(endpoint, {
          method: 'POST', headers: { Authorization: 'Bearer ' + account.accessToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, summary: event.summary, start: { dateTime: event.start }, end: { dateTime: event.end } }),
        });
        if (result.response.status === 409) result = await google(endpoint + '/' + id, { headers: { Authorization: 'Bearer ' + account.accessToken } });
        if (!result.response.ok) return json(res, result.response.status === 401 ? 401 : 502, { error: result.response.status === 401 ? 'La sesión de Google venció. Volvé a ingresar.' : 'Google no pudo guardar el evento. Revisá los permisos e intentá nuevamente.' });
        return json(res, 200, { ...event, htmlLink: result.result.htmlLink, id: result.result.id });
      }
      return json(res, 404, { error: 'Ruta no encontrada.' });
    } catch {
      if (!res.headersSent) json(res, 502, { error: 'No se pudo completar la solicitud. Intentá nuevamente.' });
      else res.end();
    }
  });
}
// Arrancamos el puerto solo al ejecutar este archivo, no al importarlo como módulo.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  crearServidor().listen(Number(process.env.PORT || 3001), '0.0.0.0', () => console.log('WorkFlow API en puerto ' + (process.env.PORT || 3001)));
}

