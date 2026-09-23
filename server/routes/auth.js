import { Router } from 'express';
import { audit } from '../lib/audit.js';
import { badRequest, unauthorized } from '../lib/errors.js';
import { dummyHash, hashPassword, validatePasswordStrength, verifyPassword } from '../auth/passwords.js';

function publicUser(row) {
  return { id: row.id, username: row.username, displayName: row.display_name, role: row.role };
}

export function authRoutes({ pool, sessions, auth, limiter }) {
  const router = Router();
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.use(auth.attachUser);

  router.post('/login', async (req, res) => {
    const username = String(req.body?.username ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    if (!username || !password) throw badRequest('Enter your username and password');
    limiter.check(req.ip, username);

    const { rows } = await pool.query(
      'SELECT id, username, display_name, role, is_active, password_hash FROM cms_users WHERE username = $1',
      [username]
    );
    const user = rows[0];
    // Always run a hash comparison so the response time does not reveal whether
    // the username exists.
    const passwordOk = await verifyPassword(password, user ? user.password_hash : await dummyHash());

    if (!user || !passwordOk || !user.is_active) {
      limiter.recordFailure(req.ip, username);
      await audit(pool, req, 'login_failed', 'user', user?.id ?? null, { username });
      const disabled = user && passwordOk && !user.is_active;
      throw unauthorized(disabled ? 'This account has been disabled' : 'Incorrect username or password');
    }

    const token = await sessions.create(user.id, { ip: req.ip, userAgent: req.get('user-agent') });
    limiter.recordSuccess(req.ip, username);
    await pool.query('UPDATE cms_users SET last_login_at = now() WHERE id = $1', [user.id]);
    req.user = publicUser(user);
    await audit(pool, req, 'login', 'user', user.id);
    res.cookie(auth.cookieName, token, auth.cookieOptions());
    res.json({ user: req.user });
  });

  router.post('/logout', async (req, res) => {
    if (req.sessionToken) await sessions.destroy(req.sessionToken);
    if (req.user) await audit(pool, req, 'logout', 'user', req.user.id);
    const { maxAge, ...clearOptions } = auth.cookieOptions();
    res.clearCookie(auth.cookieName, clearOptions);
    res.status(204).end();
  });

  router.get('/me', (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ user: req.user });
  });

  router.post('/password', auth.requireAuth, async (req, res) => {
    const currentPassword = String(req.body?.currentPassword ?? '');
    const newPassword = String(req.body?.newPassword ?? '');
    const weak = validatePasswordStrength(newPassword);
    if (weak) throw badRequest(weak, { errors: { newPassword: weak } });

    const { rows } = await pool.query('SELECT password_hash FROM cms_users WHERE id = $1', [req.user.id]);
    if (!rows[0] || !(await verifyPassword(currentPassword, rows[0].password_hash))) {
      throw badRequest('Your current password is incorrect', { errors: { currentPassword: 'Incorrect password' } });
    }
    await pool.query('UPDATE cms_users SET password_hash = $2 WHERE id = $1', [req.user.id, await hashPassword(newPassword)]);
    // Other devices have to sign in again with the new password.
    await sessions.destroyAllForUser(req.user.id, req.sessionToken);
    await audit(pool, req, 'password_change', 'user', req.user.id);
    res.status(204).end();
  });

  return router;
}
