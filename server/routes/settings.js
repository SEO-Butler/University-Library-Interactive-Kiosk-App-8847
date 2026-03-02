import { Router } from 'express';
import { getAll, getOne, run } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = getAll('SELECT * FROM kiosk_settings');
  const parsed = rows.map(row => ({
    ...row,
    setting_value: JSON.parse(row.setting_value)
  }));
  res.json(parsed);
});

router.put('/:key', (req, res) => {
  const { setting_value } = req.body;
  const now = new Date().toISOString();
  run('UPDATE kiosk_settings SET setting_value = ?, updated_at = ? WHERE setting_key = ?',
    [JSON.stringify(setting_value), now, req.params.key]);
  const row = getOne('SELECT * FROM kiosk_settings WHERE setting_key = ?', [req.params.key]);
  const parsed = { ...row, setting_value: JSON.parse(row.setting_value) };
  res.json([parsed]);
});

export default router;
