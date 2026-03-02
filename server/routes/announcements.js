import { Router } from 'express';
import { getAll, getOne, run } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = getAll('SELECT * FROM announcements_kiosk ORDER BY date DESC');
  res.json(rows);
});

router.post('/', (req, res) => {
  const { title, content, type, date, priority } = req.body;
  const lastId = run('INSERT INTO announcements_kiosk (title, content, type, date, priority) VALUES (?, ?, ?, ?, ?)',
    [title, content, type, date, priority]);
  const row = getOne('SELECT * FROM announcements_kiosk WHERE id = ?', [lastId]);
  res.json([row]);
});

router.put('/:id', (req, res) => {
  const { title, content, type, date, priority } = req.body;
  run('UPDATE announcements_kiosk SET title = ?, content = ?, type = ?, date = ?, priority = ? WHERE id = ?',
    [title, content, type, date, priority, req.params.id]);
  const row = getOne('SELECT * FROM announcements_kiosk WHERE id = ?', [req.params.id]);
  res.json([row]);
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM announcements_kiosk WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

export default router;
