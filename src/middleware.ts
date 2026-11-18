import { defineMiddleware } from 'astro:middleware';
import { getUser } from './lib/auth';

/**
 * - Instrada admin.bota.srl verso l'area /admin (ADMIN_HOST=admin.bota.srl).
 * - Protegge l'area riservata: login obbligatorio, controllo Origin anti-CSRF, noindex, no-cache.
 * - Aggiunge header di sicurezza alle pagine generate dal server.
 */
const ADMIN_HOST = (process.env.ADMIN_HOST || '').toLowerCase();
const PUBLIC_ADMIN = ['/admin/login', '/admin/logout'];
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

function isAdminPath(p: string) {
  return p === '/admin' || p.startsWith('/admin/') || p.startsWith('/api/admin/');
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  if (ctx.isPrerendered) return next();
  const url = ctx.url;
  const host = (ctx.request.headers.get('x-forwarded-host') || ctx.request.headers.get('host') || url.host).toLowerCase();
  const onAdminHost = !!ADMIN_HOST && host === ADMIN_HOST;
  let path = url.pathname;

  // admin.bota.srl/qualcosa → /admin/qualcosa
  if (onAdminHost && !isAdminPath(path) && !path.startsWith('/_astro/') && !path.startsWith('/media/') && !path.startsWith('/api/')) {
    return ctx.rewrite(new URL(`/admin${path === '/' ? '' : path}${url.search}`, url));
  }
  // bota.srl/admin → https://admin.bota.srl
  if (ADMIN_HOST && !onAdminHost && isAdminPath(path) && !path.startsWith('/api/')) {
    return ctx.redirect(`https://${ADMIN_HOST}${path.replace(/^\/admin/, '') || '/'}${url.search}`, 301);
  }

  ctx.locals.adminBase = onAdminHost ? '' : '/admin';

  if (isAdminPath(path)) {
    // Anti-CSRF: le richieste che modificano dati devono provenire dallo stesso sito
    if (!SAFE.has(ctx.request.method)) {
      const origin = ctx.request.headers.get('origin');
      const site = ctx.request.headers.get('sec-fetch-site');
      const okOrigin = origin ? new URL(origin).host.toLowerCase() === host : site === 'same-origin' || site === null;
      if (!okOrigin) return new Response('Richiesta non consentita', { status: 403 });
    }
    path = path.replace(/\/$/, '') || '/';
    const user = await getUser(ctx.cookies);
    ctx.locals.user = user;
    if (!user && !PUBLIC_ADMIN.includes(path)) {
      if (path.startsWith('/api/')) return new Response(JSON.stringify({ error: 'Sessione scaduta' }), { status: 401 });
      const nextUrl = url.pathname + url.search;
      return ctx.redirect(`${ctx.locals.adminBase}/login?next=${encodeURIComponent(nextUrl)}`, 302);
    }
    const res = await next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Referrer-Policy', 'same-origin');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    return res;
  }

  const res = await next();
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  return res;
});
