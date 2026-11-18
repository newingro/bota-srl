import { get, run } from './db';
import { randomToken, truncateIp } from './security';
import { sendMail } from './email';
import { newsletterConfirm } from '../emails/templates';
import { legal } from '../config/site';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Iscrizione con double opt-in: l'indirizzo resta "in attesa" finché l'utente non clicca
 * il link di conferma. Vengono salvati testo e versione del consenso, data, IP troncato
 * e user agent come prova del consenso (art. 7.1 GDPR).
 */
export async function subscribe(opts: { email: string; name?: string; source: string; ip: string; ua: string }) {
  const email = opts.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) throw new Error('Indirizzo email non valido.');
  const existing = await get<{ id: number; status: string; token: string }>('SELECT id, status, token FROM subscribers WHERE email = ?', [email]);
  if (existing?.status === 'confirmed') return { status: 'already' as const };

  const token = randomToken(24);
  const consent = [legal.newsletterConsentText, legal.newsletterConsentVersion, truncateIp(opts.ip), opts.ua.slice(0, 300)];
  if (existing) {
    await run(
      `UPDATE subscribers SET status = 'pending', token = ?, source = ?, consent_text = ?, consent_version = ?, consent_ip = ?, consent_ua = ?,
       created_at = datetime('now'), confirmed_at = NULL, unsubscribed_at = NULL WHERE id = ?`,
      [token, opts.source, ...consent, existing.id],
    );
  } else {
    await run(
      `INSERT INTO subscribers(email, name, status, token, source, consent_text, consent_version, consent_ip, consent_ua) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [email, opts.name || null, token, opts.source, ...consent],
    );
  }
  const mail = newsletterConfirm(token);
  await sendMail({ to: email, ...mail });
  return { status: 'pending' as const };
}

export async function confirm(token: string, ip: string) {
  const s = await get<{ id: number; status: string }>('SELECT id, status FROM subscribers WHERE token = ?', [token]);
  if (!s) return false;
  if (s.status !== 'confirmed') {
    await run("UPDATE subscribers SET status = 'confirmed', confirmed_at = datetime('now'), confirmed_ip = ? WHERE id = ?", [truncateIp(ip), s.id]);
  }
  return true;
}

export async function unsubscribe(token: string) {
  const s = await get<{ id: number }>('SELECT id FROM subscribers WHERE token = ?', [token]);
  if (!s) return false;
  await run("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = datetime('now') WHERE id = ?", [s.id]);
  return true;
}
