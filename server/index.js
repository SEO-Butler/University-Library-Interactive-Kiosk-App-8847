import { loadConfig } from './config.js';
import { createPool } from './db/pool.js';
import { migrate } from './db/migrate.js';
import { ensureDefaultSettings } from './db/seed.js';
import { createStorage } from './storage.js';
import { createSessionStore } from './auth/sessions.js';
import { hashPassword, validatePasswordStrength } from './auth/passwords.js';
import { createApp } from './app.js';

const log = (...args) => console.log(new Date().toISOString(), ...args);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const config = loadConfig();
const state = { ready: false, storageReady: false, dbConfigured: Boolean(config.databaseUrl) };

const pool = config.databaseUrl ? createPool(config) : null;
const storage = createStorage(config);
const sessions = createSessionStore(pool ?? { query: async () => ({ rows: [] }) }, config.session);

// Creates the first admin account from CMS_ADMIN_PASSWORD while there are no users.
async function bootstrapAdmin() {
  const { rows } = await pool.query('SELECT count(*) AS n FROM cms_users');
  if (Number(rows[0].n) > 0) return;
  const { username, password } = config.bootstrapAdmin;
  if (!password) {
    log('No CMS users exist yet. Create one with: node cli.js create-user admin --role admin');
    return;
  }
  const weak = validatePasswordStrength(password);
  if (weak) {
    log(`CMS_ADMIN_PASSWORD rejected: ${weak}`);
    return;
  }
  await pool.query(
    "INSERT INTO cms_users (username, display_name, role, password_hash) VALUES ($1, 'Administrator', 'admin', $2)",
    [username, await hashPassword(password)]
  );
  log(`Created initial CMS admin '${username}' from CMS_ADMIN_PASSWORD`);
}

// The HTTP server starts straight away so the kiosk can show cached content while
// Postgres and the object store come up (or are still being installed).
async function waitForDatabase() {
  if (!pool) {
    log('DATABASE_URL is not set: serving static files only. See deploy/pi/README.md.');
    return;
  }
  for (let attempt = 1; ; attempt++) {
    try {
      await migrate(pool, log);
      await ensureDefaultSettings(pool);
      await bootstrapAdmin();
      state.ready = true;
      log('database ready');
      return;
    } catch (error) {
      if (attempt <= 5 || attempt % 12 === 0) log(`database not ready (attempt ${attempt}): ${error.message}`);
      await sleep(5000);
    }
  }
}

async function waitForStorage() {
  for (let attempt = 1; ; attempt++) {
    try {
      await storage.ensureBucket();
      state.storageReady = true;
      log(`object storage ready (bucket '${storage.bucket}' at ${config.s3.endpoint})`);
      return;
    } catch (error) {
      if (attempt <= 5 || attempt % 12 === 0) log(`object storage not ready (attempt ${attempt}): ${error.message}`);
      await sleep(5000);
    }
  }
}

const app = createApp({ config, pool, storage, sessions, state, log });
const server = app.listen(config.port, config.host, () => {
  log(`kiosk server listening on http://${config.host}:${config.port} (static: ${config.staticDir || 'off'})`);
});

waitForDatabase();
waitForStorage();

const purgeTimer = setInterval(() => {
  if (state.ready) sessions.purgeExpired().catch((error) => log('session purge failed:', error.message));
}, 60 * 60 * 1000);
purgeTimer.unref();

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log(`${signal} received, shutting down`);
  const force = setTimeout(() => process.exit(1), 5000);
  force.unref();
  server.close(async () => {
    try {
      await pool?.end();
    } finally {
      storage.destroy();
      process.exit(0);
    }
  });
  server.closeIdleConnections?.();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => log('unhandled rejection:', reason?.stack ?? reason));
