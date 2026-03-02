import { Router } from 'express';
import { getAll, getOne, run } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = getAll('SELECT * FROM qr_links_kiosk ORDER BY name');
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, url, description } = req.body;
  const lastId = run('INSERT INTO qr_links_kiosk (name, url, description) VALUES (?, ?, ?)',
    [name, url, description]);
  const row = getOne('SELECT * FROM qr_links_kiosk WHERE id = ?', [lastId]);
  res.json([row]);
});

router.put('/:id', (req, res) => {
  const { name, url, description } = req.body;
  run('UPDATE qr_links_kiosk SET name = ?, url = ?, description = ? WHERE id = ?',
    [name, url, description, req.params.id]);
  const row = getOne('SELECT * FROM qr_links_kiosk WHERE id = ?', [req.params.id]);
  res.json([row]);
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM qr_links_kiosk WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

export default router;
