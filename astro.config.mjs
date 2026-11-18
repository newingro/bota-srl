// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

const isVercel = !!process.env.VERCEL;
const SITE = process.env.SITE_URL || 'https://bota.srl';

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  output: 'static', // pagine statiche di default; le pagine dinamiche usano `prerender = false`
  adapter: isVercel ? vercel({ maxDuration: 120 }) : node({ mode: 'standalone' }),
  build: {
    format: 'directory',
    inlineStylesheets: 'always', // CSS critico inline: nessuna richiesta bloccante
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
  image: {
    responsiveStyles: true,
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Archivo',
      cssVariable: '--font-archivo',
      fallbacks: ['Arial', 'sans-serif'],
      display: 'swap',
      options: {
        variants: [
          { src: ['./src/assets/fonts/archivo-latin-wght-normal.woff2'], weight: '100 900', style: 'normal' },
        ],
      },
    },
  ],
  security: {
    // Protezione CSRF gestita nel middleware solo per l'area riservata (vedi src/middleware.ts):
    // gli endpoint pubblici devono accettare anche POST senza Origin (es. disiscrizione one-click dai client email).
    checkOrigin: false,
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://*.google-analytics.com https://*.googletagmanager.com https://*.google.com https://*.gstatic.com https://www.facebook.com",
        "font-src 'self'",
        "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.google.com https://www.facebook.com",
        "frame-src https://www.google.com https://maps.google.com",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
      ],
      scriptDirective: {
        resources: ["'self'", 'https://www.googletagmanager.com', 'https://connect.facebook.net'],
      },
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'"],
      },
    },
  },
});
