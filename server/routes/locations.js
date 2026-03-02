import { Router } from 'express';
import { getAll } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = getAll('SELECT * FROM library_locations_kiosk ORDER BY floor_id');
  res.json(rows);
});

export default router;
