import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';
import announcementsRouter from './routes/announcements.js';
import faqsRouter from './routes/faqs.js';
import qrLinksRouter from './routes/qrLinks.js';
import floorsRouter from './routes/floors.js';
import locationsRouter from './routes/locations.js';
import settingsRouter from './routes/settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/announcements', announcementsRouter);
app.use('/api/faqs', faqsRouter);
app.use('/api/qr-links', qrLinksRouter);
app.use('/api/floors', floorsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/settings', settingsRouter);

// In production, serve the built React app
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Initialize database, seed, then start server
async function start() {
  await initDatabase();
  seedDatabase();
  app.listen(PORT, () => {
    console.log(`Kiosk server running on http://localhost:${PORT}`);
  });
}

start();
