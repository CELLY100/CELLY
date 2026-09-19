import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { dbService } from './server/db.ts';
import { cloudBeatStore } from './server/cloudBeatStore.ts';
import { apiRouter } from './server/routes.ts';
import { ensureSampleAudioFiles } from './server/audioGenerator.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON and urlencoded requests
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize SQLite Database & Tables
  await dbService.init();

  // Initialize Persistent Cloud Beat Store (Firestore)
  await cloudBeatStore.init();

  // Ensure public audio previews exist
  const publicAudioDir = path.join(process.cwd(), 'public', 'audio');
  ensureSampleAudioFiles(publicAudioDir);

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static audio and uploads
  app.use('/audio', express.static(publicAudioDir));
  app.use('/uploads', express.static(uploadsDir));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CELLY Producer & Mastering API',
      timestamp: new Date().toISOString(),
      database: 'SQLite (Persistent ACID)',
      supportEmail: 'wspcelly@gmail.com',
      producerCredit: 'Prod. by Celly',
    });
  });

  // Mount API router
  app.use('/api', apiRouter);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CELLY Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CELLY server:', err);
  process.exit(1);
});
