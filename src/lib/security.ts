import { createHash, createHmac, randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { run, get } from './db';

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SECRET = process.env.APP_SECRET || 'dev-secret-da-cambiare-in-produzione';

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(v: string) {
  return createHash('sha256').update(v).digest('hex');
}

export function hmac(v: string) {
  return createHmac('sha256', SECRET).update(v).digest('base64url');
}

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [alg, saltB64, keyB64] = stored.split('$');
  if (alg !== 'scrypt' || !saltB64 || !keyB64) return false;
  const key = Buffer.from(keyB64, 'base64');
  const test = await scrypt(pw, Buffer.from(saltB64, 'base64'), key.length);
  return timingSafeEqual(key, test);
}

/** IP del client (dietro proxy/CDN). */
export function clientIp(request: Request, fallback?: string) {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') || fallback || '';
}

/** IP troncato (ultimo ottetto azzerato): minimizzazione dei dati per i log. */
export function truncateIp(ip: string) {
  if (!ip) return '';
  if (ip.includes('.')) return ip.split('.').slice(0, 3).join('.') + '.0';
  return ip.split(':').slice(0, 3).join(':') + '::';
}

/** Rate limit a finestra fissa salvato su DB (funziona anche su serverless). */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const now = Math.floor(Date.now() / 1000);
  const row = await get<{ count: number; window_start: number }>('SELECT count, window_start FROM rate_limits WHERE key = ?', [key]);
  if (!row || now - Number(row.window_start) >= windowSec) {
    await run('INSERT INTO rate_limits(key, count, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start', [key, now]);
    return true;
  }
  if (Number(row.count) >= limit) return false;
  await run('UPDATE rate_limits SET count = count + 1 WHERE key = ?', [key]);
  return true;
}

export function escapeHtml(s: unknown) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
