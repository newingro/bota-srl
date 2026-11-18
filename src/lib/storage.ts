import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

/**
 * Archiviazione delle immagini caricate dal gestionale.
 * - Produzione su Vercel: Vercel Blob (variabile BLOB_READ_WRITE_TOKEN).
 * - Locale / server proprio: cartella .data/uploads servita da /media/...
 */
const LOCAL_DIR = process.env.UPLOADS_DIR || (process.env.VERCEL ? '/tmp/uploads' : '.data/uploads');

export function storageMode() {
  return process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'local';
}

export async function putFile(key: string, data: Buffer, contentType: string): Promise<string> {
  if (storageMode() === 'blob') {
    const { put } = await import('@vercel/blob');
    const res = await put(key, data, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000,
    });
    return res.url;
  }
  const path = join(LOCAL_DIR, key);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  return `/media/${key}`;
}

export async function deleteFiles(urls: string[]) {
  if (!urls.length) return;
  if (storageMode() === 'blob') {
    const { del } = await import('@vercel/blob');
    await del(urls.filter((u) => u.startsWith('http')));
    return;
  }
  for (const u of urls) {
    if (!u.startsWith('/media/')) continue;
    const path = localPath(u.slice('/media/'.length));
    if (path && existsSync(path)) unlinkSync(path);
  }
}

/** Percorso locale sicuro (impedisce path traversal). */
export function localPath(key: string) {
  const p = normalize(join(LOCAL_DIR, key));
  return p.startsWith(normalize(LOCAL_DIR)) ? p : null;
}
