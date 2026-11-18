import { all, get, run } from './db';
import { sendMail } from './email';
import { campaignEmail, type CampaignData } from '../emails/templates';
import { fstr } from './admin';

export function campaignFields(f: FormData) {
  return {
    subject: fstr(f, 'subject', 150),
    preheader: fstr(f, 'preheader', 150) || null,
    title: fstr(f, 'title', 150) || null,
    body: fstr(f, 'body', 20000) || null,
    coupon_code: fstr(f, 'coupon_code', 40).toUpperCase() || null,
    coupon_text: fstr(f, 'coupon_text', 200) || null,
    coupon_expiry: fstr(f, 'coupon_expiry', 10) || null,
    cta_label: fstr(f, 'cta_label', 60) || null,
    cta_url: fstr(f, 'cta_url', 300) || null,
  };
}

export async function sendTest(c: CampaignData, to: string) {
  const mail = campaignEmail(c, 'anteprima');
  return sendMail({ to, subject: `[PROVA] ${mail.subject}`, html: mail.html, headers: mail.headers });
}

/**
 * Invia la campagna a tutti gli iscritti confermati che non l'hanno ancora ricevuta.
 * Riprendibile: se l'invio si interrompe, rilanciandolo si prosegue da dove era arrivato.
 */
export async function sendCampaign(id: number) {
  const c = await get<CampaignData & { status: string }>('SELECT * FROM campaigns WHERE id = ?', [id]);
  if (!c) throw new Error('Campagna non trovata');
  const recipients = await all<{ id: number; email: string; token: string }>(
    `SELECT s.id, s.email, s.token FROM subscribers s WHERE s.status = 'confirmed'
     AND NOT EXISTS (SELECT 1 FROM campaign_sends cs WHERE cs.campaign_id = ? AND cs.subscriber_id = s.id AND cs.status = 'inviata')`,
    [id],
  );
  await run("UPDATE campaigns SET status = 'sending', updated_at = datetime('now') WHERE id = ?", [id]);
  let sent = 0;
  let failed = 0;
  const queue = [...recipients];
  const worker = async () => {
    for (let r = queue.shift(); r; r = queue.shift()) {
      const mail = campaignEmail(c, r.token);
      const res = await sendMail({ to: r.email, subject: mail.subject, html: mail.html, headers: mail.headers });
      await run(
        `INSERT INTO campaign_sends(campaign_id, subscriber_id, email, status, error) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(campaign_id, subscriber_id) DO UPDATE SET status = excluded.status, error = excluded.error, sent_at = datetime('now')`,
        [id, r.id, r.email, res.ok ? 'inviata' : 'errore', res.error ?? null],
      );
      res.ok ? sent++ : failed++;
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  const totals = await get<{ ok: number; ko: number }>(
    "SELECT SUM(status = 'inviata') AS ok, SUM(status = 'errore') AS ko FROM campaign_sends WHERE campaign_id = ?",
    [id],
  );
  await run("UPDATE campaigns SET status = 'sent', sent_at = datetime('now'), recipients = ?, sent_count = ?, failed_count = ? WHERE id = ?", [
    Number(totals?.ok ?? 0) + Number(totals?.ko ?? 0),
    Number(totals?.ok ?? 0),
    Number(totals?.ko ?? 0),
    id,
  ]);
  return { sent, failed };
}
