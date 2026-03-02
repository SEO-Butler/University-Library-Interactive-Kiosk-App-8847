import { Router } from 'express';
import { getAll } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = getAll('SELECT * FROM library_floors_kiosk ORDER BY id');
  res.json(rows);
});

export default router;
