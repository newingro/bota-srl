import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { localPath } from '../../lib/storage';

export const prerender = false;

const TYPES: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', avif: 'image/avif' };

/** Serve le immagini caricate quando non si usa Vercel Blob (sviluppo / server proprio). */
export const GET: APIRoute = async ({ params }) => {
  const p = localPath(params.path || '');
  if (!p) return new Response('Not found', { status: 404 });
  try {
    const data = await readFile(p);
    const ext = p.split('.').pop()!.toLowerCase();
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};
