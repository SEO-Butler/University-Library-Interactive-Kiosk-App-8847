import { Router } from 'express';
import { getAll, getOne, run } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = getAll('SELECT * FROM faqs_kiosk ORDER BY category');
  res.json(rows);
});

router.post('/', (req, res) => {
  const { category, question, answer } = req.body;
  const lastId = run('INSERT INTO faqs_kiosk (category, question, answer) VALUES (?, ?, ?)',
    [category, question, answer]);
  const row = getOne('SELECT * FROM faqs_kiosk WHERE id = ?', [lastId]);
  res.json([row]);
});

router.put('/:id', (req, res) => {
  const { category, question, answer } = req.body;
  run('UPDATE faqs_kiosk SET category = ?, question = ?, answer = ? WHERE id = ?',
    [category, question, answer, req.params.id]);
  const row = getOne('SELECT * FROM faqs_kiosk WHERE id = ?', [req.params.id]);
  res.json([row]);
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM faqs_kiosk WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

export default router;
