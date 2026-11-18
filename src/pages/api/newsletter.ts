import type { APIRoute } from 'astro';
import { clientIp, hmac, rateLimit } from '../../lib/security';
import { subscribe } from '../../lib/newsletter';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const reply = (status: number, body: Record<string, unknown>) =>
    wantsJson
      ? new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
      : redirect(status === 200 ? '/newsletter/iscrizione/' : '/newsletter/iscrizione/?errore=1', 303);

  const form = await request.formData().catch(() => null);
  if (!form) return reply(400, { error: 'Richiesta non valida.' });
  const ok = { message: 'Quasi fatto! Ti abbiamo inviato un’email: clicca il link per confermare l’iscrizione.' };
  if (String(form.get('website') ?? '')) return reply(200, ok);
  const ts = Number(form.get('ts') || 0);
  if (ts && Date.now() - ts < 1500) return reply(429, { error: 'Invio troppo rapido, riprova.' });
  if (form.get('consent') !== 'yes') return reply(422, { error: 'Per iscriverti è necessario il consenso.' });
  const ip = clientIp(request, clientAddress);
  if (!(await rateLimit(`nl:${hmac(ip)}`, 5, 3600))) return reply(429, { error: 'Troppi tentativi, riprova più tardi.' });
  try {
    const res = await subscribe({
      email: String(form.get('email') ?? ''),
      source: String(form.get('source') ?? 'sito').slice(0, 40),
      ip,
      ua: request.headers.get('user-agent') || '',
    });
    if (res.status === 'already') return reply(200, { message: 'Sei già iscritto alla nostra newsletter. Grazie!' });
    return reply(200, ok);
  } catch (err) {
    return reply(422, { error: (err as Error).message });
  }
};
