import type { APIRoute } from 'astro';
import { all } from '../lib/db';
import { mainServices } from '../data/services';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.origin ?? 'https://bota.srl').replace(/\/$/, '');
  const pages = ['/', '/servizi/', ...mainServices.map((s) => `/servizi/${s.slug}/`), '/lavori/', '/chi-siamo/', '/contatti/', '/privacy-policy/', '/cookie-policy/'];
  const works = await all<{ slug: string; updated_at: string }>("SELECT slug, updated_at FROM works WHERE status = 'published' ORDER BY sort").catch(() => []);
  const urls = [
    ...pages.map((p) => `<url><loc>${base}${p}</loc></url>`),
    ...works.map((w) => `<url><loc>${base}/lavori/${w.slug}/</loc><lastmod>${String(w.updated_at).slice(0, 10)}</lastmod></url>`),
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0', 'CDN-Cache-Control': 'public, s-maxage=3600' },
  });
};
