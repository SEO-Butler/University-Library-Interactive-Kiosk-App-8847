import { randomBytes, createHash } from 'node:crypto';

// Sliding expiry: a session stays valid while it is used, and is refreshed at most
// once every few minutes to avoid a write on every request.
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function createSessionStore(pool, { ttlHours }) {
  const ttl = `${ttlHours} hours`;

  return {
    ttlMs: ttlHours * 60 * 60 * 1000,

    async create(userId, { ip, userAgent } = {}) {
      const token = randomBytes(32).toString('base64url');
      await pool.query(
        `INSERT INTO cms_sessions (token_hash, user_id, expires_at, ip, user_agent)
         VALUES ($1, $2, now() + $3::interval, $4, $5)`,
        [hashToken(token), userId, ttl, ip ?? null, String(userAgent ?? '').slice(0, 300)]
      );
      return token;
    },

    // Returns the signed-in user for a cookie token, or null.
    async lookup(token) {
      if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
      const tokenHash = hashToken(token);
      const { rows } = await pool.query(
        `SELECT s.last_seen_at, u.id, u.username, u.display_name, u.role, u.is_active
           FROM cms_sessions s
           JOIN cms_users u ON u.id = s.user_id
          WHERE s.token_hash = $1 AND s.expires_at > now()`,
        [tokenHash]
      );
      const row = rows[0];
      if (!row || !row.is_active) return null;
      if (Date.now() - new Date(row.last_seen_at).getTime() > TOUCH_INTERVAL_MS) {
        pool
          .query(
            `UPDATE cms_sessions SET last_seen_at = now(), expires_at = now() + $2::interval
              WHERE token_hash = $1`,
            [tokenHash, ttl]
          )
          .catch((error) => console.error('[sessions] touch failed:', error.message));
      }
      return { id: row.id, username: row.username, displayName: row.display_name, role: row.role };
    },

    async destroy(token) {
      if (typeof token !== 'string' || !token) return;
      await pool.query('DELETE FROM cms_sessions WHERE token_hash = $1', [hashToken(token)]);
    },

    // Signs a user out everywhere, optionally keeping the current session.
    async destroyAllForUser(userId, keepToken = null) {
      await pool.query(
        'DELETE FROM cms_sessions WHERE user_id = $1 AND ($2::text IS NULL OR token_hash <> $2)',
        [userId, keepToken ? hashToken(keepToken) : null]
      );
    },

    async purgeExpired() {
      const { rowCount } = await pool.query('DELETE FROM cms_sessions WHERE expires_at < now()');
      return rowCount;
    }
  };
}
