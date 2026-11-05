// Acá probamos el servidor con un Google simulado. No crea eventos reales ni necesita tus credenciales.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearServidor, validarEvento } from './indice.mjs';
import { prepararEvento } from '../src/logica/evento.ts';
test('Validación de fecha local y duración', () => {
  assert.throws(() => prepararEvento('', '2099-01-01', '18:00', 60));
  assert.throws(() => prepararEvento('SQL', '2099-02-30', '18:00', 60));
  assert.throws(() => prepararEvento('SQL', '2099-01-01', '25:00', 60));
  assert.throws(() => prepararEvento('SQL', '2000-01-01', '18:00', 60));
  const event = prepararEvento(' SQL ', '2099-01-01', '18:00', 60);
  assert.equal(event.summary, 'SQL');
  assert.equal(Date.parse(event.end) - Date.parse(event.start), 3600000);
  assert.deepEqual(validarEvento(event), event);
  assert.throws(() => validarEvento({ ...event, end: event.start }));
  assert.throws(() => validarEvento({ ...event, start: '2099-02-30T18:00:00.000Z' }));
});
test('OAuth, permisos, protección de sesión y reintento de eventos (Google simulado)', async () => {
  let insertions = 0;
  let saved;
  const google = async (url, options) => {
    if (url.includes('/token')) return Response.json({ access_token: 'test-google-token', expires_in: 3600, scope: 'https://www.googleapis.com/auth/calendar.events.owned' });
    if (url.includes('/userinfo')) return Response.json({ email: 'test@example.com', email_verified: true, name: 'Prueba' });
    if (options.method === 'POST') {
      const event = JSON.parse(options.body);
      assert.equal(event.start.dateTime, '2099-01-01T18:00:00.000Z');
      insertions++;
      if (insertions > 1) { assert.equal(saved.id, event.id); return Response.json({}, { status: 409 }); }
      saved = event;
      return Response.json({ id: event.id, htmlLink: 'https://calendar.google.com/calendar/event?eid=test' });
    }
    return Response.json({ id: saved.id, htmlLink: 'https://calendar.google.com/calendar/event?eid=test' });
  };
  const server = crearServidor({ PUBLIC_URL: 'https://example.com', GOOGLE_CLIENT_ID: 'test', GOOGLE_CLIENT_SECRET: 'test' }, google);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const post = (path, body, token) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body) });
  try {
    assert.equal((await post('/events', {})).status, 401);
    assert.equal((await post('/auth/finish', { pollToken: 'unknown' })).status, 401);
    const flow = await (await post('/auth/start', {})).json();
    const state = new URL(flow.url).searchParams.get('state');
    const browser = await fetch(base + '/auth/browser?state=' + state, { redirect: 'manual' });
    const cookie = browser.headers.get('set-cookie').split(';')[0];
    assert.equal(browser.status, 302);
    assert.ok(new URL(browser.headers.get('location')).searchParams.get('code_challenge'));
    assert.equal((await (await post('/auth/finish', { pollToken: flow.pollToken })).json()).pending, true);
    await fetch(base + '/auth/callback?state=' + state + '&code=test');
    assert.equal((await (await post('/auth/finish', { pollToken: flow.pollToken })).json()).pending, true);
    await fetch(base + '/auth/callback?state=' + state + '&code=test', { headers: { Cookie: cookie } });
    const session = await (await post('/auth/finish', { pollToken: flow.pollToken })).json();
    assert.equal(session.email, 'test@example.com');
    assert.ok(session.token);
    assert.equal(session.accessToken, undefined);
    assert.equal((await post('/auth/finish', { pollToken: flow.pollToken })).status, 401);
    assert.equal((await post('/events', {}, session.token)).status, 400);
    const event = { summary: 'SQL', start: '2099-01-01T18:00:00.000Z', end: '2099-01-01T19:00:00.000Z' };
    const first = await (await post('/events', event, session.token)).json();
    const retry = await (await post('/events', event, session.token)).json();
    assert.equal(first.id, retry.id);
    assert.equal(first.summary, 'SQL');
    assert.equal((await post('/auth/logout', {}, session.token)).status, 200);
    assert.equal((await post('/events', event, session.token)).status, 401);
    assert.equal((await post('/auth/logout', {}, session.token)).status, 200);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

