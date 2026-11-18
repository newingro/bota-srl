import type { AstroCookies } from 'astro';
import { get, run } from './db';
import { randomToken, sha256 } from './security';

export const SESSION_COOKIE = 'bota_admin';
const SESSION_DAYS = 7;

export type AdminUser = { id: number; email: string; name: string | null };

const isProd = () => process.env.NODE_ENV === 'production' && !process.env.ALLOW_INSECURE_COOKIES;

export async function createSession(cookies: AstroCookies, userId: number) {
  const token = randomToken(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await run('INSERT INTO sessions(id, user_id, expires_at) VALUES (?, ?, ?)', [sha256(token), userId, expires.toISOString()]);
  await run("UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?", [userId]);
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd(),
    sameSite: 'strict',
    path: '/',
    expires,
  });
}

export async function getUser(cookies: AstroCookies): Promise<AdminUser | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await get<AdminUser & { expires_at: string }>(
    `SELECT u.id, u.email, u.name, s.expires_at FROM sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.id = ?`,
    [sha256(token)],
  );
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await run('DELETE FROM sessions WHERE id = ?', [sha256(token)]);
    return null;
  }
  return { id: Number(row.id), email: String(row.email), name: (row.name as string) ?? null };
}

export async function destroySession(cookies: AstroCookies) {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) await run('DELETE FROM sessions WHERE id = ?', [sha256(token)]);
  cookies.delete(SESSION_COOKIE, { path: '/' });
}
