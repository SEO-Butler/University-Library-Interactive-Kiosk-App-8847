import { Router } from 'express';
import { audit } from '../lib/audit.js';
import { notFound } from '../lib/errors.js';
import { insertSql, toCamel, updateSql } from '../lib/rows.js';
import {
  ANNOUNCEMENT_TYPES,
  LOCATION_TYPES,
  PRIORITIES,
  ROLES,
  SETTINGS_VALIDATORS,
  MIN_IDLE_TIMEOUT,
  MAX_IDLE_TIMEOUT,
  parseId,
  validateAnnouncement,
  validateFaq,
  validateFloor,
  validateLocation,
  validateQrLink
} from '../validation.js';
import { mediaUrl } from './media.js';

const presentAnnouncement = (row) => ({ ...toCamel(row), imageUrl: mediaUrl(row.image_id) });
const presentFloor = (row) => ({ ...toCamel(row), mapImageUrl: mediaUrl(row.map_image_id) });
const presentLocation = (row) => {
  const { xPosition, yPosition, ...rest } = toCamel(row);
  return { ...rest, x: xPosition, y: yPosition };
};

// Signed-in CMS users manage content here. Every mutation is written to the audit log.
export function cmsRoutes({ pool, config, auth, mediaRouter, usersRouter, storage, state }) {
  const router = Router();
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.use(auth.attachUser, auth.requireAuth);

  const entities = {
    announcements: {
      table: 'announcements', label: 'announcement', present: presentAnnouncement,
      order: 'date DESC, id DESC', validate: validateAnnouncement
    },
    faqs: {
      table: 'faqs', label: 'faq', present: toCamel,
      order: 'category, sort_order, id', validate: validateFaq
    },
    'qr-links': {
      table: 'qr_links', label: 'qr_link', present: toCamel,
      order: 'sort_order, name, id',
      validate: (input, options) => validateQrLink(input, { ...options, allowedHosts: config.qrAllowedHosts })
    },
    floors: {
      table: 'floors', label: 'floor', present: presentFloor,
      order: 'sort_order, id', validate: validateFloor
    },
    locations: {
      table: 'locations', label: 'location', present: presentLocation,
      order: 'floor_id, sort_order, name, id', validate: validateLocation, filter: { query: 'floorId', column: 'floor_id' }
    }
  };

  for (const [path, entity] of Object.entries(entities)) {
    const { table, label, present, order, validate, filter } = entity;

    router.get(`/${path}`, async (req, res) => {
      const params = [];
      let where = '';
      if (filter && req.query[filter.query] !== undefined) {
        params.push(parseId(req.query[filter.query]));
        where = `WHERE ${filter.column} = $1`;
      }
      const { rows } = await pool.query(`SELECT * FROM ${table} ${where} ORDER BY ${order}`, params);
      res.json(rows.map(present));
    });

    router.get(`/${path}/:id`, async (req, res) => {
      const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [parseId(req.params.id)]);
      if (!rows[0]) throw notFound();
      res.json(present(rows[0]));
    });

    router.post(`/${path}`, async (req, res) => {
      const data = validate(req.body);
      const { rows } = await pool.query(insertSql(table, data));
      await audit(pool, req, 'create', label, rows[0].id, summarise(rows[0]));
      res.status(201).json(present(rows[0]));
    });

    router.put(`/${path}/:id`, async (req, res) => {
      const id = parseId(req.params.id);
      const data = validate(req.body, { partial: true });
      if (Object.keys(data).length === 0) {
        const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        if (!rows[0]) throw notFound();
        return res.json(present(rows[0]));
      }
      const { rows } = await pool.query(updateSql(table, id, data));
      if (!rows[0]) throw notFound();
      await audit(pool, req, 'update', label, id, summarise(rows[0]));
      res.json(present(rows[0]));
    });

    router.delete(`/${path}/:id`, async (req, res) => {
      const id = parseId(req.params.id);
      const { rows } = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
      if (!rows[0]) throw notFound();
      await audit(pool, req, 'delete', label, id, summarise(rows[0]));
      res.status(204).end();
    });
  }

  // Floors with their locations nested: what the map editor needs in one call.
  router.get('/map', async (req, res) => {
    const [floors, locations] = await Promise.all([
      pool.query('SELECT * FROM floors ORDER BY sort_order, id'),
      pool.query('SELECT * FROM locations ORDER BY floor_id, sort_order, name, id')
    ]);
    const byFloor = new Map(floors.rows.map((row) => [row.id, { ...presentFloor(row), locations: [] }]));
    for (const row of locations.rows) byFloor.get(row.floor_id)?.locations.push(presentLocation(row));
    res.json([...byFloor.values()]);
  });

  router.get('/settings', async (req, res) => {
    const { rows } = await pool.query('SELECT setting_key, setting_value, updated_at FROM kiosk_settings');
    res.json(Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value])));
  });

  router.put('/settings/:key', async (req, res) => {
    const validate = SETTINGS_VALIDATORS[req.params.key];
    if (!validate) throw notFound('Unknown settings group');
    const value = validate(req.body);
    await pool.query(
      `INSERT INTO kiosk_settings (setting_key, setting_value, updated_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value,
         updated_at = now(), updated_by = EXCLUDED.updated_by`,
      [req.params.key, JSON.stringify(value), req.user.id]
    );
    await audit(pool, req, 'update', 'settings', req.params.key, value);
    res.json(value);
  });

  // Static lists the CMS forms need.
  router.get('/meta', (req, res) => {
    res.json({
      announcementTypes: ANNOUNCEMENT_TYPES,
      priorities: PRIORITIES,
      locationTypes: LOCATION_TYPES,
      roles: ROLES,
      qrAllowedHosts: config.qrAllowedHosts,
      idleTimeout: { min: MIN_IDLE_TIMEOUT, max: MAX_IDLE_TIMEOUT },
      maxUploadBytes: config.maxUploadBytes,
      version: config.version
    });
  });

  router.get('/dashboard', async (req, res) => {
    const [counts, categories, recent] = await Promise.all([
      pool.query(
        `SELECT (SELECT count(*) FROM announcements) AS announcements,
                (SELECT count(*) FROM announcements
                  WHERE published AND (expires_on IS NULL OR expires_on >= current_date)) AS live_announcements,
                (SELECT count(*) FROM faqs) AS faqs,
                (SELECT count(*) FROM qr_links) AS qr_links,
                (SELECT count(*) FROM floors) AS floors,
                (SELECT count(*) FROM locations) AS locations,
                (SELECT count(*) FROM media) AS media,
                (SELECT coalesce(sum(size_bytes), 0) FROM media) AS media_bytes,
                (SELECT count(*) FROM cms_users WHERE is_active) AS users,
                (SELECT max(t) FROM (
                   SELECT max(updated_at) t FROM announcements UNION ALL
                   SELECT max(updated_at) FROM faqs UNION ALL
                   SELECT max(updated_at) FROM qr_links UNION ALL
                   SELECT max(updated_at) FROM floors UNION ALL
                   SELECT max(updated_at) FROM locations UNION ALL
                   SELECT max(updated_at) FROM kiosk_settings) x) AS last_content_change`
      ),
      pool.query('SELECT DISTINCT category FROM faqs ORDER BY category'),
      pool.query(
        `SELECT id, username, action, entity, entity_id, details, at
           FROM audit_log ORDER BY at DESC LIMIT 20`
      )
    ]);
    let storageOk = state.storageReady;
    if (storageOk) {
      try {
        await storage.ping();
      } catch {
        storageOk = false;
      }
    }
    res.json({
      counts: toCamel(counts.rows[0]),
      faqCategories: categories.rows.map((row) => row.category),
      recentActivity: toCamel(recent.rows),
      health: { db: 'ok', storage: storageOk ? 'ok' : 'down', version: config.version }
    });
  });

  router.use('/media', mediaRouter);
  router.use('/users', auth.requireRole('admin'), usersRouter);

  return router;
}

// A short description of a row for the audit log (no long bodies).
function summarise(row) {
  const out = {};
  for (const key of ['title', 'name', 'question', 'category', 'type', 'published', 'floor_id']) {
    if (row[key] !== undefined) out[key] = typeof row[key] === 'string' ? row[key].slice(0, 120) : row[key];
  }
  return out;
}
