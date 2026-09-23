// Integration test against a real PostgreSQL and S3 store. Skipped unless
// TEST_DATABASE_URL is set (the schema is created there; use a throwaway database).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../config.js';
import { createPool } from '../db/pool.js';
import { migrate } from '../db/migrate.js';
import { ensureDefaultSettings } from '../db/seed.js';
import { createStorage } from '../storage.js';
import { createSessionStore } from '../auth/sessions.js';
import { hashPassword } from '../auth/passwords.js';
import { createApp } from '../app.js';

const databaseUrl = process.env.TEST_DATABASE_URL;

test('API integration', { skip: !databaseUrl && 'set TEST_DATABASE_URL to run' }, async (t) => {
  const config = loadConfig({ ...process.env, DATABASE_URL: databaseUrl, STATIC_DIR: '', HOST: '127.0.0.1', PORT: '0' });
  const pool = createPool(config);
  const storage = createStorage(config);
  const state = { ready: false, storageReady: false, dbConfigured: true };
  await migrate(pool);
  // CASCADE also empties kiosk_settings (it references cms_users); restore the defaults.
  await pool.query('TRUNCATE announcements, faqs, qr_links, floors, locations, media, cms_sessions, cms_users, audit_log RESTART IDENTITY CASCADE');
  await ensureDefaultSettings(pool);
  await pool.query("INSERT INTO cms_users (username, role, password_hash) VALUES ('tester', 'admin', $1)", [await hashPassword('tester-password')]);
  state.ready = true;
  try {
    await storage.ensureBucket();
    state.storageReady = true;
  } catch {
    // media tests below are skipped when no object store is reachable
  }

  const sessions = createSessionStore(pool, config.session);
  const app = createApp({ config, pool, storage, sessions, state, log: () => {} });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  const call = (method, path, body, headers = {}) =>
    fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', Cookie: cookie, ...headers },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

  t.after(async () => {
    server.close();
    await pool.end();
    storage.destroy();
  });

  await t.test('public content works without a session', async () => {
    const res = await call('GET', '/api/kiosk/content');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.deepEqual(Object.keys(data).sort(), ['announcements', 'faqs', 'floors', 'locations', 'qrLinks', 'settings']);
    assert.equal(data.settings.general.idleTimeout, 300000);
  });

  await t.test('cms routes need a session', async () => {
    assert.equal((await call('GET', '/api/cms/announcements')).status, 401);
  });

  await t.test('login sets an httpOnly cookie', async () => {
    const bad = await call('POST', '/api/auth/login', { username: 'tester', password: 'wrong' });
    assert.equal(bad.status, 401);
    const res = await call('POST', '/api/auth/login', { username: 'TESTER', password: 'tester-password' });
    assert.equal(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Strict/);
    cookie = setCookie.split(';')[0];
    const me = await call('GET', '/api/auth/me');
    assert.equal((await me.json()).user.username, 'tester');
  });

  await t.test('cross-site writes are rejected', async () => {
    const res = await call('POST', '/api/cms/faqs', { category: 'x', question: 'q', answer: 'a' }, { Origin: 'http://evil.example' });
    assert.equal(res.status, 403);
  });

  await t.test('create, update, publish filter, delete', async () => {
    const created = await (await call('POST', '/api/cms/announcements', { title: 'T', content: 'C', date: '2026-01-01' })).json();
    assert.equal(created.published, true);
    const updated = await (await call('PUT', `/api/cms/announcements/${created.id}`, { published: false })).json();
    assert.equal(updated.published, false);
    const content = await (await call('GET', '/api/kiosk/content')).json();
    assert.equal(content.announcements.length, 0);
    assert.equal((await call('DELETE', `/api/cms/announcements/${created.id}`)).status, 204);
    assert.equal((await call('DELETE', `/api/cms/announcements/${created.id}`)).status, 404);
  });

  await t.test('validation errors are per field', async () => {
    const res = await call('POST', '/api/cms/qr-links', { name: '', url: 'http://x' });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.errors.name && body.errors.url);
  });

  await t.test('audit log records the change', async () => {
    const { rows } = await pool.query("SELECT action, entity FROM audit_log WHERE entity = 'announcement' ORDER BY id");
    assert.deepEqual(rows.map((r) => r.action), ['create', 'update', 'delete']);
  });

  await t.test('image upload and retrieval', { skip: !state.storageReady && 'no object store' }, async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    const form = new FormData();
    form.append('file', new Blob([png], { type: 'image/png' }), 'dot.png');
    const up = await fetch(`${base}/api/cms/media`, { method: 'POST', headers: { Cookie: cookie }, body: form });
    assert.equal(up.status, 201);
    const media = await up.json();
    const get = await fetch(`${base}${media.url}`);
    assert.equal(get.status, 200);
    assert.equal(get.headers.get('content-type'), 'image/png');
    assert.equal(Buffer.compare(Buffer.from(await get.arrayBuffer()), png), 0);

    const fake = new FormData();
    fake.append('file', new Blob([Buffer.from('<svg/>')], { type: 'image/png' }), 'fake.png');
    assert.equal((await fetch(`${base}/api/cms/media`, { method: 'POST', headers: { Cookie: cookie }, body: fake })).status, 400);

    const floor = await (await call('POST', '/api/cms/floors', { name: 'F', mapImageId: media.id })).json();
    assert.equal((await call('DELETE', `/api/cms/media/${media.id}`)).status, 409);
    await call('DELETE', `/api/cms/floors/${floor.id}`);
    assert.equal((await call('DELETE', `/api/cms/media/${media.id}`)).status, 204);
    assert.equal((await fetch(`${base}${media.url}`)).status, 404);
  });

  await t.test('last admin is protected', async () => {
    const res = await call('PUT', '/api/cms/users/1', { role: 'editor' });
    assert.equal(res.status, 409);
  });

  await t.test('logout invalidates the session', async () => {
    assert.equal((await call('POST', '/api/auth/logout')).status, 204);
    assert.equal((await call('GET', '/api/auth/me')).status, 401);
  });
});
