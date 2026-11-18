import nodemailer, { type Transporter } from 'nodemailer';
import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * Invio email. Tre modalità, scelte in base alle variabili d'ambiente:
 *  1. SMTP (consigliato con la casella info@bota.srl):  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *  2. Resend (API HTTP, ottimo per la newsletter):     RESEND_API_KEY
 *  3. Sviluppo: le email vengono salvate in .data/outbox/ come file HTML (nessun invio reale)
 */
export type Mail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export const MAIL_FROM = process.env.MAIL_FROM || 'Bota s.r.l. <info@bota.srl>';
export const LEADS_TO = process.env.LEADS_TO || 'info@bota.srl';

let transporter: Transporter | null = null;
function smtp() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export function mailMode() {
  if (process.env.SMTP_HOST) return 'smtp';
  if (process.env.RESEND_API_KEY) return 'resend';
  return 'outbox';
}

export async function sendMail(mail: Mail): Promise<{ ok: boolean; error?: string }> {
  try {
    const mode = mailMode();
    if (mode === 'smtp') {
      await smtp().sendMail({ from: MAIL_FROM, ...mail });
    } else if (mode === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: MAIL_FROM,
          to: [mail.to],
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          reply_to: mail.replyTo,
          headers: mail.headers,
        }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    } else {
      mkdirSync('.data/outbox', { recursive: true });
      const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${mail.to.replace(/[^a-z0-9]/gi, '_')}`;
      writeFileSync(`.data/outbox/${name}.html`, mail.html);
      writeFileSync(
        `.data/outbox/${name}.json`,
        JSON.stringify({ from: MAIL_FROM, to: mail.to, subject: mail.subject, replyTo: mail.replyTo, headers: mail.headers }, null, 2),
      );
      console.info(`[email:outbox] ${mail.subject} → ${mail.to}`);
    }
    return { ok: true };
  } catch (err) {
    console.error('[email] invio fallito', err);
    return { ok: false, error: (err as Error).message };
  }
}
