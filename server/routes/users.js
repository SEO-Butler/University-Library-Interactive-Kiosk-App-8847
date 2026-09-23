import { Router } from 'express';
import { audit } from '../lib/audit.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { toCamel, updateSql } from '../lib/rows.js';
import { hashPassword, validatePasswordStrength } from '../auth/passwords.js';
import { parseId, validateUser, validateUsername } from '../validation.js';

const USER_COLUMNS = 'id, username, display_name, role, is_active, created_at, last_login_at';

// Admin-only account management. Guards keep at least one active admin at all times.
export function usersRoutes({ pool, sessions }) {
  const router = Router();

  async function activeAdminCount(excludeId) {
    const { rows } = await pool.query(
      "SELECT count(*) AS n FROM cms_users WHERE role = 'admin' AND is_active AND id <> $1",
      [excludeId]
    );
    return Number(rows[0].n);
  }

  router.get('/', async (req, res) => {
    const { rows } = await pool.query(`SELECT ${USER_COLUMNS} FROM cms_users ORDER BY username`);
    res.json(toCamel(rows));
  });

  router.post('/', async (req, res) => {
    const username = validateUsername(req.body?.username);
    const data = validateUser(req.body);
    const password = String(req.body?.password ?? '');
    const weak = validatePasswordStrength(password);
    if (weak) throw badRequest(weak, { errors: { password: weak } });

    const { rows: existing } = await pool.query('SELECT 1 FROM cms_users WHERE username = $1', [username]);
    if (existing.length) throw conflict('That username is already taken');

    const { rows } = await pool.query(
      `INSERT INTO cms_users (username, display_name, role, is_active, password_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${USER_COLUMNS}`,
      [username, data.display_name, data.role, data.is_active, await hashPassword(password)]
    );
    await audit(pool, req, 'create', 'user', rows[0].id, { username, role: data.role });
    res.status(201).json(toCamel(rows[0]));
  });

  router.put('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const data = validateUser(req.body, { partial: true });
    const { rows: current } = await pool.query(`SELECT ${USER_COLUMNS} FROM cms_users WHERE id = $1`, [id]);
    if (!current[0]) throw notFound();

    const becomesNonAdmin = data.role !== undefined && data.role !== 'admin';
    const becomesInactive = data.is_active === false;
    if (current[0].role === 'admin' && current[0].is_active && (becomesNonAdmin || becomesInactive)) {
      if ((await activeAdminCount(id)) === 0) throw conflict('There must always be at least one active admin');
    }
    if (id === req.user.id && (becomesNonAdmin || becomesInactive)) {
      throw conflict('You cannot remove your own admin access');
    }

    if (Object.keys(data).length === 0) return res.json(toCamel(current[0]));
    const { rows } = await pool.query(updateSql('cms_users', id, data));
    if (data.is_active === false) await sessions.destroyAllForUser(id);
    await audit(pool, req, 'update', 'user', id, data);
    const { password_hash, updated_at, ...safe } = rows[0];
    res.json(toCamel(safe));
  });

  router.post('/:id/password', async (req, res) => {
    const id = parseId(req.params.id);
    const password = String(req.body?.password ?? '');
    const weak = validatePasswordStrength(password);
    if (weak) throw badRequest(weak, { errors: { password: weak } });
    const { rowCount } = await pool.query('UPDATE cms_users SET password_hash = $2 WHERE id = $1', [id, await hashPassword(password)]);
    if (!rowCount) throw notFound();
    await sessions.destroyAllForUser(id, id === req.user.id ? req.sessionToken : null);
    await audit(pool, req, 'password_reset', 'user', id);
    res.status(204).end();
  });

  router.delete('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (id === req.user.id) throw conflict('You cannot delete your own account');
    const { rows } = await pool.query('SELECT username, role, is_active FROM cms_users WHERE id = $1', [id]);
    if (!rows[0]) throw notFound();
    if (rows[0].role === 'admin' && rows[0].is_active && (await activeAdminCount(id)) === 0) {
      throw conflict('There must always be at least one active admin');
    }
    await pool.query('DELETE FROM cms_users WHERE id = $1', [id]);
    await audit(pool, req, 'delete', 'user', id, { username: rows[0].username });
    res.status(204).end();
  });

  return router;
}
