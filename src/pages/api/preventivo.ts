import type { APIRoute } from 'astro';
import { run } from '../../lib/db';
import { clientIp, hmac, rateLimit } from '../../lib/security';
import { sendMail, LEADS_TO } from '../../lib/email';
import { leadNotification, leadAutoReply } from '../../emails/templates';
import { subscribe, EMAIL_RE } from '../../lib/newsletter';
import { quoteServiceOptions } from '../../data/services';

export const prerender = false;

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? '').trim().slice(0, max);

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const reply = (status: number, body: Record<string, unknown>) =>
    wantsJson
      ? new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
      : status === 200
        ? redirect('/preventivo/grazie/', 303)
        : redirect('/preventivo/errore/', 303);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(400, { error: 'Richiesta non valida.' });
  }

  // Anti-spam: campo trappola, tempo minimo di compilazione, limite per IP
  const ip = clientIp(request, clientAddress);
  const ts = Number(form.get('ts') || 0);
  if (str(form, 'website')) return reply(200, { ok: true, redirect: '/preventivo/grazie/' });
  if (ts && Date.now() - ts < 2500) return reply(429, { error: 'Invio troppo rapido, riprova tra qualche secondo.' });
  if (!(await rateLimit(`lead:${hmac(ip)}`, 6, 3600))) {
    return reply(429, { error: 'Hai inviato troppe richieste. Riprova più tardi o chiamaci al 055 293285.' });
  }

  const data = {
    name: str(form, 'name', 120),
    phone: str(form, 'phone', 40),
    email: str(form, 'email', 200).toLowerCase(),
    comune: str(form, 'comune', 120),
    service: str(form, 'service', 120),
    timing: str(form, 'timing', 80),
    contact_pref: str(form, 'contact_pref', 80),
    message: str(form, 'message', 4000),
    privacy: form.get('privacy') === 'yes',
    newsletter: form.get('newsletter') === 'yes',
    source_page: str(form, 'source_page', 300),
    utm_source: str(form, 'utm_source', 120),
    utm_medium: str(form, 'utm_medium', 120),
    utm_campaign: str(form, 'utm_campaign', 200),
    gclid: str(form, 'gclid', 300),
  };

  const errors: Record<string, string> = {};
  if (data.name.length < 2) errors.name = 'Inserisci nome e cognome.';
  if (data.phone.replace(/\D/g, '').length < 6) errors.phone = 'Inserisci un numero di telefono valido.';
  if (!EMAIL_RE.test(data.email)) errors.email = 'Inserisci un indirizzo email valido.';
  if (!data.service || !quoteServiceOptions.includes(data.service)) errors.service = 'Seleziona il tipo di intervento.';
  if (!data.privacy) errors.privacy = 'È necessario dichiarare di aver letto l’informativa privacy.';
  if (Object.keys(errors).length) return reply(422, { error: 'Controlla i campi evidenziati.', errors });

  const { lastId } = await run(
    `INSERT INTO leads(name, phone, email, comune, service, timing, contact_pref, message, source_page, utm_source, utm_medium, utm_campaign, gclid,
       privacy_ack, newsletter_optin, ip_hash, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    [
      data.name, data.phone, data.email, data.comune, data.service, data.timing, data.contact_pref, data.message, data.source_page,
      data.utm_source, data.utm_medium, data.utm_campaign, data.gclid, data.newsletter ? 1 : 0, hmac(ip),
      (request.headers.get('user-agent') || '').slice(0, 300),
    ],
  );

  const lead = {
    id: lastId,
    ...data,
    utm: [data.utm_source, data.utm_medium, data.utm_campaign].filter(Boolean).join(' / ') || (data.gclid ? 'Google Ads (gclid)' : ''),
  };
  const notify = leadNotification(lead);
  const auto = leadAutoReply(lead);
  const [n, a] = await Promise.all([
    sendMail({ to: LEADS_TO, replyTo: data.email, ...notify }),
    sendMail({ to: data.email, replyTo: LEADS_TO, ...auto }),
  ]);
  await run('UPDATE leads SET notify_status = ?, autoreply_status = ? WHERE id = ?', [n.ok ? 'inviata' : `errore: ${n.error}`, a.ok ? 'inviata' : `errore: ${a.error}`, lastId]);

  if (data.newsletter) {
    try {
      await subscribe({ email: data.email, name: data.name, source: 'modulo-preventivo', ip, ua: request.headers.get('user-agent') || '' });
    } catch (err) {
      console.error('[newsletter] iscrizione da preventivo fallita', err);
    }
  }

  return reply(200, { ok: true, redirect: '/preventivo/grazie/' });
};
