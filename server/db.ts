import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { DEFAULT_AGREEMENT_TEMPLATES } from './defaultAgreements.ts';
import { LICENSE_TIERS, PRODUCER_CREDIT, SUPPORT_EMAIL } from '../src/lib/licenseConstants.ts';
import { LicenseTierKey } from '../src/types.ts';

export class DatabaseService {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;
  private isInitialized = false;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'celly.sqlite');
  }

  public async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    const SQL = await initSqlJs();
    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(fileBuffer);
    } else {
      this.db = new SQL.Database();
    }

    this.createTables();
    this.seedInitialData();
    this.runMigrations();
    this.persist();
    this.isInitialized = true;
  }

  private persist(): void {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  private runMigrations(): void {
    if (!this.db) return;
    // Safe column migrations
    const tryAddColumn = (table: string, columnDef: string) => {
      try {
        this.db?.run(`ALTER TABLE ${table} ADD COLUMN ${columnDef};`);
      } catch {
        // column already exists
      }
    };

    tryAddColumn('mastering_orders', 'service_tier TEXT DEFAULT "Stereo Mastering"');
    tryAddColumn('mastering_orders', 'amount REAL DEFAULT 20.00');
    tryAddColumn('mastering_orders', 'payment_status TEXT DEFAULT "paid"');
    tryAddColumn('mastering_orders', 'admin_notes TEXT');
    tryAddColumn('mastering_orders', 'mix_file_type TEXT');
    tryAddColumn('emails', 'email_type TEXT DEFAULT "general"');
    tryAddColumn('emails', 'error_message TEXT');
    tryAddColumn('emails', 'created_at TEXT');
    tryAddColumn('emails', 'delivery_mode TEXT DEFAULT "simulation"');

    // Ensure sessions table and persistent admin sessions exist across server restarts
    try {
      this.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL,
          email TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);
      const now = new Date().toISOString();
      this.run(
        `INSERT OR REPLACE INTO sessions VALUES (?, ?, ?, ?, ?, ?)`,
        ['admin-token-celly', 'usr_admin_wspcelly', 'admin', 'wspcelly@gmail.com', 'CELLY Producer', now]
      );
      this.run(
        `INSERT OR REPLACE INTO sessions VALUES (?, ?, ?, ?, ?, ?)`,
        ['admin-token-ryansam', 'usr_admin2', 'admin', 'ryansam0322@gmail.com', 'CELLY Producer', now]
      );
    } catch {
      // ignore
    }

    // Ensure primary producer email wspcelly@gmail.com has admin access
    try {
      const adminCheck = this.queryOne('SELECT id FROM users WHERE email = "wspcelly@gmail.com"');
      if (!adminCheck) {
        const adminPass = this.hashPassword('celly2026!');
        const now = new Date().toISOString();
        this.run(
          `INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ['usr_admin_wspcelly', 'wspcelly@gmail.com', adminPass.hash, adminPass.salt, 'CELLY Producer', 'admin', now, now]
        );
      }
    } catch {
      // ignore
    }
  }

  private createTables(): void {
    if (!this.db) return;

    this.db.run('PRAGMA foreign_keys = ON;');

    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'customer')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS beats (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        producer TEXT NOT NULL,
        bpm INTEGER NOT NULL,
        key TEXT NOT NULL,
        genre TEXT NOT NULL,
        mood TEXT NOT NULL,
        description TEXT NOT NULL,
        tags TEXT NOT NULL,
        artwork_url TEXT NOT NULL,
        preview_url TEXT NOT NULL,
        duration INTEGER NOT NULL,
        plays INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        status TEXT NOT NULL CHECK(status IN ('draft', 'published', 'scheduled', 'exclusive_sold')),
        is_featured INTEGER DEFAULT 0,
        is_new_release INTEGER DEFAULT 0,
        base_price REAL DEFAULT 29.99,
        has_mp3 INTEGER DEFAULT 1,
        has_wav INTEGER DEFAULT 1,
        has_stems INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS beat_files (
        id TEXT PRIMARY KEY,
        beat_id TEXT NOT NULL,
        file_type TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(beat_id) REFERENCES beats(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS license_templates (
        id TEXT PRIMARY KEY,
        tier TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        version TEXT NOT NULL,
        title TEXT NOT NULL,
        template_text TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS license_template_versions (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        tier TEXT NOT NULL,
        version TEXT NOT NULL,
        template_text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        created_by TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        total_amount REAL NOT NULL,
        subtotal REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        discount_code TEXT,
        tax_amount REAL DEFAULT 0,
        status TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        payment_provider_id TEXT,
        terms_accepted_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        beat_id TEXT,
        license_tier TEXT,
        price REAL NOT NULL,
        beat_title TEXT,
        license_name TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS licenses (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        order_item_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        beat_id TEXT NOT NULL,
        beat_title TEXT NOT NULL,
        license_tier TEXT NOT NULL,
        license_name TEXT NOT NULL,
        price_paid REAL NOT NULL,
        version TEXT NOT NULL,
        agreement_snapshot TEXT NOT NULL,
        pdf_path TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        accepted_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS download_tokens (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        customer_id TEXT NOT NULL,
        license_id TEXT NOT NULL,
        file_type TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        max_uses INTEGER DEFAULT 10,
        use_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS mastering_orders (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        song_title TEXT NOT NULL,
        notes TEXT,
        status TEXT NOT NULL,
        mix_file_path TEXT,
        mix_file_name TEXT,
        mix_file_size INTEGER,
        mix_uploaded_at TEXT,
        final_wav_path TEXT,
        final_mp3_path TEXT,
        final_delivery_notes TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS favorites (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        beat_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(customer_id, beat_id)
      );

      CREATE TABLE IF NOT EXISTS discounts (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        discount_type TEXT NOT NULL,
        value REAL NOT NULL,
        min_spend REAL DEFAULT 0,
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        expires_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        subscribed_at TEXT NOT NULL,
        active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        user_id TEXT,
        user_email TEXT,
        ip_address TEXT,
        details TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unread',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS emails (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        customer_id TEXT,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        body_html TEXT NOT NULL,
        body_text TEXT NOT NULL,
        sent_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'sent',
        attachments TEXT,
        email_type TEXT DEFAULT 'general',
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_beats_slug ON beats(slug);
      CREATE INDEX IF NOT EXISTS idx_beats_status ON beats(status);
      CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_licenses_customer ON licenses(customer_id);
      CREATE INDEX IF NOT EXISTS idx_favorites_customer ON favorites(customer_id);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_emails_order ON emails(order_id);
      CREATE INDEX IF NOT EXISTS idx_emails_customer ON emails(customer_id);
      CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at);
    `);
  }

  // Password Security
  public hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { hash, salt };
  }

  public verifyPassword(password: string, hash: string, salt: string): boolean {
    const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return checkHash === hash;
  }

  private seedInitialData(): void {
    if (!this.db) return;

    // Check if users exist
    const userCountRes = this.db.exec('SELECT COUNT(*) FROM users;');
    const userCount = userCountRes[0]?.values[0]?.[0] as number;

    if (userCount === 0) {
      const now = new Date().toISOString();
      const adminPass = this.hashPassword('celly2026!');
      const customerPass = this.hashPassword('celly2026!');

      // 1. Admin users
      this.db.run(
        `INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['usr_admin1', 'admin@celly.com', adminPass.hash, adminPass.salt, 'CELLY Admin', 'admin', now, now]
      );
      this.db.run(
        `INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['usr_admin2', 'ryansam0322@gmail.com', adminPass.hash, adminPass.salt, 'CELLY Producer', 'admin', now, now]
      );

      // 2. Demo Customer
      this.db.run(
        `INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['usr_cust1', 'artist@gmail.com', customerPass.hash, customerPass.salt, 'Marcus Vance', 'customer', now, now]
      );

      // 3. License Templates
      const tierKeys: LicenseTierKey[] = ['mp3', 'wav', 'premium', 'unlimited', 'exclusive'];
      for (const tier of tierKeys) {
        const info = LICENSE_TIERS[tier];
        const template = DEFAULT_AGREEMENT_TEMPLATES[tier];
        const templateId = `tmpl_${tier}`;
        this.db.run(
          `INSERT INTO license_templates VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [templateId, tier, info.name, info.price, template.version, template.title, template.templateText, 1, now]
        );
        this.db.run(
          `INSERT INTO license_template_versions VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [`ver_${tier}_1_0`, templateId, tier, '1.0', template.templateText, now, 'CELLY (System Initial)']
        );
      }

      // 4. Beats are user-uploaded; starting with a clean catalog for producer uploads

      // 5. Seed Discounts
      this.db.run(
        `INSERT INTO discounts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['disc_celly10', 'CELLY10', 'percent', 10, 0, 1000, 12, 1, null, now]
      );
      this.db.run(
        `INSERT INTO discounts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['disc_launch20', 'LAUNCH20', 'fixed', 20, 50, 200, 4, 1, null, now]
      );

      // 6. Settings
      this.db.run(`INSERT OR REPLACE INTO site_settings VALUES (?, ?, ?)`, ['support_email', SUPPORT_EMAIL, now]);
      this.db.run(`INSERT OR REPLACE INTO site_settings VALUES (?, ?, ?)`, ['producer_credit', PRODUCER_CREDIT, now]);
      this.db.run(`INSERT OR REPLACE INTO site_settings VALUES (?, ?, ?)`, ['mastering_price', '20.00', now]);

      // 7. Initial Audit Log
      this.db.run(
        `INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `log_${Date.now()}`,
          'SYSTEM_INITIALIZED',
          'system',
          'system@celly.com',
          '127.0.0.1',
          JSON.stringify({ note: 'CELLY production database tables and seed records initialized.' }),
          now,
        ]
      );
    }
  }

  // --- QUERY UTILITIES ---
  public query<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return results;
  }

  public queryOne<T = any>(sql: string, params: any[] = []): T | null {
    const res = this.query<T>(sql, params);
    return res.length > 0 ? res[0] : null;
  }

  public run(sql: string, params: any[] = []): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(sql, params);
    this.persist();
  }

  public logAudit(eventType: string, details: Record<string, unknown>, userId?: string, userEmail?: string, ip?: string): void {
    const id = `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();
    this.run(
      `INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, eventType, userId || null, userEmail || null, ip || '127.0.0.1', JSON.stringify(details), now]
    );
  }

  // Generate unique slug
  public makeUniqueSlug(baseTitle: string, excludeId?: string): string {
    let slug = baseTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!slug) slug = 'beat';

    let testSlug = slug;
    let counter = 1;
    while (true) {
      const existing = this.queryOne<{ id: string }>(
        'SELECT id FROM beats WHERE slug = ?' + (excludeId ? ' AND id != ?' : ''),
        excludeId ? [testSlug, excludeId] : [testSlug]
      );
      if (!existing) return testSlug;
      testSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  // Record immediate transactional & confirmation emails
  public logEmail(
    orderId: string,
    recipientEmail: string,
    recipientName: string,
    subject: string,
    bodyHtml: string,
    bodyText: string,
    customerId?: string,
    attachments?: any[],
    emailType: string = 'general'
  ): string {
    const id = `eml_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();
    this.run(
      `INSERT INTO emails (id, order_id, customer_id, recipient_email, recipient_name, subject, body_html, body_text, sent_at, status, attachments, email_type, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        orderId,
        customerId || null,
        recipientEmail,
        recipientName,
        subject,
        bodyHtml,
        bodyText,
        now,
        'sent',
        attachments ? JSON.stringify(attachments) : null,
        emailType,
        null,
      ]
    );
    return id;
  }

  // Generate sequential Order ID: CELLY-2026-000101
  public generateOrderId(): string {
    const countRes = this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM orders;');
    const nextNum = (countRes?.count || 0) + 101;
    const year = new Date().getFullYear();
    return `CELLY-${year}-${String(nextNum).padStart(6, '0')}`;
  }

  // Generate unique License ID: LIC-2026-000201
  public generateLicenseId(): string {
    const countRes = this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM licenses;');
    const nextNum = (countRes?.count || 0) + 201;
    const year = new Date().getFullYear();
    return `LIC-${year}-${String(nextNum).padStart(6, '0')}`;
  }

  // Generate unique Mastering Order ID: MST-2026-000051
  public generateMasteringId(): string {
    const countRes = this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM mastering_orders;');
    const nextNum = (countRes?.count || 0) + 51;
    const year = new Date().getFullYear();
    return `MST-${year}-${String(nextNum).padStart(6, '0')}`;
  }
}

export const dbService = new DatabaseService();
