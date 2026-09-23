import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function bool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function int(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

function list(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

// All runtime settings come from the environment (systemd loads ~/kiosk/kiosk.conf and
// ~/kiosk/kiosk.env; docker-compose and .env do the same for development).
export function loadConfig(env = process.env) {
  return {
    host: env.HOST || '127.0.0.1',
    port: int(env.PORT, 8080),
    trustProxy: bool(env.TRUST_PROXY, false),
    databaseUrl: env.DATABASE_URL || '',
    // Built kiosk + CMS (Vite output). Empty string disables static hosting (API only).
    staticDir: env.STATIC_DIR === '' ? '' : path.resolve(env.STATIC_DIR || path.join(here, '..', 'dist')),
    s3: {
      endpoint: env.S3_ENDPOINT || 'http://127.0.0.1:9000',
      region: env.S3_REGION || 'us-east-1',
      accessKey: env.S3_ACCESS_KEY || '',
      secretKey: env.S3_SECRET_KEY || '',
      bucket: env.S3_BUCKET || 'kiosk-media',
      forcePathStyle: bool(env.S3_FORCE_PATH_STYLE, true)
    },
    session: {
      cookieName: env.SESSION_COOKIE_NAME || 'kiosk_cms_session',
      ttlHours: Math.max(1, int(env.SESSION_TTL_HOURS, 12)),
      // Set COOKIE_SECURE=true when the CMS is served over https (e.g. behind a proxy).
      secureCookie: bool(env.COOKIE_SECURE, false)
    },
    // Hosts allowed in QR links (subdomains included). Empty = any https URL.
    qrAllowedHosts: list(env.QR_ALLOWED_HOSTS),
    maxUploadBytes: Math.max(1, int(env.MAX_UPLOAD_MB, 10)) * 1024 * 1024,
    // First admin account, created only while the users table is empty.
    bootstrapAdmin: {
      username: (env.CMS_ADMIN_USER || 'admin').trim().toLowerCase(),
      password: env.CMS_ADMIN_PASSWORD || ''
    },
    version: env.APP_VERSION || env.KIOSK_COMMIT || 'dev'
  };
}
