import { createClient, type Client, type InValue } from '@libsql/client';
import { mkdirSync } from 'node:fs';

/**
 * Database libSQL/SQLite.
 * - In locale: file `.data/bota.db` (nessuna configurazione necessaria).
 * - In produzione: Turso (DATABASE_URL=libsql://... + DATABASE_AUTH_TOKEN).
 */
let client: Client | null = null;
let migrated: Promise<void> | null = null;

function getClient(): Client {
  if (client) return client;
  const url = process.env.DATABASE_URL || 'file:.data/bota.db';
  if (url.startsWith('file:')) mkdirSync('.data', { recursive: true });
  client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  return client;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    comune TEXT,
    service TEXT,
    message TEXT,
    timing TEXT,
    contact_pref TEXT,
    status TEXT NOT NULL DEFAULT 'nuova',
    notes TEXT,
    source_page TEXT,
    utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, gclid TEXT,
    privacy_ack INTEGER NOT NULL DEFAULT 0,
    newsletter_optin INTEGER NOT NULL DEFAULT 0,
    notify_status TEXT,
    autoreply_status TEXT,
    ip_hash TEXT,
    user_agent TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS leads_status ON leads(status, created_at)`,
  `CREATE TABLE IF NOT EXISTS works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    service TEXT,
    location TEXT,
    year TEXT,
    duration TEXT,
    client_type TEXT,
    summary TEXT,
    challenge TEXT,
    solution TEXT,
    result TEXT,
    cover_image_id INTEGER,
    status TEXT NOT NULL DEFAULT 'draft',
    featured INTEGER NOT NULL DEFAULT 0,
    is_example INTEGER NOT NULL DEFAULT 0,
    sort INTEGER NOT NULL DEFAULT 0,
    seo_title TEXT,
    seo_description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    published_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
    alt TEXT NOT NULL DEFAULT '',
    phase TEXT NOT NULL DEFAULT '',
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    variants TEXT NOT NULL,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS images_work ON images(work_id, sort)`,
  `CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    token TEXT NOT NULL,
    source TEXT,
    consent_text TEXT NOT NULL,
    consent_version TEXT NOT NULL,
    consent_ip TEXT,
    consent_ua TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    confirmed_at TEXT,
    confirmed_ip TEXT,
    unsubscribed_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    preheader TEXT,
    title TEXT,
    body TEXT,
    coupon_code TEXT,
    coupon_text TEXT,
    coupon_expiry TEXT,
    cta_label TEXT,
    cta_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    recipients INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sent_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS campaign_sends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    subscriber_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    sent_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(campaign_id, subscriber_id)
  )`,
  `CREATE TABLE IF NOT EXISTS consent_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consent_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    version TEXT,
    choices TEXT NOT NULL,
    action TEXT,
    url TEXT,
    ip_trunc TEXT,
    user_agent TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS consent_id ON consent_log(consent_id)`,
  `CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    window_start INTEGER NOT NULL
  )`,
];

async function migrate() {
  const c = getClient();
  await c.execute('PRAGMA foreign_keys = ON').catch(() => {});
  for (const sql of SCHEMA) await c.execute(sql);
}

export async function db(): Promise<Client> {
  const c = getClient();
  if (!migrated) migrated = migrate();
  await migrated;
  return c;
}

export type Row = Record<string, unknown>;

export async function all<T = Row>(sql: string, args: InValue[] = []): Promise<T[]> {
  const res = await (await db()).execute({ sql, args });
  return res.rows.map((r) => ({ ...r })) as T[];
}

export async function get<T = Row>(sql: string, args: InValue[] = []): Promise<T | undefined> {
  return (await all<T>(sql, args))[0];
}

export async function run(sql: string, args: InValue[] = []) {
  const res = await (await db()).execute({ sql, args });
  return { lastId: Number(res.lastInsertRowid ?? 0), changes: res.rowsAffected };
}
