import { get, run } from './db';
import { slugify } from './format';
import { fstr } from './admin';

export async function uniqueSlug(base: string, excludeId?: number) {
  let slug = slugify(base) || 'lavoro';
  let i = 2;
  while (await get('SELECT id FROM works WHERE slug = ? AND id != ?', [slug, excludeId ?? 0])) slug = `${slugify(base)}-${i++}`;
  return slug;
}

export function workFields(f: FormData) {
  return {
    title: fstr(f, 'title', 140),
    service: fstr(f, 'service', 80) || null,
    location: fstr(f, 'location', 100) || null,
    year: fstr(f, 'year', 20) || null,
    duration: fstr(f, 'duration', 60) || null,
    client_type: fstr(f, 'client_type', 60) || null,
    summary: fstr(f, 'summary', 600) || null,
    challenge: fstr(f, 'challenge', 8000) || null,
    solution: fstr(f, 'solution', 8000) || null,
    result: fstr(f, 'result', 8000) || null,
    seo_title: fstr(f, 'seo_title', 70) || null,
    seo_description: fstr(f, 'seo_description', 170) || null,
  };
}

export async function saveWork(f: FormData, id?: number) {
  const data = workFields(f);
  if (!data.title) throw new Error('Il titolo è obbligatorio.');
  const slug = await uniqueSlug(fstr(f, 'slug', 80) || data.title, id);
  const status = f.get('status') === 'published' ? 'published' : 'draft';
  const featured = f.get('featured') === 'on' ? 1 : 0;
  const isExample = f.get('is_example') === 'on' ? 1 : 0;
  const sort = Number(f.get('sort') || 0) || 0;
  const cols = Object.keys(data);
  const vals = Object.values(data);
  if (id) {
    const prev = await get<{ status: string; published_at: string | null }>('SELECT status, published_at FROM works WHERE id = ?', [id]);
    const publishedAt = status === 'published' && !prev?.published_at ? new Date().toISOString() : (prev?.published_at ?? null);
    await run(
      `UPDATE works SET ${cols.map((c) => `${c} = ?`).join(', ')}, slug = ?, status = ?, featured = ?, is_example = ?, sort = ?, published_at = ?, updated_at = datetime('now') WHERE id = ?`,
      [...vals, slug, status, featured, isExample, sort, publishedAt, id],
    );
    return id;
  }
  const { lastId } = await run(
    `INSERT INTO works(${cols.join(', ')}, slug, status, featured, is_example, sort, published_at) VALUES (${cols.map(() => '?').join(', ')}, ?, ?, ?, ?, ?, ?)`,
    [...vals, slug, status, featured, isExample, sort, status === 'published' ? new Date().toISOString() : null],
  );
  return lastId;
}
