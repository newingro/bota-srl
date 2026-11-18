// Server locale di produzione con compressione gzip (come avviene su Vercel/CDN).
// Uso: npm run build && node scripts/serve-local.mjs
import http from 'node:http';
import compression from 'compression';
process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { handler } = await import('../dist/server/entry.mjs');

const compress = compression();
const port = Number(process.env.PORT || 4321);
http
  .createServer((req, res) => compress(req, res, () => handler(req, res)))
  .listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Bota in locale: http://127.0.0.1:${port}`));
