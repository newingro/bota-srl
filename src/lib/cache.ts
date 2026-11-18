import type { AstroGlobal } from 'astro';

/**
 * Pagine pubbliche generate dal server (home, lavori): vengono salvate nella cache CDN
 * per 5 minuti e servite istantaneamente; le modifiche dal gestionale compaiono entro pochi minuti.
 */
export function cacheHeaders(Astro: AstroGlobal, sMaxAge = 300) {
  Astro.response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  Astro.response.headers.set('CDN-Cache-Control', `public, s-maxage=${sMaxAge}, stale-while-revalidate=86400`);
}
