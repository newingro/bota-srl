import type { APIRoute } from 'astro';
import { get, run } from '../../../lib/db';
import { processUpload } from '../../../lib/images';

export const prerender = false;

/** Caricamento foto di un lavoro (protetto dal middleware: richiede login). */
export const POST: APIRoute = async ({ request, url, locals, redirect }) => {
  const workId = Number(url.searchParams.get('work'));
  const work = await get<{ id: number; title: string; cover_image_id: number | null }>('SELECT id, title, cover_image_id FROM works WHERE id = ?', [workId]);
  if (!work) return new Response(JSON.stringify({ error: 'Lavoro non trovato' }), { status: 404 });
  const form = await request.formData();
  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return new Response(JSON.stringify({ error: 'Nessun file' }), { status: 400 });
  const maxSort = Number((await get<{ m: number }>('SELECT COALESCE(MAX(sort), 0) AS m FROM images WHERE work_id = ?', [workId]))?.m ?? 0);
  const created: number[] = [];
  try {
    let i = 1;
    for (const file of files) {
      const img = await processUpload(file);
      const { lastId } = await run('INSERT INTO images(work_id, alt, width, height, variants, sort) VALUES (?, ?, ?, ?, ?, ?)', [
        workId,
        work.title,
        img.width,
        img.height,
        JSON.stringify(img.variants),
        maxSort + i++,
      ]);
      created.push(lastId);
    }
    if (!work.cover_image_id && created[0]) await run('UPDATE works SET cover_image_id = ? WHERE id = ?', [created[0], workId]);
    await run("UPDATE works SET updated_at = datetime('now') WHERE id = ?", [workId]);
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 422 });
  }
  if (url.searchParams.get('redirect')) return redirect(`${locals.adminBase}/lavori/${workId}?ok=uploaded#foto`, 303);
  return new Response(JSON.stringify({ ok: true, ids: created }), { headers: { 'Content-Type': 'application/json' } });
};
