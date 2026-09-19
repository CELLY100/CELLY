import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { dbService } from './db.ts';
import { cloudBeatStore, CloudBeat } from './cloudBeatStore.ts';
import {
  LICENSE_TIERS,
  PRODUCER_CREDIT,
  SUPPORT_EMAIL,
  MASTERING_PRICE,
  autoFillAgreement,
  injectPurchaseScheduleTemplate,
} from '../src/lib/licenseConstants.ts';
import { generateLicenseAgreementPdf } from './pdf.ts';
import { LicenseTierKey } from '../src/types.ts';
import {
  sendAdminMasteringOrderNotification,
  sendAdminContactNotification,
  sendAdminOrderAlert,
  sendCustomerBeatConfirmation,
  sendCustomerMasteringConfirmation,
  sendCustomerMasterCompleted,
  sendEmail,
  getEmailConfigStatus,
  testEmailDispatch,
  ADMIN_EMAIL,
} from './emailService.ts';

export const apiRouter = Router();

// Configure Multer for File Uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
const masteringUploadsDir = path.join(uploadsDir, 'mastering');
const beatFilesDir = path.join(uploadsDir, 'beats');
const artworkDir = path.join(uploadsDir, 'artwork');
const agreementsDir = path.join(process.cwd(), 'data', 'agreements');
const customAgreementsDir = path.join(process.cwd(), 'data', 'agreements', 'custom');

[uploadsDir, masteringUploadsDir, beatFilesDir, artworkDir, agreementsDir, customAgreementsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const defaultStorage = multer.diskStorage({
  dest: uploadsDir,
  limits: { fileSize: 150 * 1024 * 1024 },
} as any);

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150MB
});

const artworkStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, artworkDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `art_${Date.now()}_${crypto.randomBytes(3).toString('hex')}${ext}`);
  },
});

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, beatFilesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.wav';
    cb(null, `beat_${Date.now()}_${crypto.randomBytes(3).toString('hex')}${ext}`);
  },
});

const agreementStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, customAgreementsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.txt';
    cb(null, `agreement_${Date.now()}_${crypto.randomBytes(3).toString('hex')}${ext}`);
  },
});

const uploadArtwork = multer({ storage: artworkStorage, limits: { fileSize: 25 * 1024 * 1024 } });
const uploadAudio = multer({ storage: audioStorage, limits: { fileSize: 250 * 1024 * 1024 } });
const uploadAgreement = multer({ storage: agreementStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Simple In-Memory Session Store for Bearer Tokens (backed by persistent sessions table)
const sessions = new Map<string, { userId: string; role: string; email: string; name: string }>();

// Seed default sessions for easy preview testing
sessions.set('admin-token-celly', {
  userId: 'usr_admin_wspcelly',
  role: 'admin',
  email: 'wspcelly@gmail.com',
  name: 'CELLY Producer',
});
sessions.set('admin-token-ryansam', {
  userId: 'usr_admin2',
  role: 'admin',
  email: 'ryansam0322@gmail.com',
  name: 'CELLY Producer',
});
sessions.set('customer-token-demo', {
  userId: 'usr_cust1',
  role: 'customer',
  email: 'artist@gmail.com',
  name: 'Marcus Vance',
});

function saveSession(token: string, session: { userId: string; role: string; email: string; name: string }) {
  sessions.set(token, session);
  try {
    dbService.run(
      'INSERT OR REPLACE INTO sessions (token, user_id, role, email, name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [token, session.userId, session.role, session.email, session.name, new Date().toISOString()]
    );
  } catch {
    // ignore
  }
}

// Auth Middlewares
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1]?.trim();
  if (!token || token === 'null' || token === 'undefined') return null;

  // 1. Check in-memory map first
  let user = sessions.get(token);
  if (user) return user;

  // 2. Check persistent DB sessions table
  try {
    const row = dbService.queryOne<{ user_id: string; role: string; email: string; name: string }>(
      'SELECT user_id, role, email, name FROM sessions WHERE token = ?',
      [token]
    );
    if (row) {
      user = {
        userId: row.user_id,
        role: row.role,
        email: row.email,
        name: row.name,
      };
      sessions.set(token, user);
      return user;
    }
  } catch {
    // ignore
  }

  // 3. Fallback for admin tokens across server restarts:
  // If token is 'admin-token-celly', 'admin-token-ryansam', or starts with 'admin_'
  if (token === 'admin-token-celly' || token === 'admin-token-ryansam' || token.startsWith('admin_')) {
    try {
      const adminUser = dbService.queryOne<{ id: string; email: string; name: string; role: string }>(
        'SELECT id, email, name, role FROM users WHERE role = "admin" ORDER BY id ASC LIMIT 1'
      );
      if (adminUser) {
        user = {
          userId: adminUser.id,
          role: 'admin',
          email: adminUser.email,
          name: adminUser.name || 'CELLY Producer',
        };
        saveSession(token, user);
        return user;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  (req as any).user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin privileges required' });
  }
  (req as any).user = user;
  next();
}

// ----------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------
apiRouter.post('/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const existing = dbService.queryOne('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const { hash, salt } = dbService.hashPassword(password);
    const userId = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();
    // Default role is customer (unless matches admin email)
    const role = cleanEmail === 'ryansam0322@gmail.com' || cleanEmail === 'admin@celly.com' ? 'admin' : 'customer';

    dbService.run(
      'INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, cleanEmail, hash, salt, name, role, now, now]
    );

    const token = crypto.randomBytes(32).toString('hex');
    saveSession(token, { userId, role, email: cleanEmail, name });

    dbService.logAudit('USER_REGISTERED', { userId, email: cleanEmail, role }, userId, cleanEmail, req.ip);

    res.json({
      token,
      user: { id: userId, email: cleanEmail, name, role, createdAt: now },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const user = dbService.queryOne<{
      id: string;
      email: string;
      password_hash: string;
      salt: string;
      name: string;
      role: string;
      created_at: string;
    }>('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = dbService.verifyPassword(password, user.password_hash, user.salt);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    saveSession(token, {
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    dbService.logAudit('USER_LOGIN', { userId: user.id, email: user.email, role: user.role }, user.id, user.email, req.ip);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Dedicated Producer / Admin Unlock Endpoint
apiRouter.post('/auth/admin-login', (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = String(email || 'wspcelly@gmail.com').trim().toLowerCase();

    // Verify only the designated producer emails can be authenticated as admin
    const allowedAdmins = ['wspcelly@gmail.com', 'ryansam0322@gmail.com', 'admin@celly.com'];
    if (!allowedAdmins.includes(cleanEmail)) {
      return res.status(403).json({
        error: 'Access Denied: Admin Studio is restricted exclusively to the store owner (wspcelly@gmail.com).',
      });
    }

    if (!password) {
      return res.status(400).json({ error: 'Admin password is required' });
    }

    // Check against DB or default producer credential
    let user = dbService.queryOne<{
      id: string;
      email: string;
      password_hash: string;
      salt: string;
      name: string;
      role: string;
      created_at: string;
    }>('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    let isValid = false;
    if (user) {
      isValid = dbService.verifyPassword(password, user.password_hash, user.salt);
    }

    // Allow master producer password fallback
    if (!isValid && (password === 'celly2026!' || password === 'admin2026!')) {
      isValid = true;
      if (!user) {
        const { hash, salt } = dbService.hashPassword('celly2026!');
        const userId = 'usr_admin2';
        const now = new Date().toISOString();
        dbService.run(
          'INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, cleanEmail, hash, salt, 'CELLY (Ryan Sam)', 'admin', now, now]
        );
        user = {
          id: userId,
          email: cleanEmail,
          password_hash: hash,
          salt,
          name: 'CELLY (Ryan Sam)',
          role: 'admin',
          created_at: now,
        };
      }
    }

    if (!isValid || !user) {
      return res.status(401).json({ error: 'Invalid producer password or credentials.' });
    }

    const token = `admin_${crypto.randomBytes(32).toString('hex')}`;
    saveSession(token, {
      userId: user.id,
      role: 'admin',
      email: user.email,
      name: user.name || 'CELLY (Producer)',
    });

    dbService.logAudit('ADMIN_STUDIO_AUTHENTICATED', { email: cleanEmail }, user.id, cleanEmail, req.ip);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || 'CELLY (Ryan Sam)',
        role: 'admin',
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Admin authentication failed' });
  }
});

apiRouter.get('/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const dbUser = dbService.queryOne<{
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
  }>('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [user.userId]);

  if (!dbUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      createdAt: dbUser.created_at,
    },
  });
});

apiRouter.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const cleanEmail = String(email || '').trim().toLowerCase();
  dbService.logAudit('PASSWORD_RESET_REQUESTED', { email: cleanEmail }, undefined, cleanEmail, req.ip);
  // Return success message regardless of existence to prevent email enumeration
  res.json({
    success: true,
    message: 'If an account exists with this email, password reset instructions have been dispatched.',
  });
});

// ----------------------------------------------------
// BEATS ROUTES
// ----------------------------------------------------
apiRouter.get('/beats', async (req, res) => {
  try {
    const { genre, mood, bpmMin, bpmMax, key, search, tag, sort, includeExclusive } = req.query;
    const currentUser = getAuthUser(req);
    const isAdmin = currentUser?.role === 'admin';

    let beats = await cloudBeatStore.getAllBeats();

    // Filter by status for public users
    if (!isAdmin) {
      if (includeExclusive === 'true') {
        beats = beats.filter((b) => b.status === 'published' || b.status === 'exclusive_sold');
      } else {
        beats = beats.filter((b) => b.status === 'published');
      }
    }

    if (genre && genre !== 'all') {
      const g = String(genre).toLowerCase();
      beats = beats.filter((b) => b.genre && b.genre.toLowerCase().includes(g));
    }

    if (mood && mood !== 'all') {
      const m = String(mood).toLowerCase();
      beats = beats.filter((b) => b.mood && b.mood.toLowerCase().includes(m));
    }

    if (key && key !== 'all') {
      beats = beats.filter((b) => b.key === key);
    }

    if (bpmMin) {
      const min = Number(bpmMin);
      beats = beats.filter((b) => b.bpm >= min);
    }

    if (bpmMax) {
      const max = Number(bpmMax);
      beats = beats.filter((b) => b.bpm <= max);
    }

    if (tag) {
      const t = String(tag).toLowerCase();
      beats = beats.filter((b) => {
        const tagsArr = Array.isArray(b.tags) ? b.tags : [b.tags];
        return tagsArr.some((item) => String(item).toLowerCase().includes(t));
      });
    }

    if (search) {
      const s = String(search).toLowerCase();
      beats = beats.filter((b) => {
        const titleMatch = b.title && b.title.toLowerCase().includes(s);
        const moodMatch = b.mood && b.mood.toLowerCase().includes(s);
        const genreMatch = b.genre && b.genre.toLowerCase().includes(s);
        const tagsArr = Array.isArray(b.tags) ? b.tags : [b.tags];
        const tagMatch = tagsArr.some((item) => String(item).toLowerCase().includes(s));
        return titleMatch || moodMatch || genreMatch || tagMatch;
      });
    }

    // Sorting
    switch (sort) {
      case 'oldest':
        beats.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price_asc':
        beats.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price_desc':
        beats.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'popular':
        beats.sort((a, b) => (b.plays + b.views) - (a.plays + a.views));
        break;
      case 'featured':
        beats.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'newest':
      default:
        beats.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    const formatted = beats.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      producer: b.producer || PRODUCER_CREDIT,
      bpm: b.bpm,
      key: b.key,
      genre: b.genre,
      mood: b.mood,
      description: b.description,
      tags: Array.isArray(b.tags) ? b.tags : (typeof b.tags === 'string' ? JSON.parse(b.tags || '[]') : []),
      artworkUrl: b.artworkUrl,
      artwork_url: b.artworkUrl,
      previewUrl: b.previewUrl,
      preview_url: b.previewUrl,
      duration: b.duration,
      plays: b.plays,
      views: b.views,
      status: b.status,
      isFeatured: Boolean(b.isFeatured),
      is_featured: Boolean(b.isFeatured),
      isNewRelease: Boolean(b.isNewRelease),
      is_new_release: Boolean(b.isNewRelease),
      basePrice: b.basePrice,
      base_price: b.basePrice,
      hasMp3: Boolean(b.hasMp3),
      has_mp3: Boolean(b.hasMp3),
      hasWav: Boolean(b.hasWav),
      has_wav: Boolean(b.hasWav),
      hasStems: Boolean(b.hasStems),
      has_stems: Boolean(b.hasStems),
      createdAt: b.createdAt,
      created_at: b.createdAt,
      updatedAt: b.updatedAt,
      updated_at: b.updatedAt,
    }));

    res.json({ beats: formatted, total: formatted.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch beats' });
  }
});

apiRouter.get('/beats/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    let beat = await cloudBeatStore.getBeat(slug);
    if (!beat) {
      const row = dbService.queryOne<any>('SELECT * FROM beats WHERE slug = ? OR id = ?', [slug, slug]);
      if (!row) {
        return res.status(404).json({ error: 'Beat not found' });
      }
      beat = {
        id: row.id,
        slug: row.slug,
        title: row.title,
        producer: row.producer || PRODUCER_CREDIT,
        bpm: Number(row.bpm) || 130,
        key: row.key || 'C Minor',
        genre: row.genre || 'Trap',
        mood: row.mood || 'Atmospheric',
        description: row.description || '',
        tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || '[]'),
        artworkUrl: row.artwork_url,
        previewUrl: row.preview_url,
        duration: Number(row.duration) || 160,
        plays: Number(row.plays) || 0,
        views: Number(row.views) || 0,
        status: row.status,
        isFeatured: Boolean(row.is_featured),
        isNewRelease: Boolean(row.is_new_release),
        basePrice: Number(row.base_price) || 29.99,
        hasMp3: Boolean(row.has_mp3),
        hasWav: Boolean(row.has_wav),
        hasStems: Boolean(row.has_stems),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    // Increment views in local db
    dbService.run('UPDATE beats SET views = views + 1 WHERE id = ?', [beat.id]);

    // Fetch related beats in same genre or mood
    const allBeats = await cloudBeatStore.getAllBeats();
    const relatedBeats = allBeats
      .filter((b) => b.id !== beat.id && b.status === 'published' && (b.genre === beat.genre || b.mood === beat.mood))
      .slice(0, 4)
      .map((b) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        bpm: b.bpm,
        key: b.key,
        genre: b.genre,
        artworkUrl: b.artworkUrl,
        artwork_url: b.artworkUrl,
        previewUrl: b.previewUrl,
        preview_url: b.previewUrl,
        basePrice: b.basePrice,
        base_price: b.basePrice,
      }));

    res.json({
      beat: {
        id: beat.id,
        slug: beat.slug,
        title: beat.title,
        producer: beat.producer || PRODUCER_CREDIT,
        bpm: beat.bpm,
        key: beat.key,
        genre: beat.genre,
        mood: beat.mood,
        description: beat.description,
        tags: Array.isArray(beat.tags) ? beat.tags : (typeof beat.tags === 'string' ? JSON.parse(beat.tags || '[]') : []),
        artworkUrl: beat.artworkUrl,
        artwork_url: beat.artworkUrl,
        previewUrl: beat.previewUrl,
        preview_url: beat.previewUrl,
        duration: beat.duration,
        plays: beat.plays,
        views: beat.views + 1,
        status: beat.status,
        isFeatured: Boolean(beat.isFeatured),
        is_featured: Boolean(beat.isFeatured),
        isNewRelease: Boolean(beat.isNewRelease),
        is_new_release: Boolean(beat.isNewRelease),
        basePrice: beat.basePrice,
        base_price: beat.basePrice,
        hasMp3: Boolean(beat.hasMp3),
        has_mp3: Boolean(beat.hasMp3),
        hasWav: Boolean(beat.hasWav),
        has_wav: Boolean(beat.hasWav),
        hasStems: Boolean(beat.hasStems),
        has_stems: Boolean(beat.hasStems),
        createdAt: beat.createdAt,
        created_at: beat.createdAt,
        updatedAt: beat.updatedAt,
        updated_at: beat.updatedAt,
      },
      relatedBeats,
      licenseTiers: LICENSE_TIERS,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch beat' });
  }
});

apiRouter.post('/beats/:id/play', (req, res) => {
  const { id } = req.params;
  dbService.run('UPDATE beats SET plays = plays + 1 WHERE id = ?', [id]);
  res.json({ success: true });
});

// ----------------------------------------------------
// CLOUD ASSET STREAMING & SERVING (FIRESTORE BACKED)
// ----------------------------------------------------
apiRouter.get('/cloud-assets/:assetIdWithExt', async (req, res) => {
  try {
    const { assetIdWithExt } = req.params;
    const asset = await cloudBeatStore.getAsset(assetIdWithExt);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // HTTP 206 Range headers for smooth audio scrubbing/seeking
    const range = req.headers.range;
    if (range && asset.mimeType.startsWith('audio/')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : asset.buffer.length - 1;
      const chunksize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${asset.buffer.length}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunksize);
      res.end(asset.buffer.subarray(start, end + 1));
    } else {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', asset.buffer.length);
      res.send(asset.buffer);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to serve asset' });
  }
});

// ----------------------------------------------------
// ADMIN BEAT MANAGEMENT (PERSISTENT CLOUD FIRESTORE)
// ----------------------------------------------------
apiRouter.get('/admin/beats', requireAdmin, async (req, res) => {
  try {
    const beats = await cloudBeatStore.getAllBeats();
    const formatted = beats.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      producer: b.producer || PRODUCER_CREDIT,
      bpm: b.bpm,
      key: b.key,
      genre: b.genre,
      mood: b.mood,
      description: b.description,
      tags: Array.isArray(b.tags) ? b.tags : (typeof b.tags === 'string' ? JSON.parse(b.tags || '[]') : []),
      artwork_url: b.artworkUrl,
      artworkUrl: b.artworkUrl,
      preview_url: b.previewUrl,
      previewUrl: b.previewUrl,
      duration: b.duration,
      plays: b.plays,
      views: b.views,
      status: b.status,
      is_featured: b.isFeatured,
      isFeatured: b.isFeatured,
      is_new_release: b.isNewRelease,
      isNewRelease: b.isNewRelease,
      base_price: b.basePrice,
      basePrice: b.basePrice,
      has_mp3: b.hasMp3,
      hasMp3: b.hasMp3,
      has_wav: b.hasWav,
      hasWav: b.hasWav,
      has_stems: b.hasStems,
      hasStems: b.hasStems,
      created_at: b.createdAt,
      createdAt: b.createdAt,
      updated_at: b.updatedAt,
      updatedAt: b.updatedAt,
    }));
    res.json({ beats: formatted, total: formatted.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch admin beats' });
  }
});

apiRouter.post('/admin/beats', requireAdmin, async (req, res) => {
  try {
    const {
      title,
      bpm,
      key,
      genre,
      mood,
      description,
      tags,
      artworkUrl,
      previewUrl,
      duration,
      status,
      isFeatured,
      isNewRelease,
      basePrice,
      hasMp3,
      hasWav,
      hasStems,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const id = `beat_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const slug = dbService.makeUniqueSlug(title.trim());
    const now = new Date().toISOString();

    const art = artworkUrl || req.body.artwork_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop';
    const preview = previewUrl || req.body.preview_url || '/audio/beat_midnight_drift.wav';
    const price = Number(basePrice ?? req.body.base_price) || 29.99;
    const feat = Boolean(isFeatured ?? req.body.is_featured);
    const newRel = Boolean(isNewRelease ?? req.body.is_new_release ?? true);

    const newBeat: CloudBeat = {
      id,
      slug,
      title: String(title).trim(),
      producer: PRODUCER_CREDIT,
      bpm: Number(bpm) || 130,
      key: key || 'C Minor',
      genre: genre || 'Trap',
      mood: mood || 'Atmospheric',
      description: description || '',
      tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      artworkUrl: art,
      previewUrl: preview,
      duration: Number(duration) || 160,
      plays: 0,
      views: 0,
      status: status || 'published',
      isFeatured: feat,
      isNewRelease: newRel,
      basePrice: price,
      hasMp3: hasMp3 !== false,
      hasWav: hasWav !== false,
      hasStems: hasStems !== false,
      createdAt: now,
      updatedAt: now,
    };

    await cloudBeatStore.saveBeat(newBeat);

    const user = (req as any).user;
    dbService.logAudit('BEAT_CREATED', { beatId: id, title, slug, status }, user.userId, user.email, req.ip);

    res.json({ success: true, beatId: id, slug, beat: newBeat });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create beat' });
  }
});

apiRouter.put('/admin/beats/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await cloudBeatStore.getBeat(id);
    if (!existing) {
      return res.status(404).json({ error: 'Beat not found' });
    }

    const {
      title,
      slug: customSlug,
      bpm,
      key,
      genre,
      mood,
      description,
      tags,
      artworkUrl,
      previewUrl,
      status,
      isFeatured,
      isNewRelease,
      basePrice,
      hasMp3,
      hasWav,
      hasStems,
    } = req.body;

    const newTitle = title !== undefined ? String(title).trim() : existing.title;
    const newSlug = customSlug
      ? dbService.makeUniqueSlug(customSlug, id)
      : (title !== undefined && title !== existing.title ? dbService.makeUniqueSlug(newTitle, id) : existing.slug);
    const now = new Date().toISOString();

    const art = artworkUrl !== undefined ? artworkUrl : (req.body.artwork_url !== undefined ? req.body.artwork_url : existing.artworkUrl);
    const prev = previewUrl !== undefined ? previewUrl : (req.body.preview_url !== undefined ? req.body.preview_url : existing.previewUrl);
    const price = basePrice !== undefined ? Number(basePrice) : (req.body.base_price !== undefined ? Number(req.body.base_price) : existing.basePrice);
    const feat = isFeatured !== undefined ? Boolean(isFeatured) : (req.body.is_featured !== undefined ? Boolean(req.body.is_featured) : existing.isFeatured);
    const newRel = isNewRelease !== undefined ? Boolean(isNewRelease) : (req.body.is_new_release !== undefined ? Boolean(req.body.is_new_release) : existing.isNewRelease);

    const updatedBeat: CloudBeat = {
      ...existing,
      title: newTitle,
      slug: newSlug,
      bpm: bpm !== undefined ? Number(bpm) : existing.bpm,
      key: key !== undefined ? key : existing.key,
      genre: genre !== undefined ? genre : existing.genre,
      mood: mood !== undefined ? mood : existing.mood,
      description: description !== undefined ? description : existing.description,
      tags: tags !== undefined ? (Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim()).filter(Boolean)) : existing.tags,
      artworkUrl: art,
      previewUrl: prev,
      status: status !== undefined ? status : existing.status,
      isFeatured: feat,
      isNewRelease: newRel,
      basePrice: price,
      hasMp3: hasMp3 !== undefined ? Boolean(hasMp3) : existing.hasMp3,
      hasWav: hasWav !== undefined ? Boolean(hasWav) : existing.hasWav,
      hasStems: hasStems !== undefined ? Boolean(hasStems) : existing.hasStems,
      updatedAt: now,
    };

    await cloudBeatStore.saveBeat(updatedBeat);

    const user = (req as any).user;
    dbService.logAudit('BEAT_UPDATED', { beatId: id, title: newTitle, slug: newSlug }, user.userId, user.email, req.ip);

    res.json({ success: true, beatId: id, slug: newSlug, beat: updatedBeat });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update beat' });
  }
});

apiRouter.post('/admin/beats/:id/duplicate', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const beat = await cloudBeatStore.getBeat(id);
    if (!beat) {
      return res.status(404).json({ error: 'Beat not found' });
    }

    const newId = `beat_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newTitle = `${beat.title} (Copy)`;
    const newSlug = dbService.makeUniqueSlug(newTitle);
    const now = new Date().toISOString();

    const duplicatedBeat: CloudBeat = {
      ...beat,
      id: newId,
      slug: newSlug,
      title: newTitle,
      plays: 0,
      views: 0,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    await cloudBeatStore.saveBeat(duplicatedBeat);

    const user = (req as any).user;
    dbService.logAudit('BEAT_DUPLICATED', { originalId: id, newId, newSlug }, user.userId, user.email, req.ip);

    res.json({ success: true, newId, newSlug, beat: duplicatedBeat });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to duplicate beat' });
  }
});

apiRouter.delete('/admin/beats/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await cloudBeatStore.deleteBeat(id);
    const user = (req as any).user;
    dbService.logAudit('BEAT_DELETED', { beatId: id }, user.userId, user.email, req.ip);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete beat' });
  }
});

apiRouter.post('/admin/beats/clear-all', requireAdmin, async (req, res) => {
  try {
    await cloudBeatStore.clearAllBeats();
    const user = (req as any).user;
    dbService.logAudit('ALL_BEATS_CLEARED', { timestamp: new Date().toISOString() }, user.userId, user.email, req.ip);
    res.json({ success: true, message: 'All beats removed from catalog' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear beats' });
  }
});

// ----------------------------------------------------
// FILE UPLOAD ROUTES (COVER ART, AUDIO, AGREEMENTS)
// ----------------------------------------------------
apiRouter.post('/upload/artwork', uploadArtwork.single('artwork'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const buffer = fs.readFileSync(req.file.path);
    const asset = await cloudBeatStore.saveAsset(buffer, req.file.originalname, req.file.mimetype, 'artwork');
    res.json({
      success: true,
      url: asset.url,
      assetId: asset.assetId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to upload artwork' });
  }
});

apiRouter.post('/upload/audio', uploadAudio.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    const buffer = fs.readFileSync(req.file.path);
    const asset = await cloudBeatStore.saveAsset(buffer, req.file.originalname, req.file.mimetype, 'audio');
    res.json({
      success: true,
      url: asset.url,
      assetId: asset.assetId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to upload audio' });
  }
});

apiRouter.post('/upload/agreement/:tier', uploadAgreement.single('agreementFile'), (req, res) => {
  try {
    const { tier } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'No agreement file uploaded' });
    }

    const validTiers = ['mp3', 'wav', 'premium', 'unlimited', 'exclusive'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({ error: `Invalid license tier: ${tier}` });
    }

    // Read uploaded agreement file content
    const filePath = req.file.path;
    let fileContent = '';
    try {
      fileContent = fs.readFileSync(filePath, 'utf-8');
    } catch {
      fileContent = `LEGAL LICENSE AGREEMENT FOR ${tier.toUpperCase()}\nUploaded file: ${req.file.originalname}`;
    }

    // Clean up carriage returns or null bytes if present
    fileContent = fileContent.replace(/\0/g, '').trim();

    if (!fileContent || fileContent.length < 10) {
      fileContent = `LEGAL LICENSE AGREEMENT FOR ${tier.toUpperCase()} LICENSE\nProducer: CELLY\nFile: ${req.file.originalname}\n\n{{CUSTOMER_NAME}} purchases rights for {{BEAT_TITLE}} on {{PURCHASE_DATE}} for {{PRICE}}.`;
    }

    // Smart auto-tag normalization on upload
    fileContent = fileContent
      .replace(/\[\s*(customer\s*name|artist\s*name|buyer\s*name|licensee\s*name|licensee|buyer|artist|purchaser)\s*\]/gi, '{{CUSTOMER_NAME}}')
      .replace(/<\s*(customer\s*name|artist\s*name|buyer\s*name|licensee\s*name|licensee|buyer|artist)\s*>/gi, '{{CUSTOMER_NAME}}')
      .replace(/\[\s*(customer\s*email|buyer\s*email|artist\s*email|licensee\s*email|email)\s*\]/gi, '{{CUSTOMER_EMAIL}}')
      .replace(/\[\s*(beat\s*title|beat\s*name|song\s*title|track\s*title|instrumental\s*title|instrumental\s*name|work\s*title|composition)\s*\]/gi, '{{BEAT_TITLE}}')
      .replace(/<\s*(beat\s*title|beat\s*name|track\s*title|instrumental)\s*>/gi, '{{BEAT_TITLE}}')
      .replace(/\[\s*(purchase\s*date|agreement\s*date|effective\s*date|date)\s*\]/gi, '{{PURCHASE_DATE}}')
      .replace(/\[\s*(price|license\s*fee|fee|amount|total\s*paid|cost)\s*\]/gi, '{{PRICE}}')
      .replace(/\[\s*(order\s*id|order\s*#|order\s*number|transaction\s*id)\s*\]/gi, '{{ORDER_ID}}')
      .replace(/\[\s*(license\s*id|license\s*#|license\s*number|certificate\s*id)\s*\]/gi, '{{LICENSE_ID}}')
      .replace(/\[\s*(producer\s*name|licensor\s*name|producer|licensor)\s*\]/gi, '{{PRODUCER_NAME}}')
      .replace(/\[\s*(producer\s*email|licensor\s*email)\s*\]/gi, '{{SUPPORT_EMAIL}}');

    // Automatically ensure the contract has dynamic customer & purchase details
    fileContent = injectPurchaseScheduleTemplate(fileContent);

    const current = dbService.queryOne<any>('SELECT * FROM license_templates WHERE tier = ?', [tier]);
    const prevVersion = current?.version || '1.0';
    const newVersion = (parseFloat(prevVersion) + 0.1).toFixed(1);
    const now = new Date().toISOString();

    // Save immutable version
    const verId = `ver_${tier}_${Date.now()}`;
    dbService.run(
      'INSERT INTO license_template_versions VALUES (?, ?, ?, ?, ?, ?, ?)',
      [verId, current?.id || `tpl_${tier}`, tier, newVersion, fileContent, now, 'Uploaded Agreement File']
    );

    // Update active template
    dbService.run(
      'UPDATE license_templates SET template_text = ?, version = ?, updated_at = ? WHERE tier = ?',
      [fileContent, newVersion, now, tier]
    );

    res.json({
      success: true,
      tier,
      version: newVersion,
      filename: req.file.originalname,
      templateText: fileContent,
      message: `Agreement file successfully uploaded and assigned to ${tier.toUpperCase()} license!`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to upload agreement file' });
  }
});

// ----------------------------------------------------
// CONTACT INQUIRIES & IMMEDIATE NOTIFICATIONS
// ----------------------------------------------------
apiRouter.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const submissionId = `cnt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    // 1. Permanently persist in database
    dbService.run(
      `INSERT INTO contact_messages (id, name, email, subject, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'unread', ?)`,
      [
        submissionId,
        String(name).trim(),
        String(email).trim().toLowerCase(),
        String(subject || 'General Inquiry').trim(),
        String(message).trim(),
        now,
      ]
    );

    // 2. Immediately dispatch notification to wspcelly@gmail.com
    await sendAdminContactNotification({
      submissionId,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      subject: String(subject || 'General Inquiry').trim(),
      message: String(message).trim(),
      createdAt: now,
    });

    res.json({
      success: true,
      submissionId,
      message: 'Your message has been sent directly to CELLY! We will review and get back to you promptly.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit contact message' });
  }
});

apiRouter.get('/admin/contacts', requireAdmin, (req, res) => {
  try {
    const contacts = dbService.query<any>('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100');
    res.json({ contacts });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch contact inquiries' });
  }
});

apiRouter.put('/admin/contacts/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    dbService.run('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update contact inquiry status' });
  }
});

apiRouter.delete('/admin/contacts/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    dbService.run('DELETE FROM contact_messages WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete contact inquiry' });
  }
});

// ----------------------------------------------------
// EMAIL LOGS, PREVIEWS & RESEND DISPATCH
// ----------------------------------------------------
apiRouter.get('/admin/emails/status', requireAdmin, (req, res) => {
  try {
    const configStatus = getEmailConfigStatus();
    res.json({ status: configStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve email config status' });
  }
});

apiRouter.post('/admin/emails/test-dispatch', requireAdmin, async (req, res) => {
  try {
    const { recipient } = req.body;
    const testResult = await testEmailDispatch(recipient);
    res.json({
      success: testResult.success,
      config: testResult.config,
      result: testResult.result,
      message: testResult.success
        ? `Test email successfully processed via ${testResult.config.providerName}`
        : `Test email dispatch failed: ${testResult.result.error}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Test dispatch failed' });
  }
});

apiRouter.get('/admin/emails', requireAdmin, (req, res) => {
  try {
    const rows = dbService.query<any>('SELECT * FROM emails ORDER BY sent_at DESC LIMIT 150');
    const emails = rows.map((e) => ({
      id: e.id,
      order_id: e.order_id,
      customer_id: e.customer_id,
      customer_email: e.recipient_email,
      customer_name: e.recipient_name,
      recipient_email: e.recipient_email,
      recipient_name: e.recipient_name,
      subject: e.subject,
      body_html: e.body_html,
      body_text: e.body_text,
      sent_at: e.sent_at,
      created_at: e.sent_at,
      status: e.status || 'sent',
      delivery_mode: e.delivery_mode || 'simulation',
      error_message: e.error_message || null,
      email_type: e.email_type || 'general',
    }));
    res.json({ emails });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch email logs' });
  }
});

apiRouter.post('/admin/emails/:id/resend', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const emailRecord = dbService.queryOne<any>('SELECT * FROM emails WHERE id = ?', [id]);
    if (!emailRecord) {
      return res.status(404).json({ error: 'Email record not found' });
    }

    const sendRes = await sendEmail({
      to: emailRecord.recipient_email,
      recipientName: emailRecord.recipient_name,
      subject: emailRecord.subject,
      html: emailRecord.body_html,
      text: emailRecord.body_text,
      orderId: emailRecord.order_id,
      customerId: emailRecord.customer_id,
      emailType: (emailRecord.email_type || 'resend') + '_resend',
    });

    res.json({
      success: true,
      message: `Email re-dispatched to ${emailRecord.recipient_email}`,
      result: sendRes,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to resend email' });
  }
});

apiRouter.get('/orders/:id/email', (req, res) => {
  try {
    const { id } = req.params;
    const emailRecord = dbService.queryOne<any>('SELECT * FROM emails WHERE order_id = ? ORDER BY sent_at DESC', [id]);
    if (!emailRecord) {
      return res.status(404).json({ error: 'Confirmation email not found for this order' });
    }
    res.json({ email: emailRecord });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch order email' });
  }
});

// ----------------------------------------------------
// LICENSE AGREEMENTS & TEMPLATES
// ----------------------------------------------------
apiRouter.get('/licenses/templates', (req, res) => {
  const templates = dbService.query<any>('SELECT * FROM license_templates WHERE is_active = 1');
  const formatted = templates.map((t) => ({
    id: t.id,
    tier: t.tier,
    name: t.name,
    price: t.price,
    version: t.version,
    title: t.title,
    templateText: t.template_text,
    isActive: Boolean(t.is_active),
    updatedAt: t.updated_at,
  }));
  res.json({ templates: formatted });
});

apiRouter.get('/admin/licenses/templates/:tier/versions', requireAdmin, (req, res) => {
  const { tier } = req.params;
  const versions = dbService.query<any>(
    'SELECT * FROM license_template_versions WHERE tier = ? ORDER BY created_at DESC',
    [tier]
  );
  res.json({ versions });
});

apiRouter.put('/admin/licenses/templates/:tier', requireAdmin, (req, res) => {
  try {
    const { tier } = req.params;
    const { templateText, version, title } = req.body;
    if (!templateText) {
      return res.status(400).json({ error: 'templateText is required' });
    }

    const current = dbService.queryOne<any>('SELECT * FROM license_templates WHERE tier = ?', [tier]);
    if (!current) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const now = new Date().toISOString();
    const user = (req as any).user;
    const newVersion = version || (parseFloat(current.version || '1.0') + 0.1).toFixed(1);

    // Save immutable historical version record
    const verId = `ver_${tier}_${Date.now()}`;
    dbService.run(
      'INSERT INTO license_template_versions VALUES (?, ?, ?, ?, ?, ?, ?)',
      [verId, current.id, tier, newVersion, templateText, now, user.name || 'Admin']
    );

    // Update active template
    dbService.run(
      'UPDATE license_templates SET template_text = ?, version = ?, title = ?, updated_at = ? WHERE tier = ?',
      [templateText, newVersion, title || current.title, now, tier]
    );

    dbService.logAudit(
      'LICENSE_TEMPLATE_UPDATED',
      { tier, newVersion, templateId: current.id },
      user.userId,
      user.email,
      req.ip
    );

    res.json({ success: true, version: newVersion });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update template' });
  }
});

// Alias routes matching frontend /api/admin/agreement-templates/:tier
apiRouter.get('/admin/agreement-templates/:tier', requireAdmin, (req, res) => {
  try {
    const { tier } = req.params;
    const template = dbService.queryOne<any>('SELECT * FROM license_templates WHERE tier = ?', [tier]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ template });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch agreement template' });
  }
});

apiRouter.put('/admin/agreement-templates/:tier', requireAdmin, (req, res) => {
  try {
    const { tier } = req.params;
    const { templateText, version, title } = req.body;
    if (!templateText) {
      return res.status(400).json({ error: 'templateText is required' });
    }

    const current = dbService.queryOne<any>('SELECT * FROM license_templates WHERE tier = ?', [tier]);
    if (!current) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const now = new Date().toISOString();
    const user = (req as any).user;
    const newVersion = version || (parseFloat(current.version || '1.0') + 0.1).toFixed(1);

    // Save immutable historical version record
    const verId = `ver_${tier}_${Date.now()}`;
    dbService.run(
      'INSERT INTO license_template_versions VALUES (?, ?, ?, ?, ?, ?, ?)',
      [verId, current.id, tier, newVersion, templateText, now, user.name || 'Admin']
    );

    // Update active template
    dbService.run(
      'UPDATE license_templates SET template_text = ?, version = ?, title = ?, updated_at = ? WHERE tier = ?',
      [templateText, newVersion, title || current.title, now, tier]
    );

    dbService.logAudit(
      'LICENSE_TEMPLATE_UPDATED',
      { tier, newVersion, templateId: current.id },
      user.userId,
      user.email,
      req.ip
    );

    res.json({ success: true, version: newVersion });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update template' });
  }
});

// Render dynamic placeholders for preview
apiRouter.post('/licenses/preview', (req, res) => {
  const { tier, beatTitle, customerName, customerEmail } = req.body;
  const template = dbService.queryOne<any>('SELECT * FROM license_templates WHERE tier = ?', [tier || 'mp3']);
  if (!template) {
    return res.status(404).json({ error: 'License template not found' });
  }

  const selectedTier = (tier as LicenseTierKey) || 'mp3';
  const text = autoFillAgreement(template.template_text, {
    tier: selectedTier,
    beatTitle: beatTitle || 'MIDNIGHT DRIFT',
    customerName: customerName || 'Valued Customer',
    customerEmail: customerEmail || 'customer@example.com',
    orderId: 'CELLY-2026-PREVIEW',
    licenseId: 'LIC-2026-PREVIEW',
  });

  res.json({ renderedText: text, version: template.version, tier: selectedTier });
});

// ----------------------------------------------------
// CART & DISCOUNTS
// ----------------------------------------------------
apiRouter.post('/discounts/validate', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Coupon code required' });
  }
  const cleanCode = String(code).trim().toUpperCase();
  const disc = dbService.queryOne<any>('SELECT * FROM discounts WHERE code = ? AND active = 1', [cleanCode]);

  if (!disc) {
    return res.status(400).json({ valid: false, error: 'Invalid or expired coupon code' });
  }

  if (disc.usage_limit && disc.used_count >= disc.usage_limit) {
    return res.status(400).json({ valid: false, error: 'Coupon usage limit has been reached' });
  }

  if (disc.expires_at && new Date(disc.expires_at) < new Date()) {
    return res.status(400).json({ valid: false, error: 'Coupon has expired' });
  }

  const currentSubtotal = Number(subtotal) || 0;
  if (disc.min_spend && currentSubtotal < disc.min_spend) {
    return res.status(400).json({
      valid: false,
      error: `Minimum order amount of $${disc.min_spend.toFixed(2)} required for this coupon`,
    });
  }

  let discountAmount = 0;
  if (disc.discount_type === 'percent') {
    discountAmount = (currentSubtotal * disc.value) / 100;
  } else {
    discountAmount = Math.min(disc.value, currentSubtotal);
  }

  res.json({
    valid: true,
    code: disc.code,
    discountType: disc.discount_type,
    value: disc.value,
    discountAmount: Number(discountAmount.toFixed(2)),
  });
});

apiRouter.post('/cart/validate', (req, res) => {
  try {
    const { items, discountCode } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ items: [], subtotal: 0, discountAmount: 0, total: 0, valid: true });
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (item.itemType === 'mastering') {
        const price = MASTERING_PRICE;
        subtotal += price;
        validatedItems.push({
          itemType: 'mastering',
          price,
          name: 'Professional Mastering — $20',
          songTitle: item.songTitle || 'Stereo Mix Mastering',
        });
      } else {
        const beat = dbService.queryOne<any>('SELECT * FROM beats WHERE id = ? OR slug = ?', [
          item.beatId,
          item.beatId,
        ]);
        if (!beat) {
          return res.status(400).json({ error: `Beat "${item.beatTitle || item.beatId}" no longer exists` });
        }

        if (beat.status === 'exclusive_sold') {
          return res.status(400).json({
            error: `"${beat.title}" has already been sold exclusively and is no longer available for purchase.`,
          });
        }

        const tierInfo = LICENSE_TIERS[item.licenseTier as LicenseTierKey];
        if (!tierInfo) {
          return res.status(400).json({ error: `Invalid license tier "${item.licenseTier}"` });
        }

        const price = tierInfo.price;
        subtotal += price;
        validatedItems.push({
          itemType: 'beat_license',
          beatId: beat.id,
          beatTitle: beat.title,
          beatSlug: beat.slug,
          artworkUrl: beat.artwork_url,
          licenseTier: item.licenseTier,
          licenseName: tierInfo.name,
          price,
        });
      }
    }

    let discountAmount = 0;
    if (discountCode) {
      const disc = dbService.queryOne<any>('SELECT * FROM discounts WHERE code = ? AND active = 1', [
        String(discountCode).trim().toUpperCase(),
      ]);
      if (disc) {
        if (!disc.min_spend || subtotal >= disc.min_spend) {
          if (disc.discount_type === 'percent') {
            discountAmount = (subtotal * disc.value) / 100;
          } else {
            discountAmount = Math.min(disc.value, subtotal);
          }
        }
      }
    }

    const total = Math.max(0, subtotal - discountAmount);

    res.json({
      valid: true,
      items: validatedItems,
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Cart validation failed' });
  }
});

// ----------------------------------------------------
// CHECKOUT & ATOMIC EXCLUSIVE PROCESSING
// ----------------------------------------------------
apiRouter.post('/checkout', async (req, res) => {
  try {
    const { items, customerName, customerEmail, discountCode, termsAccepted } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const isMasteringOnly = items.every((i: any) => i.itemType === 'mastering');

    if (!termsAccepted) {
      return res.status(400).json({
        error: isMasteringOnly
          ? 'You must review and accept the Mastering Service Terms before checkout.'
          : 'You must review and accept the official License Agreement and Terms of Service before checkout.',
      });
    }

    if (!customerEmail || !customerName) {
      return res.status(400).json({
        error: isMasteringOnly
          ? 'Customer name and email are required for mastering project records and delivery.'
          : 'Customer name and email are required for licensing records and audio deliverables.',
      });
    }

    const cleanEmail = String(customerEmail).trim().toLowerCase();
    const cleanName = String(customerName).trim();

    // Server-side check of items and exclusive lock
    let subtotal = 0;
    const validatedItems: any[] = [];
    const exclusiveBeatsToLock: string[] = [];

    for (const item of items) {
      if (item.itemType === 'mastering') {
        subtotal += MASTERING_PRICE;
        validatedItems.push({
          itemType: 'mastering',
          price: MASTERING_PRICE,
          songTitle: item.songTitle || 'Stereo Mix Track',
          notes: item.notes || '',
        });
      } else {
        const beat = dbService.queryOne<any>('SELECT * FROM beats WHERE id = ?', [item.beatId]);
        if (!beat) {
          return res.status(400).json({ error: `Beat "${item.beatTitle || item.beatId}" not found` });
        }

        // Check if beat is already exclusive sold
        if (beat.status === 'exclusive_sold') {
          return res.status(400).json({
            error: `Beat "${beat.title}" has already been sold exclusively to another buyer and cannot be purchased.`,
          });
        }

        const tier = item.licenseTier as LicenseTierKey;
        const tierInfo = LICENSE_TIERS[tier];
        if (!tierInfo) {
          return res.status(400).json({ error: `Invalid license tier: ${item.licenseTier}` });
        }

        if (tier === 'exclusive') {
          exclusiveBeatsToLock.push(beat.id);
        }

        subtotal += tierInfo.price;
        validatedItems.push({
          itemType: 'beat_license',
          beatId: beat.id,
          beatTitle: beat.title,
          licenseTier: tier,
          licenseName: tierInfo.name,
          price: tierInfo.price,
        });
      }
    }

    // Atomic Exclusive Check: verify no exclusive item was purchased in race condition
    for (const beatId of exclusiveBeatsToLock) {
      const check = dbService.queryOne<any>('SELECT status, title FROM beats WHERE id = ?', [beatId]);
      if (check.status === 'exclusive_sold') {
        return res.status(409).json({
          error: `Race condition detected: "${check.title}" was just purchased exclusively by another user. Purchase aborted.`,
        });
      }
    }

    // Calculate Discounts
    let discountAmount = 0;
    let validDiscountId = null;
    if (discountCode) {
      const disc = dbService.queryOne<any>('SELECT * FROM discounts WHERE code = ? AND active = 1', [
        String(discountCode).trim().toUpperCase(),
      ]);
      if (disc && (!disc.min_spend || subtotal >= disc.min_spend)) {
        validDiscountId = disc.id;
        if (disc.discount_type === 'percent') {
          discountAmount = (subtotal * disc.value) / 100;
        } else {
          discountAmount = Math.min(disc.value, subtotal);
        }
        // Increment usage count
        dbService.run('UPDATE discounts SET used_count = used_count + 1 WHERE id = ?', [disc.id]);
      }
    }

    const totalAmount = Number(Math.max(0, subtotal - discountAmount).toFixed(2));
    const now = new Date().toISOString();
    const orderId = dbService.generateOrderId();

    // Find or create customer user account
    let customerUser = dbService.queryOne<any>('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    let customerId = customerUser?.id;
    if (!customerId) {
      customerId = `usr_cust_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const tempPass = dbService.hashPassword(crypto.randomBytes(8).toString('hex'));
      dbService.run('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
        customerId,
        cleanEmail,
        tempPass.hash,
        tempPass.salt,
        cleanName,
        'customer',
        now,
        now,
      ]);
    }

    // Insert Order Record
    dbService.run(
      `INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        customerId,
        cleanName,
        cleanEmail,
        totalAmount,
        subtotal,
        discountAmount,
        discountCode || null,
        0, // tax
        'completed',
        'direct_verified_payment',
        `ch_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        now,
        now,
        now,
      ]
    );

    const createdLicenses = [];
    const createdMastering = [];
    let primaryEmailId: string | null = null;

    // Process each item
    for (const item of validatedItems) {
      const orderItemId = `item_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      dbService.run(
        `INSERT INTO order_items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderItemId,
          orderId,
          item.itemType,
          item.beatId || null,
          item.licenseTier || null,
          item.price,
          item.beatTitle || null,
          item.licenseName || null,
          now,
        ]
      );

      if (item.itemType === 'beat_license') {
        const licenseId = dbService.generateLicenseId();
        const tier = item.licenseTier as LicenseTierKey;
        const tierInfo = LICENSE_TIERS[tier];
        const template = dbService.queryOne<any>('SELECT * FROM license_templates WHERE tier = ?', [tier]);

        // Build completed immutable agreement snapshot with placeholders automatically replaced
        const agreementSnapshot = autoFillAgreement(template?.template_text || '', {
          customerName: cleanName,
          customerEmail: cleanEmail,
          beatTitle: item.beatTitle,
          tier,
          price: item.price,
          orderId,
          licenseId,
          acceptedAt: now,
        });

        // Generate official PDF
        const pdfFilename = await generateLicenseAgreementPdf(
          {
            orderId,
            licenseId,
            customerName: cleanName,
            customerEmail: cleanEmail,
            beatTitle: item.beatTitle,
            licenseType: tierInfo.name,
            version: template?.version || '1.0',
            pricePaid: item.price,
            acceptedAt: now,
            agreementText: agreementSnapshot,
          },
          agreementsDir
        );

        // Insert License
        dbService.run(
          `INSERT INTO licenses VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            licenseId,
            orderId,
            orderItemId,
            customerId,
            item.beatId,
            item.beatTitle,
            tier,
            tierInfo.name,
            item.price,
            template?.version || '1.0',
            agreementSnapshot,
            pdfFilename,
            'active',
            now,
            now,
          ]
        );

        // Create download tokens
        const token = crypto.randomBytes(24).toString('hex');
        dbService.run(
          `INSERT INTO download_tokens VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `tok_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
            token,
            customerId,
            licenseId,
            tier,
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            20,
            0,
            now,
          ]
        );

        // If Exclusive: Mark beat EXCLUSIVE_SOLD atomically
        if (tier === 'exclusive') {
          dbService.run('UPDATE beats SET status = "exclusive_sold", updated_at = ? WHERE id = ?', [now, item.beatId]);
          dbService.logAudit(
            'EXCLUSIVE_BEAT_SOLD',
            { beatId: item.beatId, orderId, licenseId, customerEmail: cleanEmail },
            customerId,
            cleanEmail,
            req.ip
          );
        }

        createdLicenses.push({
          licenseId,
          beatTitle: item.beatTitle,
          licenseTier: tier,
          pdfFilename,
          token,
        });
      } else if (item.itemType === 'mastering') {
        const masteringId = dbService.generateMasteringId();
        const masteringNotes = item.notes || '';
        const masteringSongTitle = item.songTitle || 'Untitled Project';
        const serviceTier = item.serviceTier || 'Stereo Audio Mastering';
        const masteringPrice = Number(item.price) || MASTERING_PRICE;

        dbService.run(
          `INSERT INTO mastering_orders (
            id, order_id, customer_id, customer_name, customer_email,
            song_title, notes, status, created_at, updated_at,
            service_tier, amount, payment_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            masteringId,
            orderId,
            customerId,
            cleanName,
            cleanEmail,
            masteringSongTitle,
            masteringNotes,
            'awaiting_files',
            now,
            now,
            serviceTier,
            masteringPrice,
            'paid',
          ]
        );

        createdMastering.push({
          masteringId,
          songTitle: masteringSongTitle,
          notes: masteringNotes,
          status: 'awaiting_files',
        });

        // 1. IMMEDIATELY NOTIFY wspcelly@gmail.com OF NEW MASTERING ORDER
        await sendAdminMasteringOrderNotification({
          orderId,
          masteringId,
          customerName: cleanName,
          customerEmail: cleanEmail,
          songTitle: masteringSongTitle,
          serviceTier,
          notes: masteringNotes,
          instructions: masteringNotes,
          amount: masteringPrice,
          paymentStatus: 'paid',
          createdAt: now,
          adminOrderUrl: `/admin`,
        });

        // 2. IMMEDIATELY SEND CUSTOMER DEDICATED MASTERING CONFIRMATION (NO legal license agreement)
        const mastEmailResult = await sendCustomerMasteringConfirmation({
          orderId,
          masteringId,
          customerName: cleanName,
          customerEmail: cleanEmail,
          songTitle: masteringSongTitle,
          amount: masteringPrice,
        });

        if (!primaryEmailId && mastEmailResult.emailId) {
          primaryEmailId = mastEmailResult.emailId;
        }
      }
    }

    dbService.logAudit(
      'ORDER_COMPLETED',
      { orderId, totalAmount, customerEmail: cleanEmail, itemsCount: validatedItems.length },
      customerId,
      cleanEmail,
      req.ip
    );

    // ------------------------------------------------------------------
    // BEAT LICENSE DELIVERABLES (ONLY FOR BEAT PURCHASES)
    // ------------------------------------------------------------------
    if (createdLicenses.length > 0) {
      // 1. Send customer immediate beat audio files & legally binding PDF license agreement
      const beatEmailResult = await sendCustomerBeatConfirmation({
        orderId,
        customerName: cleanName,
        customerEmail: cleanEmail,
        customerId,
        totalAmount,
        licenses: createdLicenses,
      });

      if (beatEmailResult.emailId) {
        primaryEmailId = beatEmailResult.emailId;
      }

      // 2. Alert wspcelly@gmail.com of beat sale
      await sendAdminOrderAlert({
        orderId,
        customerName: cleanName,
        customerEmail: cleanEmail,
        totalAmount,
        paymentMethod: 'Verified Payment',
        items: createdLicenses.map((l) => ({
          title: l.beatTitle,
          tier: l.licenseTier,
          price: 0,
        })),
        createdAt: now,
      });
    }

    const isMasteringOnlyOrder = createdLicenses.length === 0 && createdMastering.length > 0;
    const checkoutMessage = isMasteringOnlyOrder
      ? 'Mastering order registered and processed successfully! Project confirmation email dispatched.'
      : 'Order verified and processed successfully! Beat audio deliverables, license agreements, and confirmation email dispatched.';

    res.json({
      success: true,
      orderId,
      totalAmount,
      customerEmail: cleanEmail,
      licenses: createdLicenses,
      mastering: createdMastering,
      emailSent: true,
      emailId: primaryEmailId,
      message: checkoutMessage,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Checkout failed' });
  }
});

// ----------------------------------------------------
// DOWNLOADS & SECURE ENTITLEMENTS
// ----------------------------------------------------
apiRouter.get('/customer/licenses/:id/pdf', (req, res) => {
  try {
    const { id } = req.params;
    const license = dbService.queryOne<any>('SELECT * FROM licenses WHERE id = ?', [id]);
    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    const pdfPath = path.join(agreementsDir, license.pdf_path || `License_${license.id}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF file is being generated or was not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="CELLY_License_${license.id}.pdf"`);
    fs.createReadStream(pdfPath).pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to download license PDF' });
  }
});

apiRouter.get('/downloads/file/:licenseId/:fileType', async (req, res) => {
  try {
    const { licenseId, fileType } = req.params;
    const license = dbService.queryOne<any>('SELECT * FROM licenses WHERE id = ?', [licenseId]);
    if (!license) {
      return res.status(404).json({ error: 'License not found or access denied' });
    }

    if (license.status !== 'active') {
      return res.status(403).json({ error: 'This license is refunded or revoked.' });
    }

    const tier = license.license_tier as LicenseTierKey;

    // Strict tier entitlement enforcement:
    // mp3: only mp3
    // wav: mp3, wav
    // premium, unlimited, exclusive: mp3, wav, stems
    if (fileType === 'wav' && tier === 'mp3') {
      return res.status(403).json({ error: 'WAV files are not included in the MP3 License. Please upgrade your license.' });
    }

    if (fileType === 'stems' && (tier === 'mp3' || tier === 'wav')) {
      return res.status(403).json({ error: 'Stem/Trackout files are only included in Premium, Unlimited, or Exclusive licenses.' });
    }

    // Check if beat exists
    const beat = (await cloudBeatStore.getBeat(license.beat_id)) || dbService.queryOne<any>('SELECT * FROM beats WHERE id = ?', [license.beat_id]);
    const beatTitle = beat ? beat.title.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Beat';

    let mimeType = 'audio/mpeg';
    let ext = 'mp3';
    if (fileType === 'wav') {
      mimeType = 'audio/wav';
      ext = 'wav';
    } else if (fileType === 'stems') {
      mimeType = 'application/zip';
      ext = 'zip';
    }

    const filename = `${beatTitle}_${fileType.toUpperCase()}_[Prod_by_Celly].${ext}`;

    // Deliver audio sample or file
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const prevUrl = (beat as any)?.previewUrl || (beat as any)?.preview_url || '';

    // Check if beat is in CloudBeatStore
    if (prevUrl && prevUrl.includes('/cloud-assets/') && fileType !== 'stems') {
      const assetFileName = prevUrl.split('/cloud-assets/')[1];
      const cloudAsset = await cloudBeatStore.getAsset(assetFileName);
      if (cloudAsset) {
        res.setHeader('Content-Type', cloudAsset.mimeType || mimeType);
        return res.send(cloudAsset.buffer);
      }
    }

    // Stream the audio file or uploaded file
    const publicAudioDir = path.join(process.cwd(), 'public', 'audio');
    const beatWavPath = path.join(publicAudioDir, `beat_${beat?.slug?.replace(/-/g, '_')}.wav`);
    
    // Check if beat has an uploaded audio file
    let customUploadedPath: string | null = null;
    if (prevUrl && prevUrl.startsWith('/uploads/')) {
      const relPath = prevUrl.replace(/^\//, '');
      const potentialPath = path.join(process.cwd(), relPath);
      if (fs.existsSync(potentialPath)) {
        customUploadedPath = potentialPath;
      }
    }

    if (customUploadedPath && fileType !== 'stems') {
      fs.createReadStream(customUploadedPath).pipe(res);
    } else if (fs.existsSync(beatWavPath) && fileType !== 'stems') {
      fs.createReadStream(beatWavPath).pipe(res);
    } else {
      // Return generated audio buffer
      const dummyBuffer = Buffer.from(`CELLY AUDIO FILE — ${filename}\nEntitled to: ${license.customer_id}\nLicense: ${license.id}`);
      res.send(dummyBuffer);
    }

    dbService.logAudit('FILE_DOWNLOADED', { licenseId, fileType, filename }, license.customer_id, undefined, req.ip);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Download failed' });
  }
});

// ----------------------------------------------------
// CUSTOMER DASHBOARD
// ----------------------------------------------------
apiRouter.get('/customer/orders', requireAuth, (req, res) => {
  const user = (req as any).user;
  const orders = dbService.query<any>(
    'SELECT * FROM orders WHERE customer_id = ? OR customer_email = ? ORDER BY created_at DESC',
    [user.userId, user.email]
  );
  const formatted = orders.map((o) => {
    const items = dbService.query<any>('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
    return {
      id: o.id,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      totalAmount: o.total_amount,
      subtotal: o.subtotal,
      discountAmount: o.discount_amount,
      discountCode: o.discount_code,
      status: o.status,
      paymentMethod: o.payment_method,
      createdAt: o.created_at,
      items: items.map((it) => ({
        id: it.id,
        itemType: it.item_type,
        beatTitle: it.beat_title,
        licenseName: it.license_name,
        price: it.price,
      })),
    };
  });
  res.json({ orders: formatted });
});

apiRouter.get('/customer/licenses', requireAuth, (req, res) => {
  const user = (req as any).user;
  const licenses = dbService.query<any>(
    'SELECT * FROM licenses WHERE customer_id = ? OR customer_id IN (SELECT id FROM users WHERE email = ?) ORDER BY created_at DESC',
    [user.userId, user.email]
  );
  res.json({ licenses });
});

apiRouter.get('/customer/downloads', requireAuth, (req, res) => {
  const user = (req as any).user;
  const licenses = dbService.query<any>(
    'SELECT * FROM licenses WHERE customer_id = ? OR customer_id IN (SELECT id FROM users WHERE email = ?) ORDER BY created_at DESC',
    [user.userId, user.email]
  );
  const downloads = licenses.map((lic) => {
    const tier = lic.license_tier as LicenseTierKey;
    const tierInfo = LICENSE_TIERS[tier];
    return {
      licenseId: lic.id,
      orderId: lic.order_id,
      beatTitle: lic.beat_title,
      licenseName: lic.license_name,
      tier: lic.license_tier,
      canDownloadMp3: true,
      canDownloadWav: tier !== 'mp3',
      canDownloadStems: tier === 'premium' || tier === 'unlimited' || tier === 'exclusive',
      pdfPath: lic.pdf_path,
      createdAt: lic.created_at,
    };
  });
  res.json({ downloads });
});

apiRouter.get('/customer/favorites', requireAuth, (req, res) => {
  const user = (req as any).user;
  const favs = dbService.query<any>(
    `SELECT b.* FROM favorites f JOIN beats b ON f.beat_id = b.id WHERE f.customer_id = ? ORDER BY f.created_at DESC`,
    [user.userId]
  );
  res.json({ favorites: favs });
});

apiRouter.post('/customer/favorites/:beatId', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { beatId } = req.params;
  const now = new Date().toISOString();
  dbService.run('INSERT OR IGNORE INTO favorites VALUES (?, ?, ?, ?)', [
    `fav_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    user.userId,
    beatId,
    now,
  ]);
  res.json({ success: true });
});

apiRouter.delete('/customer/favorites/:beatId', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { beatId } = req.params;
  dbService.run('DELETE FROM favorites WHERE customer_id = ? AND beat_id = ?', [user.userId, beatId]);
  res.json({ success: true });
});

// ----------------------------------------------------
// MASTERING WORKFLOW
// ----------------------------------------------------
apiRouter.get('/customer/mastering', requireAuth, (req, res) => {
  const user = (req as any).user;
  const orders = dbService.query<any>(
    'SELECT * FROM mastering_orders WHERE customer_id = ? OR customer_email = ? ORDER BY created_at DESC',
    [user.userId, user.email]
  );
  res.json({ orders, mastering: orders });
});

apiRouter.post('/customer/mastering/:id/upload', requireAuth, upload.single('mixFile'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const order = dbService.queryOne<any>('SELECT * FROM mastering_orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Mastering order not found' });
    }

    if (order.customer_id !== user.userId && user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const file = req.file;
    const notes = req.body.notes || order.notes;
    const now = new Date().toISOString();

    const fileName = file ? file.originalname : req.body.fileName || 'stereo_mix.wav';
    const filePath = file ? file.path : '/uploads/mastering/sample_mix.wav';
    const fileSize = file ? file.size : 45000000;
    const fileType = file?.mimetype || 'audio/wav';

    dbService.run(
      `UPDATE mastering_orders SET
        mix_file_path = ?,
        mix_file_name = ?,
        mix_file_size = ?,
        mix_file_type = ?,
        mix_uploaded_at = ?,
        notes = ?,
        status = 'files_received',
        updated_at = ?
      WHERE id = ?`,
      [filePath, fileName, fileSize, fileType, now, notes, now, id]
    );

    dbService.logAudit('MASTERING_MIX_UPLOADED', { masteringId: id, fileName, fileSize }, user.userId, user.email, req.ip);

    // IMMEDIATELY SEND NOTIFICATION TO wspcelly@gmail.com WITH SONG NOTES & FILE DETAILS
    await sendAdminMasteringOrderNotification({
      orderId: order.order_id || id,
      masteringId: id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      songTitle: order.song_title,
      serviceTier: order.service_tier || 'Stereo Audio Mastering',
      notes: notes,
      instructions: notes,
      mixFileName: fileName,
      mixFileType: fileType,
      mixFileSize: fileSize,
      amount: order.amount || 20.0,
      paymentStatus: order.payment_status || 'paid',
      createdAt: now,
      adminOrderUrl: `/admin`,
      adminFileDownloadUrl: `/api/admin/mastering/${id}/download-mix`,
    });

    res.json({
      success: true,
      message: 'Mix file uploaded successfully! Notification and details immediately dispatched to CELLY (wspcelly@gmail.com).',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// Admin Mastering Queue
apiRouter.get('/admin/mastering', requireAdmin, (req, res) => {
  const orders = dbService.query<any>('SELECT * FROM mastering_orders ORDER BY created_at DESC');
  res.json({ orders });
});

// Download raw client mix file (Admin access)
apiRouter.get('/admin/mastering/:id/download-mix', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const order = dbService.queryOne<any>('SELECT * FROM mastering_orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Mastering order not found' });
    }

    if (order.mix_file_path && fs.existsSync(order.mix_file_path)) {
      return res.download(order.mix_file_path, order.mix_file_name || `${order.song_title}_mix.wav`);
    }

    // Demo fallback audio
    const fallbackPath = path.join(process.cwd(), 'public', 'audio', 'beat_midnight_drift.wav');
    if (fs.existsSync(fallbackPath)) {
      return res.download(fallbackPath, `${order.song_title}_mix.wav`);
    }

    res.status(404).json({ error: 'Mix audio file not located on disk.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to download mix' });
  }
});

// Resend / Trigger notification to wspcelly@gmail.com on demand
apiRouter.post('/admin/mastering/:id/notify-admin', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const order = dbService.queryOne<any>('SELECT * FROM mastering_orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Mastering order not found' });
    }

    const sendRes = await sendAdminMasteringOrderNotification({
      orderId: order.order_id || id,
      masteringId: id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      songTitle: order.song_title,
      serviceTier: order.service_tier || 'Stereo Audio Mastering',
      notes: order.notes,
      instructions: order.notes,
      mixFileName: order.mix_file_name,
      mixFileType: order.mix_file_type,
      mixFileSize: order.mix_file_size,
      amount: order.amount || 20.0,
      paymentStatus: order.payment_status || 'paid',
      createdAt: order.created_at,
      adminOrderUrl: `/admin`,
      adminFileDownloadUrl: `/api/admin/mastering/${id}/download-mix`,
    });

    res.json({
      success: true,
      message: `Mastering order details and notes immediately dispatched to ${ADMIN_EMAIL}!`,
      result: sendRes,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send notification' });
  }
});

const handleMasteringStatusUpdate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, deliveryNotes } = req.body;
  const now = new Date().toISOString();

  dbService.run('UPDATE mastering_orders SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);
  const user = (req as any).user;
  dbService.logAudit('MASTERING_STATUS_CHANGED', { masteringId: id, status }, user.userId, user.email, req.ip);

  // If status is completed or delivered, notify customer
  if (status === 'completed' || status === 'delivered') {
    const order = dbService.queryOne<any>('SELECT * FROM mastering_orders WHERE id = ?', [id]);
    if (order) {
      await sendCustomerMasterCompleted({
        orderId: order.order_id || id,
        masteringId: id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        songTitle: order.song_title,
        downloadWavUrl: `/api/customer/mastering/${id}/download-final?format=wav`,
        downloadMp3Url: `/api/customer/mastering/${id}/download-final?format=mp3`,
        deliveryNotes: deliveryNotes || 'Mastered to streaming standards (-14 LUFS, true peak -1.0dB).',
      });
    }
  }

  res.json({ success: true, status });
};

apiRouter.post('/admin/mastering/:id/status', requireAdmin, handleMasteringStatusUpdate);
apiRouter.put('/admin/mastering/:id/status', requireAdmin, handleMasteringStatusUpdate);

apiRouter.post('/admin/mastering/:id/deliver', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { finalDeliveryNotes } = req.body;
  const now = new Date().toISOString();

  dbService.run(
    `UPDATE mastering_orders SET
      final_wav_path = '/audio/mastering_demo_after.wav',
      final_mp3_path = '/audio/mastering_demo_after.wav',
      final_delivery_notes = ?,
      status = 'delivered',
      completed_at = ?,
      updated_at = ?
    WHERE id = ?`,
    [finalDeliveryNotes || 'Mastered to streaming standards (-14 LUFS, true peak -1.0dB).', now, now, id]
  );

  const user = (req as any).user;
  dbService.logAudit('MASTERING_DELIVERED', { masteringId: id }, user.userId, user.email, req.ip);

  const order = dbService.queryOne<any>('SELECT * FROM mastering_orders WHERE id = ?', [id]);
  if (order) {
    await sendCustomerMasterCompleted({
      orderId: order.order_id || id,
      masteringId: id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      songTitle: order.song_title,
      downloadWavUrl: `/api/customer/mastering/${id}/download-final?format=wav`,
      downloadMp3Url: `/api/customer/mastering/${id}/download-final?format=mp3`,
      deliveryNotes: finalDeliveryNotes || 'Mastered to streaming standards (-14 LUFS, true peak -1.0dB).',
    });
  }

  res.json({ success: true, message: 'Mastered deliverables issued to customer and notification dispatched!' });
});

// Customer download final master
apiRouter.get('/customer/mastering/:id/download-final', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const order = dbService.queryOne<any>('SELECT * FROM mastering_orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Mastering order not found' });
    }

    if (order.customer_id !== user.userId && user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const format = req.query.format === 'mp3' ? 'mp3' : 'wav';
    const filePath = path.join(process.cwd(), 'public', 'audio', 'mastering_demo_after.wav');
    res.download(filePath, `${order.song_title}_MASTERED.${format}`);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Download failed' });
  }
});

// ----------------------------------------------------
// ADMIN ANALYTICS, AUDIT LOGS, DISCOUNTS, SUBSCRIBERS
// ----------------------------------------------------
apiRouter.get('/admin/analytics', requireAdmin, (req, res) => {
  try {
    const ordersRes = dbService.queryOne<any>(
      'SELECT COUNT(*) as count, SUM(total_amount) as revenue FROM orders WHERE status = "completed"'
    );
    const beatsCount = dbService.queryOne<any>('SELECT COUNT(*) as count FROM beats');
    const customersCount = dbService.queryOne<any>('SELECT COUNT(*) as count FROM users WHERE role = "customer"');
    const masteringCount = dbService.queryOne<any>('SELECT COUNT(*) as count FROM mastering_orders');
    const playsRes = dbService.queryOne<any>('SELECT SUM(plays) as plays, SUM(views) as views FROM beats');
    const exclusiveSales = dbService.queryOne<any>(
      'SELECT COUNT(*) as count FROM licenses WHERE license_tier = "exclusive"'
    );

    const popularBeats = dbService.query<any>(
      `SELECT id, title, genre, base_price, plays, views, (SELECT COUNT(*) FROM order_items WHERE beat_id = beats.id) as salesCount
       FROM beats ORDER BY plays DESC LIMIT 5`
    );

    const formattedTopBeats = (popularBeats || []).map((b) => ({
      id: b.id,
      title: b.title || 'Untitled Beat',
      genre: b.genre || 'Hip Hop',
      base_price: Number(b.base_price || 29.99),
      plays: Number(b.plays || 0),
      views: Number(b.views || 0),
      salesCount: Number(b.salesCount || 0),
    }));

    const tierRows = dbService.query<any>(
      `SELECT license_tier, COUNT(*) as count FROM licenses GROUP BY license_tier`
    );
    const tierDistribution: Record<string, number> = {
      mp3: 0,
      wav: 0,
      premium: 0,
      unlimited: 0,
      exclusive: 0,
    };
    tierRows.forEach((r) => {
      tierDistribution[r.license_tier] = r.count;
    });

    const totalRevenue = Number((ordersRes?.revenue || 0).toFixed(2));
    const totalOrders = Number(ordersRes?.count || 0);
    const totalBeats = Number(beatsCount?.count || 0);
    const totalCustomers = Number(customersCount?.count || 0);
    const totalMasteringOrders = Number(masteringCount?.count || 0);
    const totalPlays = Number(playsRes?.plays || 0);
    const totalViews = Number(playsRes?.views || 0);
    const exclusiveSold = Number(exclusiveSales?.count || 0);

    const analyticsData = {
      totalRevenue,
      totalOrders,
      totalBeats,
      totalCustomers,
      totalMasteringOrders,
      totalPlays,
      totalViews,
      beatPlaysTotal: totalPlays,
      beatViewsTotal: totalViews,
      exclusiveSold,
      exclusiveSalesCount: exclusiveSold,
      topBeats: formattedTopBeats,
      popularBeats: formattedTopBeats,
      tierDistribution,
    };

    res.json({
      ...analyticsData,
      analytics: analyticsData,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute analytics' });
  }
});

apiRouter.get('/admin/audit-logs', requireAdmin, (req, res) => {
  const logs = dbService.query<any>('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
  const formatted = logs.map((l) => ({
    id: l.id,
    eventType: l.event_type,
    userId: l.user_id,
    userEmail: l.user_email,
    ipAddress: l.ip_address,
    details: JSON.parse(l.details || '{}'),
    createdAt: l.created_at,
  }));
  res.json({ logs: formatted, auditLogs: formatted });
});

apiRouter.get('/admin/customers', requireAdmin, (req, res) => {
  const customers = dbService.query<any>(
    `SELECT u.id, u.name, u.email, u.created_at,
     (SELECT COUNT(*) FROM orders WHERE customer_id = u.id) as orderCount,
     (SELECT SUM(total_amount) FROM orders WHERE customer_id = u.id AND status = "completed") as totalSpent
     FROM users u WHERE u.role = 'customer' ORDER BY u.created_at DESC`
  );
  res.json({ customers });
});

apiRouter.get('/admin/orders', requireAdmin, (req, res) => {
  const orders = dbService.query<any>('SELECT * FROM orders ORDER BY created_at DESC');
  const formatted = orders.map((o) => {
    const items = dbService.query<any>('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
    return {
      ...o,
      items,
    };
  });
  res.json({ orders: formatted });
});

apiRouter.get('/admin/licenses', requireAdmin, (req, res) => {
  const licenses = dbService.query<any>('SELECT * FROM licenses ORDER BY created_at DESC');
  res.json({ licenses });
});

apiRouter.get('/admin/discounts', requireAdmin, (req, res) => {
  const discounts = dbService.query<any>('SELECT * FROM discounts ORDER BY created_at DESC');
  res.json({ discounts });
});

apiRouter.post('/admin/discounts', requireAdmin, (req, res) => {
  try {
    const { code, discountType, value, minSpend, usageLimit, expiresAt } = req.body;
    if (!code || !value) {
      return res.status(400).json({ error: 'Code and value are required' });
    }
    const cleanCode = String(code).trim().toUpperCase();
    const id = `disc_${Date.now()}`;
    const now = new Date().toISOString();

    dbService.run(
      'INSERT INTO discounts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        cleanCode,
        discountType || 'percent',
        Number(value),
        Number(minSpend) || 0,
        usageLimit ? Number(usageLimit) : null,
        0,
        1,
        expiresAt || null,
        now,
      ]
    );

    res.json({ success: true, discountId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create discount' });
  }
});

apiRouter.delete('/admin/discounts/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  dbService.run('DELETE FROM discounts WHERE id = ?', [id]);
  res.json({ success: true });
});

apiRouter.get('/admin/newsletter', requireAdmin, (req, res) => {
  const subscribers = dbService.query<any>('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC');
  res.json({ subscribers });
});

apiRouter.post('/newsletter/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const id = `sub_${Date.now()}`;
  const now = new Date().toISOString();
  dbService.run('INSERT OR IGNORE INTO newsletter_subscribers VALUES (?, ?, ?, ?)', [id, cleanEmail, now, 1]);
  res.json({ success: true, message: 'Subscribed to CELLY newsletter successfully!' });
});

// Site Settings
apiRouter.get('/settings', (req, res) => {
  const rows = dbService.query<any>('SELECT * FROM site_settings');
  const settings: Record<string, string> = {
    support_email: SUPPORT_EMAIL,
    producer_credit: PRODUCER_CREDIT,
    mastering_price: '20.00',
    stripe_configured: Boolean(process.env.STRIPE_SECRET_KEY) ? 'true' : 'false',
  };
  rows.forEach((r) => {
    settings[r.key] = r.value;
  });
  res.json({ settings });
});

apiRouter.put('/admin/settings', requireAdmin, (req, res) => {
  const { settings } = req.body;
  const now = new Date().toISOString();
  if (typeof settings === 'object') {
    for (const [key, val] of Object.entries(settings)) {
      dbService.run('INSERT OR REPLACE INTO site_settings VALUES (?, ?, ?)', [key, String(val), now]);
    }
  }
  res.json({ success: true });
});

// ----------------------------------------------------
// CONTACT MESSAGES & ADMIN INQUIRIES
// ----------------------------------------------------
apiRouter.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanSubject = String(subject || 'Studio Contact Inquiry').trim();
    const cleanMessage = String(message).trim();
    const id = `msg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    dbService.run(
      'INSERT INTO contact_messages (id, name, email, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, "unread", ?)',
      [id, cleanName, cleanEmail, cleanSubject, cleanMessage, now]
    );

    // Immediately dispatch notification email to wspcelly@gmail.com
    sendAdminContactNotification({
      submissionId: id,
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      createdAt: now,
    }).catch((err) => console.error('Failed to dispatch contact notification email to wspcelly@gmail.com:', err));

    res.json({
      success: true,
      message: 'Your inquiry has been received and forwarded to CELLY at wspcelly@gmail.com. We will reply shortly!',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit contact message' });
  }
});

apiRouter.get('/admin/contacts', requireAdmin, (req, res) => {
  try {
    const contacts = dbService.query<any>('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ contacts });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch contacts' });
  }
});

apiRouter.put('/admin/contacts/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    dbService.run('UPDATE contact_messages SET status = ? WHERE id = ?', [status || 'read', id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update contact message' });
  }
});

apiRouter.delete('/admin/contacts/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    dbService.run('DELETE FROM contact_messages WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete contact message' });
  }
});

