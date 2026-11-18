// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

const isVercel = !!process.env.VERCEL;

/**
 * Su Vercel aggiunge all'output di build gli header di sicurezza e il "noindex"
 * per gli indirizzi di anteprima (*.vercel.app), così Google indicizza solo bota.srl.
 */
const vercelRoutes = {
  name: 'bota-vercel-routes',
  hooks: {
    'astro:build:done': async () => {
      if (!isVercel) return;
      const { readFile, writeFile } = await import('node:fs/promises');
      const file = '.vercel/output/config.json';
      const config = JSON.parse(await readFile(file, 'utf8'));
      config.routes = [
        {
          src: '^/(.*)$',
          headers: {
            'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'X-Frame-Options': 'SAMEORIGIN',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          continue: true,
        },
        {
          src: '^/(.*)$',
          has: [{ type: 'host', value: '.*\\.vercel\\.app' }],
          headers: { 'X-Robots-Tag': 'noindex, nofollow' },
          continue: true,
        },
        ...config.routes,
      ];
      await writeFile(file, JSON.stringify(config, null, 2));
    },
  },
};
const SITE = process.env.SITE_URL || 'https://bota.srl';

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  output: 'static', // pagine statiche di default; le pagine dinamiche usano `prerender = false`
  adapter: isVercel
    ? vercel({
        maxDuration: 120,
        // database di esempio (modalità demo) e binario nativo di libSQL (caricato dinamicamente)
        includeFiles: [
          './demo/bota-demo.db',
          './node_modules/@libsql/linux-x64-gnu/index.node',
          './node_modules/@libsql/linux-x64-gnu/package.json',
        ],
      })
    : node({ mode: 'standalone' }),
  build: {
    format: 'directory',
    inlineStylesheets: 'always', // CSS critico inline: nessuna richiesta bloccante
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
  integrations: [vercelRoutes],
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
