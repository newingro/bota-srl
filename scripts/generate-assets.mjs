// Genera favicon, icone e immagine di condivisione social (og-image) in public/.
// Uso: node scripts/generate-assets.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const icon = readFileSync('src/assets/brand/icona.svg');
const iconSmall = readFileSync('src/assets/brand/icona-piccola.svg');
const onWhite = async (svg, size, pad) => {
  const inner = await sharp(svg, { density: 600 }).resize(size - pad * 2, size - pad * 2).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: '#ffffff' } }).composite([{ input: inner, left: pad, top: pad }]).png();
};

writeFileSync('public/favicon.svg', iconSmall);
await (await onWhite(icon, 180, 18)).toFile('public/apple-touch-icon.png');
await (await onWhite(icon, 192, 16)).toFile('public/icon-192.png');
await (await onWhite(icon, 512, 44)).toFile('public/icon-512.png');
// favicon.ico (PNG 32x32 incapsulato in ICO)
const png32 = await sharp(iconSmall, { density: 600 }).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt8(0, 8); header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(png32.length, 14); header.writeUInt32LE(22, 18);
writeFileSync('public/favicon.ico', Buffer.concat([header, png32]));

// Logo PNG per dati strutturati ed email
const logoPng = readFileSync('src/assets/brand/logo.png');
writeFileSync('public/logo.png', logoPng);

// Immagine Open Graph 1200x630 (blu notte del marchio + logo su targa bianca)
const hero = readFileSync('src/assets/img/sorgenti/hero.svg', 'utf8');
const heroPng = await sharp(Buffer.from(hero)).resize(560, 420).png().toBuffer();
const logoPlate = await sharp({ create: { width: 360, height: 130, channels: 4, background: '#ffffff' } })
  .composite([{ input: await sharp(logoPng).resize(330).png().toBuffer(), left: 15, top: 10 }]).png().toBuffer();
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0b0341"/>
  <rect x="0" y="600" width="1200" height="30" fill="#eb0c0e"/>
  <text x="70" y="268" font-family="Arial, sans-serif" font-size="50" font-weight="800" fill="#fff">Ristrutturazioni</text>
  <text x="70" y="330" font-family="Arial, sans-serif" font-size="50" font-weight="800" fill="#fff">chiavi in mano</text>
  <text x="70" y="392" font-family="Arial, sans-serif" font-size="50" font-weight="800" fill="#ff7a7c">a Firenze</text>
  <text x="70" y="456" font-family="Arial, sans-serif" font-size="25" fill="#c9cbe6">Efficientamento energetico · Tetti · Facciate</text>
  <text x="70" y="548" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#fff">Preventivo gratuito · 055 293285 · bota.srl</text>
</svg>`;
await sharp(Buffer.from(og))
  .composite([{ input: logoPlate, left: 70, top: 60 }, { input: heroPng, left: 590, top: 110 }])
  .png({ compressionLevel: 9 }).toFile('public/og-image.png');

writeFileSync('public/site.webmanifest', JSON.stringify({
  name: 'Bota s.r.l. – Impresa edile',
  short_name: 'Bota',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#0b0341',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2));
console.log('Asset generati in public/');
