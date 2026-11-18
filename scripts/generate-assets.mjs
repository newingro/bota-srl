// Genera favicon, icone e immagine di condivisione social (og-image) in public/.
// Uso: node scripts/generate-assets.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const mark = (size, r = 9) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}">
  <rect width="40" height="40" rx="${r}" fill="#b4441a"/>
  <path d="M8 20.5 20 10l12 10.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="11" y="23" width="8" height="5" rx="1" fill="#fff"/><rect x="21" y="23" width="8" height="5" rx="1" fill="#fff"/>
  <rect x="11" y="30" width="18" height="4" rx="1" fill="#fff" opacity=".75"/></svg>`;

writeFileSync('public/favicon.svg', mark(40));
await sharp(Buffer.from(mark(180, 0))).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(mark(512, 9))).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(Buffer.from(mark(192, 9))).resize(192, 192).png().toFile('public/icon-192.png');
// favicon.ico (PNG incapsulato in ICO 32x32)
const png32 = await sharp(Buffer.from(mark(32))).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt8(0, 8); header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(png32.length, 14); header.writeUInt32LE(22, 18);
writeFileSync('public/favicon.ico', Buffer.concat([header, png32]));

// Logo PNG per dati strutturati
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 172 44" width="688" height="176"><rect width="172" height="44" fill="#fff"/>
  <g transform="translate(0 2)">${mark(40).replace(/<\/?svg[^>]*>/g, '')}</g>
  <text x="50" y="29" font-family="Arial, sans-serif" font-size="26" font-weight="800" fill="#15191d">BOTA<tspan dx="5" font-size="13" font-weight="600" fill="#5c656e">s.r.l.</tspan></text>
  <text x="50" y="41" font-family="Arial, sans-serif" font-size="8.6" font-weight="700" letter-spacing="1.9" fill="#5c656e">IMPRESA EDILE</text></svg>`;
await sharp(Buffer.from(logo)).png().toFile('public/logo.png');

// Immagine Open Graph 1200x630
const hero = readFileSync('src/assets/img/sorgenti/hero.svg', 'utf8');
const heroPng = await sharp(Buffer.from(hero)).resize(640, 480).png().toBuffer();
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#1b2126"/>
  <rect x="0" y="0" width="12" height="630" fill="#b4441a"/>
  <g transform="translate(70 70)">${mark(64).replace('<svg', '<svg x="0" y="0"')}</g>
  <text x="150" y="118" font-family="Arial, sans-serif" font-size="44" font-weight="800" fill="#fff">BOTA <tspan font-size="24" fill="#c9d0d6" font-weight="600">s.r.l.</tspan></text>
  <text x="70" y="250" font-family="Arial, sans-serif" font-size="52" font-weight="800" fill="#fff">Ristrutturazioni</text>
  <text x="70" y="314" font-family="Arial, sans-serif" font-size="52" font-weight="800" fill="#fff">chiavi in mano</text>
  <text x="70" y="378" font-family="Arial, sans-serif" font-size="52" font-weight="800" fill="#f08a5d">a Firenze</text>
  <text x="70" y="450" font-family="Arial, sans-serif" font-size="26" fill="#c9d0d6">Efficientamento energetico · Tetti · Facciate</text>
  <text x="70" y="560" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#fff">Preventivo gratuito · 055 293285 · bota.srl</text>
</svg>`;
await sharp(Buffer.from(og)).composite([{ input: heroPng, left: 560, top: 75 }]).png({ compressionLevel: 9 }).toFile('public/og-image.png');

writeFileSync('public/site.webmanifest', JSON.stringify({
  name: 'Bota s.r.l. – Impresa edile',
  short_name: 'Bota',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#1b2126',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2));
console.log('Asset generati in public/');
