import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import { dbService } from './db.ts';
import { PRODUCER_CREDIT } from '../src/lib/licenseConstants.ts';

// Load Firebase Config
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.warn('[CloudBeatStore] Warning: Could not read firebase-applet-config.json', err);
}

const CHUNK_SIZE_BYTES = 500 * 1024; // 500 KB chunks (well within 1MB Firestore doc limit)
const CACHE_DIR = path.join(process.cwd(), 'uploads', 'cloud_cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export interface CloudBeat {
  id: string;
  slug: string;
  title: string;
  producer: string;
  bpm: number;
  key: string;
  genre: string;
  mood: string;
  description: string;
  tags: string[] | string;
  artworkUrl: string;
  previewUrl: string;
  duration: number;
  plays: number;
  views: number;
  status: 'draft' | 'published' | 'scheduled' | 'exclusive_sold';
  isFeatured: boolean;
  isNewRelease: boolean;
  basePrice: number;
  hasMp3: boolean;
  hasWav: boolean;
  hasStems: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetMetadata {
  assetId: string;
  beatId?: string;
  assetType: 'audio' | 'artwork' | 'stems';
  filename: string;
  mimeType: string;
  totalChunks: number;
  sizeBytes: number;
  createdAt: string;
}

class CloudBeatStoreService {
  private firestore: Firestore | null = null;
  private isInitialized = false;

  public getDb(): Firestore | null {
    if (!this.firestore && firebaseConfig) {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      this.firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
    }
    return this.firestore;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const db = this.getDb();
      if (!db) {
        console.warn('[CloudBeatStore] Firestore not configured, running in local fallback mode.');
        this.isInitialized = true;
        return;
      }

      console.log('[CloudBeatStore] Initializing persistent Cloud Firestore Beat Store...');

      // 1. Fetch all beats currently in Firestore
      const beatsColl = collection(db, 'beats');
      const snapshot = await getDocs(beatsColl);
      const cloudBeats: CloudBeat[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.id && data.title) {
          cloudBeats.push(data as CloudBeat);
        }
      });

      console.log(`[CloudBeatStore] Found ${cloudBeats.length} persistent beat(s) in Firestore.`);

      if (cloudBeats.length > 0) {
        // Sync Firestore beats into SQLite local cache
        for (const b of cloudBeats) {
          this.syncBeatToSqlite(b);
        }
      } else {
        // First run: Migrate any existing beats in SQLite to Firestore
        const localBeats = dbService.query<any>('SELECT * FROM beats');
        if (localBeats.length > 0) {
          console.log(`[CloudBeatStore] Migrating ${localBeats.length} existing local beat(s) to Firestore...`);
          for (const lb of localBeats) {
            const beatObj: CloudBeat = {
              id: lb.id,
              slug: lb.slug,
              title: lb.title,
              producer: lb.producer || PRODUCER_CREDIT,
              bpm: Number(lb.bpm) || 130,
              key: lb.key || 'C Minor',
              genre: lb.genre || 'Trap',
              mood: lb.mood || 'Atmospheric',
              description: lb.description || '',
              tags: typeof lb.tags === 'string' ? JSON.parse(lb.tags || '[]') : lb.tags,
              artworkUrl: lb.artwork_url || '',
              previewUrl: lb.preview_url || '',
              duration: Number(lb.duration) || 160,
              plays: Number(lb.plays) || 0,
              views: Number(lb.views) || 0,
              status: lb.status || 'published',
              isFeatured: Boolean(lb.is_featured),
              isNewRelease: Boolean(lb.is_new_release),
              basePrice: Number(lb.base_price) || 29.99,
              hasMp3: Boolean(lb.has_mp3),
              hasWav: Boolean(lb.has_wav),
              hasStems: Boolean(lb.has_stems),
              createdAt: lb.created_at || new Date().toISOString(),
              updatedAt: lb.updated_at || new Date().toISOString(),
            };
            await setDoc(doc(db, 'beats', beatObj.id), beatObj);
          }
          console.log('[CloudBeatStore] Migration to Firestore complete.');
        }
      }

      this.isInitialized = true;
      console.log('[CloudBeatStore] Cloud Beat Store initialized successfully.');
    } catch (err) {
      console.error('[CloudBeatStore] Error during init:', err);
      this.isInitialized = true; // allow fallback
    }
  }

  // --- BEAT OPERATIONS ---

  public async getAllBeats(): Promise<CloudBeat[]> {
    try {
      const db = this.getDb();
      if (!db) {
        return this.getLocalBeats();
      }
      const beatsColl = collection(db, 'beats');
      const snapshot = await getDocs(beatsColl);
      const beats: CloudBeat[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.id && data.title) {
          beats.push(data as CloudBeat);
        }
      });
      // Sort by createdAt descending
      beats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return beats;
    } catch (err) {
      console.error('[CloudBeatStore] Failed to read beats from Firestore, falling back to local SQLite:', err);
      return this.getLocalBeats();
    }
  }

  public async getBeat(idOrSlug: string): Promise<CloudBeat | null> {
    try {
      const beats = await this.getAllBeats();
      const match = beats.find((b) => b.id === idOrSlug || b.slug === idOrSlug);
      return match || null;
    } catch (err) {
      console.error('[CloudBeatStore] Failed to get beat:', err);
      return null;
    }
  }

  public async saveBeat(beat: CloudBeat): Promise<void> {
    // 1. Save to SQLite cache
    this.syncBeatToSqlite(beat);

    // 2. Save persistently to Firestore
    try {
      const db = this.getDb();
      if (db) {
        await setDoc(doc(db, 'beats', beat.id), beat);
        console.log(`[CloudBeatStore] Beat "${beat.title}" (${beat.id}) saved permanently to Firestore.`);
      }
    } catch (err) {
      console.error(`[CloudBeatStore] Error saving beat ${beat.id} to Firestore:`, err);
      throw err;
    }
  }

  public async deleteBeat(beatId: string): Promise<void> {
    // 1. Delete from SQLite
    try {
      dbService.run('DELETE FROM beats WHERE id = ?', [beatId]);
    } catch (e) {
      // ignore
    }

    // 2. Delete from Firestore
    try {
      const db = this.getDb();
      if (db) {
        await deleteDoc(doc(db, 'beats', beatId));
        console.log(`[CloudBeatStore] Beat ${beatId} deleted from Firestore.`);
      }
    } catch (err) {
      console.error(`[CloudBeatStore] Error deleting beat ${beatId} from Firestore:`, err);
    }
  }

  public async clearAllBeats(): Promise<void> {
    // 1. Clear local SQLite
    try {
      dbService.run('DELETE FROM beats');
    } catch (e) {
      // ignore
    }

    // 2. Clear Firestore beats collection
    try {
      const db = this.getDb();
      if (db) {
        const snapshot = await getDocs(collection(db, 'beats'));
        const batch = writeBatch(db);
        snapshot.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        console.log('[CloudBeatStore] All beats cleared from Firestore.');
      }
    } catch (err) {
      console.error('[CloudBeatStore] Error clearing beats from Firestore:', err);
    }
  }

  // --- ASSET CHUNKING & PERSISTENCE ---

  public async saveAsset(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    assetType: 'audio' | 'artwork' | 'stems',
    beatId?: string
  ): Promise<{ assetId: string; url: string; sizeBytes: number }> {
    const ext = path.extname(filename).toLowerCase() || (assetType === 'audio' ? '.wav' : '.jpg');
    const assetId = `asset_${assetType}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const totalSize = buffer.length;
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE_BYTES);

    // 1. Save to local cache directory for lightning-fast reads
    const localCachePath = path.join(CACHE_DIR, `${assetId}${ext}`);
    fs.writeFileSync(localCachePath, buffer);

    // Also mirror to uploads/beats or uploads/artwork if requested
    if (assetType === 'audio') {
      const uploadsBeatsPath = path.join(process.cwd(), 'uploads', 'beats', `${assetId}${ext}`);
      try {
        fs.writeFileSync(uploadsBeatsPath, buffer);
      } catch {}
    } else if (assetType === 'artwork') {
      const uploadsArtworkPath = path.join(process.cwd(), 'uploads', 'artwork', `${assetId}${ext}`);
      try {
        fs.writeFileSync(uploadsArtworkPath, buffer);
      } catch {}
    }

    // 2. Save metadata and chunks persistently in Firestore
    const db = this.getDb();
    if (db) {
      const meta: AssetMetadata = {
        assetId,
        beatId: beatId || '',
        assetType,
        filename,
        mimeType,
        totalChunks,
        sizeBytes: totalSize,
        createdAt: new Date().toISOString(),
      };

      // Save metadata document
      await setDoc(doc(db, 'beat_assets', assetId), meta);

      // Save each chunk
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE_BYTES;
        const end = Math.min(start + CHUNK_SIZE_BYTES, totalSize);
        const chunkBuf = buffer.subarray(start, end);
        const chunkBase64 = chunkBuf.toString('base64');

        await setDoc(doc(db, 'beat_assets', `${assetId}_chunk_${i}`), {
          assetId,
          chunkIndex: i,
          data: chunkBase64,
        });
      }

      console.log(
        `[CloudBeatStore] Asset "${filename}" (${totalSize} bytes, ${totalChunks} chunks) saved permanently in Firestore beat_assets.`
      );
    }

    const publicUrl = `/api/cloud-assets/${assetId}${ext}`;
    return { assetId, url: publicUrl, sizeBytes: totalSize };
  }

  public async getAsset(assetIdWithExt: string): Promise<{ buffer: Buffer; mimeType: string; filename: string } | null> {
    const rawAssetId = assetIdWithExt.replace(/\.[^/.]+$/, '');
    const ext = path.extname(assetIdWithExt).toLowerCase();

    // 1. Check local cache first
    const cachedPath = path.join(CACHE_DIR, assetIdWithExt);
    if (fs.existsSync(cachedPath)) {
      const buffer = fs.readFileSync(cachedPath);
      const mimeType = this.getMimeType(ext);
      return { buffer, mimeType, filename: assetIdWithExt };
    }

    // Check mirror paths
    const mirrorBeats = path.join(process.cwd(), 'uploads', 'beats', assetIdWithExt);
    if (fs.existsSync(mirrorBeats)) {
      const buffer = fs.readFileSync(mirrorBeats);
      return { buffer, mimeType: this.getMimeType(ext), filename: assetIdWithExt };
    }

    // 2. Retrieve from Firestore if not on local disk
    const db = this.getDb();
    if (!db) return null;

    try {
      const metaSnap = await getDoc(doc(db, 'beat_assets', rawAssetId));
      if (!metaSnap.exists()) {
        console.warn(`[CloudBeatStore] Asset metadata not found in Firestore for: ${rawAssetId}`);
        return null;
      }

      const meta = metaSnap.data() as AssetMetadata;
      const chunks: Buffer[] = [];

      for (let i = 0; i < meta.totalChunks; i++) {
        const chunkSnap = await getDoc(doc(db, 'beat_assets', `${rawAssetId}_chunk_${i}`));
        if (!chunkSnap.exists()) {
          throw new Error(`Missing chunk ${i} for asset ${rawAssetId}`);
        }
        const chunkData = chunkSnap.data();
        chunks.push(Buffer.from(chunkData.data, 'base64'));
      }

      const fullBuffer = Buffer.concat(chunks);

      // Re-populate local cache so subsequent requests are instant
      fs.writeFileSync(cachedPath, fullBuffer);

      return {
        buffer: fullBuffer,
        mimeType: meta.mimeType || this.getMimeType(ext),
        filename: meta.filename || assetIdWithExt,
      };
    } catch (err) {
      console.error(`[CloudBeatStore] Failed to retrieve asset ${rawAssetId} from Firestore:`, err);
      return null;
    }
  }

  // --- HELPER METHODS ---

  private getLocalBeats(): CloudBeat[] {
    const rows = dbService.query<any>('SELECT * FROM beats ORDER BY created_at DESC');
    return rows.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      producer: b.producer || PRODUCER_CREDIT,
      bpm: Number(b.bpm) || 130,
      key: b.key || 'C Minor',
      genre: b.genre || 'Trap',
      mood: b.mood || 'Atmospheric',
      description: b.description || '',
      tags: typeof b.tags === 'string' ? JSON.parse(b.tags || '[]') : b.tags,
      artworkUrl: b.artwork_url,
      previewUrl: b.preview_url,
      duration: Number(b.duration) || 160,
      plays: Number(b.plays) || 0,
      views: Number(b.views) || 0,
      status: b.status || 'published',
      isFeatured: Boolean(b.is_featured),
      isNewRelease: Boolean(b.is_new_release),
      basePrice: Number(b.base_price) || 29.99,
      hasMp3: Boolean(b.has_mp3),
      hasWav: Boolean(b.has_wav),
      hasStems: Boolean(b.has_stems),
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));
  }

  private syncBeatToSqlite(b: CloudBeat): void {
    const existing = dbService.queryOne('SELECT id FROM beats WHERE id = ?', [b.id]);
    const tagsJson = JSON.stringify(Array.isArray(b.tags) ? b.tags : String(b.tags || '').split(',').map((t) => t.trim()));
    const now = b.updatedAt || new Date().toISOString();

    if (existing) {
      dbService.run(
        `UPDATE beats SET
          slug = ?, title = ?, producer = ?, bpm = ?, key = ?, genre = ?, mood = ?,
          description = ?, tags = ?, artwork_url = ?, preview_url = ?, duration = ?,
          status = ?, is_featured = ?, is_new_release = ?, base_price = ?,
          has_mp3 = ?, has_wav = ?, has_stems = ?, updated_at = ?
        WHERE id = ?`,
        [
          b.slug,
          b.title,
          b.producer || PRODUCER_CREDIT,
          b.bpm,
          b.key,
          b.genre,
          b.mood,
          b.description || '',
          tagsJson,
          b.artworkUrl || '',
          b.previewUrl || '',
          b.duration || 160,
          b.status || 'published',
          b.isFeatured ? 1 : 0,
          b.isNewRelease ? 1 : 0,
          b.basePrice || 29.99,
          b.hasMp3 !== false ? 1 : 0,
          b.hasWav !== false ? 1 : 0,
          b.hasStems !== false ? 1 : 0,
          now,
          b.id,
        ]
      );
    } else {
      dbService.run(
        `INSERT OR REPLACE INTO beats (
          id, slug, title, producer, bpm, key, genre, mood, description, tags,
          artwork_url, preview_url, duration, plays, views, status, is_featured,
          is_new_release, base_price, has_mp3, has_wav, has_stems, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          b.id,
          b.slug,
          b.title,
          b.producer || PRODUCER_CREDIT,
          b.bpm,
          b.key,
          b.genre,
          b.mood,
          b.description || '',
          tagsJson,
          b.artworkUrl || '',
          b.previewUrl || '',
          b.duration || 160,
          b.plays || 0,
          b.views || 0,
          b.status || 'published',
          b.isFeatured ? 1 : 0,
          b.isNewRelease ? 1 : 0,
          b.basePrice || 29.99,
          b.hasMp3 !== false ? 1 : 0,
          b.hasWav !== false ? 1 : 0,
          b.hasStems !== false ? 1 : 0,
          b.createdAt || now,
          now,
        ]
      );
    }
  }

  private getMimeType(ext: string): string {
    switch (ext) {
      case '.wav':
        return 'audio/wav';
      case '.mp3':
        return 'audio/mpeg';
      case '.ogg':
        return 'audio/ogg';
      case '.flac':
        return 'audio/flac';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.zip':
        return 'application/zip';
      default:
        return 'application/octet-stream';
    }
  }
}

export const cloudBeatStore = new CloudBeatStoreService();
