// Crea demo/bota-demo.db (database di esempio per la preview su Vercel senza database)
// e copia le foto demo in public/demo/. Uso: npm run seed:demo && node scripts/make-demo-snapshot.mjs
import { createClient } from '@libsql/client';
import { copyFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

rmSync('demo', { recursive: true, force: true });
rmSync('public/demo', { recursive: true, force: true });
mkdirSync('demo', { recursive: true });
const src = createClient({ url: 'file:.data/bota.db' });
await src.execute('PRAGMA wal_checkpoint(TRUNCATE)').catch(() => {});
copyFileSync('.data/bota.db', 'demo/bota-demo.db');
const db = createClient({ url: 'file:demo/bota-demo.db' });
const imgs = await db.execute('SELECT id, variants FROM images');
let n = 0;
for (const row of imgs.rows) {
  const variants = JSON.parse(String(row.variants)).map((v) => {
    if (!v.url.startsWith('/media/')) return v;
    const key = v.url.slice('/media/'.length);
    const from = `.data/uploads/${key}`;
    const to = `public/demo/${key}`;
    if (existsSync(from)) {
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to);
      n++;
    }
    return { ...v, url: `/demo/${key}` };
  });
  await db.execute({ sql: 'UPDATE images SET variants = ? WHERE id = ?', args: [JSON.stringify(variants), row.id] });
}
for (const t of ['consent_log', 'rate_limits', 'sessions', 'campaign_sends']) await db.execute(`DELETE FROM ${t}`);
await db.execute("DELETE FROM leads WHERE email NOT LIKE '%@example.com'");
await db.execute("DELETE FROM subscribers WHERE email NOT LIKE '%@example.com'");
await db.execute('VACUUM');
console.log(`Snapshot demo creato: demo/bota-demo.db, ${n} foto copiate in public/demo/`);
