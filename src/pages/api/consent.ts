import type { APIRoute } from 'astro';
import { run } from '../../lib/db';
import { clientIp, hmac, rateLimit, truncateIp } from '../../lib/security';

export const prerender = false;

/** Registro dei consensi cookie (prova del consenso, art. 7.1 GDPR). */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const ip = clientIp(request, clientAddress);
    if (!(await rateLimit(`consent:${hmac(ip)}`, 60, 3600))) return new Response(null, { status: 429 });
    const body = (await request.json()) as { id?: string; v?: string; c?: Record<string, boolean>; action?: string; url?: string };
    if (!body.id || typeof body.id !== 'string' || body.id.length > 64 || !body.c) return new Response(null, { status: 400 });
    const choices = { nec: true, exp: !!body.c.exp, stat: !!body.c.stat, mkt: !!body.c.mkt };
    await run('INSERT INTO consent_log(consent_id, version, choices, action, url, ip_trunc, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      body.id,
      String(body.v ?? '').slice(0, 40),
      JSON.stringify(choices),
      String(body.action ?? '').slice(0, 40),
      String(body.url ?? '').slice(0, 200),
      truncateIp(ip),
      (request.headers.get('user-agent') || '').slice(0, 300),
    ]);
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
};
