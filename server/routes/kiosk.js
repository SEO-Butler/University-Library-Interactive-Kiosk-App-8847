import { Router } from 'express';
import { toCamel } from '../lib/rows.js';
import { safeQrUrl } from '../validation.js';
import { mediaUrl } from './media.js';

// Reports whether the API, database and object store are usable. Used by the Pi
// health timer and the CMS dashboard. Works before the database is ready.
export function healthRoutes({ pool, storage, state, config }) {
  const router = Router();

  router.get('/', async (req, res) => {
    const health = {
      ok: false,
      version: config.version,
      db: state.ready ? 'ok' : state.dbConfigured ? 'starting' : 'unconfigured',
      storage: state.storageReady ? 'ok' : 'starting',
      uptimeSeconds: Math.round(process.uptime())
    };
    if (pool) {
      try {
        await pool.query('SELECT 1');
      } catch {
        health.db = 'down';
      }
    }
    try {
      await storage.ping();
    } catch {
      health.storage = state.storageReady ? 'down' : 'starting';
    }
    health.ok = health.db === 'ok' && health.storage === 'ok';
    res.status(health.ok ? 200 : 503).set('Cache-Control', 'no-store').json(health);
  });

  return router;
}

// Everything the kiosk screen needs, in one request. Only published, unexpired
// content is included. Express adds an ETag, so an unchanged bundle costs a 304.
export function kioskRoutes({ pool, config }) {
  const router = Router();

  router.get('/content', async (req, res) => {
    const [announcements, faqs, qrLinks, floors, locations, settings] = await Promise.all([
      pool.query(
        `SELECT id, title, content, type, date, priority, image_id
           FROM announcements
          WHERE published AND (expires_on IS NULL OR expires_on >= current_date)
          ORDER BY date DESC, id DESC`
      ),
      pool.query(
        `SELECT id, category, question, answer FROM faqs
          WHERE published ORDER BY category, sort_order, id`
      ),
      pool.query(
        `SELECT id, name, url, description FROM qr_links
          WHERE published ORDER BY sort_order, name, id`
      ),
      pool.query(`SELECT id, name, map_image_id FROM floors WHERE published ORDER BY sort_order, id`),
      pool.query(
        `SELECT l.id, l.floor_id, l.name, l.type, l.x_position, l.y_position, l.directions
           FROM locations l
           JOIN floors f ON f.id = l.floor_id
          WHERE f.published
          ORDER BY l.floor_id, l.sort_order, l.name, l.id`
      ),
      pool.query('SELECT setting_key, setting_value FROM kiosk_settings')
    ]);

    res.set('Cache-Control', 'no-cache').json({
      announcements: announcements.rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        type: row.type,
        date: row.date,
        priority: row.priority,
        imageUrl: mediaUrl(row.image_id)
      })),
      faqs: toCamel(faqs.rows),
      qrLinks: qrLinks.rows
        .filter((row) => safeQrUrl(row.url, config.qrAllowedHosts))
        .map(toCamel),
      floors: floors.rows.map((row) => ({
        id: row.id,
        name: row.name,
        mapImageUrl: mediaUrl(row.map_image_id)
      })),
      locations: locations.rows.map((row) => ({
        id: row.id,
        floorId: row.floor_id,
        name: row.name,
        type: row.type,
        x: row.x_position,
        y: row.y_position,
        directions: row.directions
      })),
      settings: Object.fromEntries(settings.rows.map((row) => [row.setting_key, row.setting_value]))
    });
  });

  return router;
}
