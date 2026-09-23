import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Router } from 'express';
import multer from 'multer';
import { audit } from '../lib/audit.js';
import { badRequest, conflict, notFound, HttpError } from '../lib/errors.js';
import { toCamel } from '../lib/rows.js';
import { isUuid } from '../validation.js';

export function mediaUrl(id) {
  return id ? `/api/media/${id}` : null;
}

// The file's real type is taken from its first bytes, never from the upload's name
// or declared content type. SVG is deliberately excluded (it can carry scripts).
const SIGNATURES = [
  {
    type: 'image/png', ext: 'png',
    test: (b) => b.length > 8 && b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(4) === 0x0d0a1a0a
  },
  { type: 'image/jpeg', ext: 'jpg', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/gif', ext: 'gif', test: (b) => b.length > 6 && b.toString('ascii', 0, 4) === 'GIF8' },
  {
    type: 'image/webp', ext: 'webp',
    test: (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'
  }
];

export function detectImage(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  return SIGNATURES.find((signature) => signature.test(buffer)) ?? null;
}

const USAGE_SQL = `(SELECT count(*) FROM announcements a WHERE a.image_id = m.id)
                 + (SELECT count(*) FROM floors f WHERE f.map_image_id = m.id)`;

export function createMediaRoutes({ pool, storage, config, state }) {
  // Media rows never change once written, so a small cache saves a query per image.
  const cache = new Map();
  async function findMedia(id) {
    if (cache.has(id)) return cache.get(id);
    const { rows } = await pool.query(
      'SELECT id, object_key, content_type, size_bytes FROM media WHERE id = $1',
      [id]
    );
    const row = rows[0] ?? null;
    if (row) {
      if (cache.size >= 500) cache.delete(cache.keys().next().value);
      cache.set(id, row);
    }
    return row;
  }

  // Public: streams an image to the kiosk or CMS. Ids are unique per upload, so
  // responses can be cached for a long time.
  const publicRouter = Router();
  publicRouter.get('/:id', async (req, res) => {
    const id = String(req.params.id).toLowerCase();
    if (!isUuid(id)) throw notFound();
    const media = await findMedia(id);
    if (!media) throw notFound();
    const object = await storage.get(media.object_key);
    if (!object) throw notFound();

    res.set({
      'Content-Type': media.content_type,
      'Content-Length': String(object.contentLength ?? media.size_bytes),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline'
    });
    if (object.etag) res.set('ETag', object.etag);

    if (req.method === 'HEAD') {
      object.body.destroy?.();
      return res.end();
    }
    try {
      await pipeline(object.body, res);
    } catch (error) {
      // The visitor navigated away mid-download, or the store dropped the stream.
      object.body.destroy?.();
      if (!res.headersSent) throw error;
      res.destroy();
    }
  });

  // CMS: upload, list and delete images.
  const cmsRouter = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.maxUploadBytes, files: 1 }
  });

  cmsRouter.get('/', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT m.id, m.content_type, m.size_bytes, m.original_name, m.created_at,
              u.username AS uploaded_by, ${USAGE_SQL} AS usage_count
         FROM media m
         LEFT JOIN cms_users u ON u.id = m.uploaded_by
        ORDER BY m.created_at DESC`
    );
    res.json(rows.map((row) => ({ ...toCamel(row), url: mediaUrl(row.id) })));
  });

  cmsRouter.post('/', upload.single('file'), async (req, res) => {
    if (!state.storageReady) throw new HttpError(503, 'Object storage is not reachable right now');
    if (!req.file) throw badRequest('Choose an image file to upload');
    const kind = detectImage(req.file.buffer);
    if (!kind) throw badRequest('Only PNG, JPEG, GIF and WebP images are accepted');

    const id = randomUUID();
    const key = `media/${id}.${kind.ext}`;
    await storage.put(key, req.file.buffer, kind.type);
    const { rows } = await pool.query(
      `INSERT INTO media (id, object_key, content_type, size_bytes, original_name, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, content_type, size_bytes, original_name, created_at`,
      [id, key, kind.type, req.file.size, String(req.file.originalname ?? '').slice(0, 200), req.user.id]
    );
    await audit(pool, req, 'upload', 'media', id, { name: req.file.originalname, size: req.file.size });
    res.status(201).json({ ...toCamel(rows[0]), url: mediaUrl(id), usageCount: 0 });
  });

  cmsRouter.delete('/:id', async (req, res) => {
    const id = String(req.params.id).toLowerCase();
    if (!isUuid(id)) throw notFound();
    const { rows } = await pool.query(
      `SELECT m.object_key, ${USAGE_SQL} AS usage_count FROM media m WHERE m.id = $1`,
      [id]
    );
    if (!rows[0]) throw notFound();
    if (Number(rows[0].usage_count) > 0) {
      throw conflict('This image is still in use. Remove it from the announcement or floor first.');
    }
    await pool.query('DELETE FROM media WHERE id = $1', [id]);
    cache.delete(id);
    try {
      await storage.remove(rows[0].object_key);
    } catch (error) {
      console.error(`[media] could not delete object ${rows[0].object_key}:`, error.message);
    }
    await audit(pool, req, 'delete', 'media', id);
    res.status(204).end();
  });

  return { publicRouter, cmsRouter };
}
