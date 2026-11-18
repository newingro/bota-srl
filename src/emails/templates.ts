import { company } from '../config/site';
import { escapeHtml as e } from '../lib/security';
import { formatText } from '../lib/format';

const SITE = () => (process.env.SITE_URL || 'https://bota.srl').replace(/\/$/, '');
const ADMIN = () => (process.env.ADMIN_URL || `${SITE()}/admin`).replace(/\/$/, '');

const C = {
  ink: '#15191d',
  muted: '#5c656e',
  brand: '#a63d15',
  stone: '#f4f1ec',
  line: '#e3dcd2',
  dark: '#1b2126',
};

function shell(opts: { preheader?: string; body: string; footer?: string }) {
  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Bota s.r.l.</title></head>
<body style="margin:0;padding:0;background:${C.stone};font-family:Arial,Helvetica,sans-serif;color:${C.ink};">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(opts.preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.stone};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${C.line};">
    <tr><td style="background:${C.dark};padding:20px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="width:36px;height:36px;background:#b4441a;border-radius:8px;text-align:center;vertical-align:middle;color:#fff;font-weight:800;font-size:18px;">B</td>
        <td style="padding-left:12px;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.3px;">BOTA <span style="font-size:12px;font-weight:600;color:#c9d0d6;">s.r.l. · Impresa edile</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:32px 28px 8px;font-size:16px;line-height:1.6;">${opts.body}</td></tr>
    <tr><td style="padding:24px 28px 28px;border-top:1px solid ${C.line};font-size:13px;line-height:1.6;color:${C.muted};">
      <strong style="color:${C.ink};">${e(company.legalName)}</strong> · ${e(company.address.street)}, ${company.address.postalCode} ${e(company.address.city)} (${company.address.province})<br>
      Tel. <a href="${company.phone.href}" style="color:${C.brand};">${company.phone.display}</a> · Cell. <a href="${company.mobile.href}" style="color:${C.brand};">${company.mobile.display}</a> · <a href="mailto:${company.email}" style="color:${C.brand};">${company.email}</a><br>
      Orari ufficio: Lun–Ven 08:00–18:00 · Sab 08:00–17:00 · P.IVA ${company.vat}
      ${opts.footer ? `<br><br>${opts.footer}` : ''}
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function button(href: string, label: string, color = C.brand) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 8px 8px 0;display:inline-table;"><tr><td style="background:${color};border-radius:999px;"><a href="${href}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-weight:700;text-decoration:none;font-size:15px;">${label}</a></td></tr></table>`;
}

function rows(data: [string, string | null | undefined][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 20px;font-size:15px;">
  ${data
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:9px 10px;border-bottom:1px solid ${C.line};color:${C.muted};width:38%;vertical-align:top;">${e(k)}</td><td style="padding:9px 10px;border-bottom:1px solid ${C.line};vertical-align:top;">${e(v).replace(/\n/g, '<br>')}</td></tr>`,
    )
    .join('')}
  </table>`;
}

export type LeadData = {
  id: number;
  name: string;
  phone: string;
  email: string;
  comune?: string | null;
  service?: string | null;
  message?: string | null;
  timing?: string | null;
  contact_pref?: string | null;
  source_page?: string | null;
  utm?: string | null;
  newsletter?: boolean;
};

/** Email interna a info@bota.srl con la nuova richiesta di preventivo. */
export function leadNotification(l: LeadData) {
  const tel = 'tel:' + l.phone.replace(/[^\d+]/g, '');
  const subject = `Nuova richiesta preventivo: ${l.service || 'generica'} – ${l.name}${l.comune ? ` (${l.comune})` : ''}`;
  const body = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:1.5px;color:${C.brand};text-transform:uppercase;">Nuova richiesta dal sito</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">${e(l.name)} chiede un preventivo</h1>
    ${rows([
      ['Nome e cognome', l.name],
      ['Telefono', l.phone],
      ['Email', l.email],
      ['Comune dell’immobile', l.comune],
      ['Tipo di intervento', l.service],
      ['Tempistiche', l.timing],
      ['Preferenza di contatto', l.contact_pref],
      ['Messaggio', l.message],
      ['Iscrizione newsletter', l.newsletter ? 'Sì (in attesa di conferma via email)' : 'No'],
      ['Pagina di provenienza', l.source_page],
      ['Campagna', l.utm],
    ])}
    <p style="margin:0 0 6px;">${button(tel, 'Chiama ora')}${button(`mailto:${l.email}`, 'Rispondi via email', C.dark)}${button(`${ADMIN()}/richieste/${l.id}`, 'Apri nel gestionale', '#5c656e')}</p>
    <p style="font-size:13px;color:${C.muted};">Al cliente è stata inviata in automatico una email di conferma di ricezione.</p>`;
  return {
    subject,
    html: shell({ preheader: `${l.service || 'Richiesta'} – ${l.phone}`, body }),
    text: `Nuova richiesta preventivo\n\nNome: ${l.name}\nTelefono: ${l.phone}\nEmail: ${l.email}\nComune: ${l.comune || '-'}\nIntervento: ${l.service || '-'}\nTempistiche: ${l.timing || '-'}\nMessaggio:\n${l.message || '-'}\n\nGestionale: ${ADMIN()}/richieste/${l.id}`,
  };
}

/** Risposta automatica immediata al cliente. */
export function leadAutoReply(l: LeadData) {
  const first = l.name.split(' ')[0];
  const subject = 'Abbiamo ricevuto la tua richiesta di preventivo – Bota s.r.l.';
  const body = `
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">Grazie ${e(first)}, abbiamo ricevuto la tua richiesta!</h1>
    <p style="margin:0 0 14px;">Ti ringraziamo per aver scelto <strong>Bota s.r.l.</strong> Un nostro operatore ti chiamerà al più presto al numero <strong>${e(l.phone)}</strong> per approfondire le tue esigenze e fornirti tutti i dettagli del preventivo, oppure te lo invieremo direttamente via email.</p>
    <p style="margin:0 0 8px;font-weight:700;">Riepilogo della tua richiesta</p>
    ${rows([
      ['Tipo di intervento', l.service],
      ['Comune dell’immobile', l.comune],
      ['Tempistiche', l.timing],
      ['Messaggio', l.message],
    ])}
    ${
      l.newsletter
        ? `<p style="margin:0 0 14px;padding:12px 14px;background:${C.stone};border-radius:10px;font-size:14px;">Hai chiesto di ricevere offerte e coupon: riceverai a breve un’email separata per <strong>confermare l’iscrizione</strong>.</p>`
        : ''
    }
    <p style="margin:0 0 6px;">Hai fretta o vuoi aggiungere dettagli? Chiamaci o scrivici:</p>
    <p style="margin:0 0 18px;">${button(company.phone.href, `Chiama ${company.phone.display}`)}${button(company.whatsapp.href.split('?')[0], 'Scrivici su WhatsApp', '#1f7a45')}</p>
    <p style="margin:0 0 24px;">A presto,<br><strong>Il team di Bota s.r.l.</strong></p>`;
  return {
    subject,
    html: shell({
      preheader: 'Un nostro operatore ti chiamerà al più presto per i dettagli del preventivo.',
      body,
      footer: `Ricevi questa email perché hai inviato una richiesta di preventivo su ${SITE().replace('https://', '')}. I tuoi dati sono trattati secondo la nostra <a href="${SITE()}/privacy-policy/" style="color:${C.brand};">informativa privacy</a>.`,
    }),
    text: `Grazie ${first}, abbiamo ricevuto la tua richiesta di preventivo.\n\nUn nostro operatore ti chiamerà al più presto al numero ${l.phone} per fornirti i dettagli del preventivo, oppure te lo invieremo via email.\n\nPer qualsiasi necessità: ${company.phone.display} – ${company.email}\n\nIl team di Bota s.r.l.`,
  };
}

/** Double opt-in: conferma dell'iscrizione alla newsletter. */
export function newsletterConfirm(token: string) {
  const url = `${SITE()}/newsletter/conferma/?t=${encodeURIComponent(token)}`;
  const body = `
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">Conferma la tua iscrizione</h1>
    <p style="margin:0 0 14px;">Ciao! Per iniziare a ricevere offerte, coupon e novità di <strong>Bota s.r.l.</strong> conferma il tuo indirizzo email con un clic:</p>
    <p style="margin:0 0 18px;">${button(url, 'Confermo l’iscrizione')}</p>
    <p style="margin:0 0 24px;font-size:14px;color:${C.muted};">Se non hai richiesto tu l’iscrizione, ignora questa email: senza conferma non riceverai alcuna comunicazione.</p>`;
  return {
    subject: 'Conferma la tua iscrizione alla newsletter di Bota s.r.l.',
    html: shell({ preheader: 'Un clic per confermare e ricevere offerte e coupon.', body }),
    text: `Conferma la tua iscrizione alla newsletter di Bota s.r.l.: ${url}`,
  };
}

export type CampaignData = {
  subject: string;
  preheader?: string | null;
  title?: string | null;
  body?: string | null;
  coupon_code?: string | null;
  coupon_text?: string | null;
  coupon_expiry?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
};

/** Email della campagna newsletter (con coupon opzionale e link di disiscrizione). */
export function campaignEmail(c: CampaignData, unsubscribeToken: string) {
  const unsub = `${SITE()}/newsletter/disiscrizione/?t=${encodeURIComponent(unsubscribeToken)}`;
  const expiry = c.coupon_expiry ? new Date(c.coupon_expiry).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const coupon = c.coupon_code
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 22px;"><tr><td style="border:2px dashed ${C.brand};border-radius:14px;padding:20px;text-align:center;background:#fdf4ef;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.brand};">Il tuo coupon</p>
        <p style="margin:0 0 6px;font-size:30px;font-weight:800;letter-spacing:2px;font-family:'Courier New',monospace;">${e(c.coupon_code)}</p>
        ${c.coupon_text ? `<p style="margin:0 0 4px;font-size:15px;">${e(c.coupon_text)}</p>` : ''}
        ${expiry ? `<p style="margin:0;font-size:13px;color:${C.muted};">Valido fino al ${e(expiry)}</p>` : ''}
      </td></tr></table>`
    : '';
  const body = `
    ${c.title ? `<h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;">${e(c.title)}</h1>` : ''}
    <div style="margin:0 0 18px;">${formatText(c.body || '', { email: true })}</div>
    ${coupon}
    ${c.cta_label && c.cta_url ? `<p style="margin:0 0 24px;">${button(e(c.cta_url), e(c.cta_label))}</p>` : ''}`;
  return {
    subject: c.subject,
    html: shell({
      preheader: c.preheader || '',
      body,
      footer: `Ricevi questa email perché hai dato il consenso a ricevere offerte e novità da Bota s.r.l. <a href="${unsub}" style="color:${C.brand};">Annulla l’iscrizione</a> con un clic.`,
    }),
    headers: {
      'List-Unsubscribe': `<${unsub}>, <mailto:${company.email}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}
