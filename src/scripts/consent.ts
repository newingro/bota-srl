/**
 * Gestione del consenso cookie (conforme a Linee guida Garante Privacy 10/06/2021,
 * GDPR art. 7 e Google Consent Mode v2 in modalità "base"):
 *
 *  - Nessuno script di terze parti è presente nell'HTML: GA4, Google Ads, Meta Pixel e
 *    Google Maps vengono caricati SOLO dopo il consenso per la relativa finalità.
 *  - La scelta (accetta / rifiuta / personalizza) viene salvata in un cookie tecnico
 *    di prima parte per 6 mesi e registrata lato server (prova del consenso, art. 7.1 GDPR).
 *  - Il consenso può essere modificato o revocato in ogni momento ("Preferenze cookie").
 */

export type Category = 'exp' | 'stat' | 'mkt';
export type Choices = Record<Category, boolean>;
type Stored = { v: string; id: string; ts: number; c: Choices };

const COOKIE = 'bota_consent';
const MAX_AGE_DAYS = 180; // 6 mesi: il banner non viene ri-proposto prima (salvo modifiche)

const body = document.body;
const VERSION = body.dataset.consentVersion || '1';
const GA_ID = body.dataset.ga || '';
const ADS_ID = body.dataset.ads || '';
const PIXEL_ID = body.dataset.pixel || '';
const ADS_LABEL = body.dataset.adsLabel || '';

/** Evento di conversione sulla pagina "grazie": conteggiato una sola volta per sessione. */
function conversionPending() {
  if (!body.dataset.conversion) return false;
  try {
    if (sessionStorage.getItem('bota_conv')) return false;
    sessionStorage.setItem('bota_conv', String(Date.now()));
  } catch {
    /* ignora */
  }
  return true;
}
let conversion: boolean | null = null;
const isConversion = () => (conversion ??= conversionPending());

function readCookie(): Stored | null {
  try {
    const raw = document.cookie.split('; ').find((c) => c.startsWith(COOKIE + '='));
    if (!raw) return null;
    const data = JSON.parse(decodeURIComponent(raw.slice(COOKIE.length + 1))) as Stored;
    if (data.v !== VERSION) return null; // informativa cambiata: richiedere di nuovo
    return data;
  } catch {
    return null;
  }
}

function writeCookie(data: Stored) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(data))}; Max-Age=${MAX_AGE_DAYS * 86400}; Path=/; SameSite=Lax${secure}`;
}

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

let state: Stored | null = readCookie();

export function getConsent(): Choices | null {
  return state?.c ?? null;
}

export function hasConsent(cat: Category) {
  return !!state?.c[cat];
}

/** Rimuove i cookie di terze parti impostati sul dominio dopo una revoca. */
function purgeCookies(prefixes: string[]) {
  const host = location.hostname;
  const domains = ['', host, '.' + host, '.' + host.split('.').slice(-2).join('.')];
  document.cookie.split('; ').forEach((c) => {
    const name = c.split('=')[0];
    if (prefixes.some((p) => name.startsWith(p))) {
      domains.forEach((d) => {
        document.cookie = `${name}=; Max-Age=0; Path=/${d ? '; Domain=' + d : ''}`;
      });
    }
  });
}

/* ------------------------------------------------------------------ Google */
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq: unknown;
  }
}

let googleLoaded = false;
function loadGoogle(c: Choices) {
  if (!GA_ID && !ADS_ID) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  const consentState = {
    analytics_storage: c.stat ? 'granted' : 'denied',
    ad_storage: c.mkt ? 'granted' : 'denied',
    ad_user_data: c.mkt ? 'granted' : 'denied',
    ad_personalization: c.mkt ? 'granted' : 'denied',
  };
  if (!googleLoaded) {
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500,
    });
    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('consent', 'update', consentState);
    window.gtag('js', new Date());
    if (GA_ID && c.stat) window.gtag('config', GA_ID, { anonymize_ip: true });
    if (ADS_ID && c.mkt) window.gtag('config', ADS_ID);
    if (isConversion()) {
      if (GA_ID && c.stat) window.gtag('event', 'generate_lead', { form: 'preventivo' });
      if (ADS_ID && ADS_LABEL && c.mkt) window.gtag('event', 'conversion', { send_to: `${ADS_ID}/${ADS_LABEL}` });
    }
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID || ADS_ID}`;
    document.head.appendChild(s);
    googleLoaded = true;
  } else {
    window.gtag('consent', 'update', consentState);
  }
}

/* ------------------------------------------------------------------- Meta */
let pixelLoaded = false;
function loadPixel() {
  if (!PIXEL_ID || pixelLoaded) return;
  const n = function (...args: unknown[]) {
    // @ts-expect-error snippet ufficiale Meta
    n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
  } as Window['fbq'];
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];
  window.fbq = n;
  window._fbq = n;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
  if (isConversion()) window.fbq('track', 'Lead');
  pixelLoaded = true;
}

/** Applica le scelte: carica gli script consentiti e notifica i componenti (es. mappe). */
function apply(c: Choices, previous: Choices | null) {
  if (c.stat || c.mkt) loadGoogle(c);
  if (c.mkt) loadPixel();
  // Revoca di un consenso già dato: pulizia cookie e ricarica per scaricare gli script
  const revoked = previous && ((previous.stat && !c.stat) || (previous.mkt && !c.mkt) || (previous.exp && !c.exp));
  if (revoked) {
    if (googleLoaded) window.gtag('consent', 'update', { analytics_storage: c.stat ? 'granted' : 'denied', ad_storage: c.mkt ? 'granted' : 'denied', ad_user_data: c.mkt ? 'granted' : 'denied', ad_personalization: c.mkt ? 'granted' : 'denied' });
    if (previous!.stat && !c.stat) purgeCookies(['_ga', '_gid', '_gat']);
    if (previous!.mkt && !c.mkt) purgeCookies(['_gcl', '_fbp', '_fbc']);
    location.reload();
    return;
  }
  document.dispatchEvent(new CustomEvent('consent:change', { detail: c }));
}

export function saveConsent(c: Choices, action: string) {
  const previous = state?.c ?? null;
  state = { v: VERSION, id: state?.id || uuid(), ts: Date.now(), c };
  writeCookie(state);
  // Registro dei consensi lato server (prova del consenso)
  const payload = JSON.stringify({ id: state.id, v: VERSION, c, action, url: location.pathname });
  try {
    if (!navigator.sendBeacon?.('/api/consent', new Blob([payload], { type: 'application/json' }))) {
      fetch('/api/consent', { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true });
    }
  } catch {
    /* il salvataggio locale resta valido */
  }
  apply(c, previous);
}

/** Concede una singola finalità (es. click su "Mostra mappa"). */
export function grant(cat: Category) {
  const c: Choices = { exp: false, stat: false, mkt: false, ...(state?.c ?? {}) };
  c[cat] = true;
  saveConsent(c, `grant_${cat}`);
}

export function init(onNeedBanner: () => void) {
  if (state) apply(state.c, null);
  else onNeedBanner();
}

/** Tracciamento eventi di conversione (solo se consentito). */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (googleLoaded && window.gtag) window.gtag('event', event, params);
}
