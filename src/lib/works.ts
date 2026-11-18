import { all, get } from './db';
import { parseVariants, type Variant } from './images';

export type WorkImage = { id: number; alt: string; phase: string; width: number; height: number; variants: Variant[]; sort: number };
export type Work = {
  id: number;
  slug: string;
  title: string;
  service: string | null;
  location: string | null;
  year: string | null;
  duration: string | null;
  client_type: string | null;
  summary: string | null;
  challenge: string | null;
  solution: string | null;
  result: string | null;
  cover_image_id: number | null;
  status: string;
  featured: number;
  is_example: number;
  sort: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  cover?: WorkImage | null;
};

function toImage(r: Record<string, unknown>): WorkImage {
  return {
    id: Number(r.id),
    alt: String(r.alt ?? ''),
    phase: String(r.phase ?? ''),
    width: Number(r.width),
    height: Number(r.height),
    variants: parseVariants(r.variants),
    sort: Number(r.sort ?? 0),
  };
}

export async function imagesFor(workId: number): Promise<WorkImage[]> {
  const rows = await all('SELECT * FROM images WHERE work_id = ? ORDER BY sort, id', [workId]);
  return rows.map(toImage);
}

async function withCovers(works: Work[]) {
  const ids = works.map((w) => w.cover_image_id).filter(Boolean) as number[];
  const covers = new Map<number, WorkImage>();
  if (ids.length) {
    const rows = await all(`SELECT * FROM images WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
    rows.forEach((r) => covers.set(Number(r.id), toImage(r)));
  }
  // Se manca la copertina, usa la prima immagine del lavoro
  for (const w of works) {
    w.cover = (w.cover_image_id && covers.get(Number(w.cover_image_id))) || null;
    if (!w.cover) {
      const first = await get('SELECT * FROM images WHERE work_id = ? ORDER BY sort, id LIMIT 1', [w.id]);
      w.cover = first ? toImage(first) : null;
    }
  }
  return works;
}

export async function publishedWorks(opts: { limit?: number; featuredFirst?: boolean; service?: string } = {}) {
  const args: (string | number)[] = [];
  let where = "status = 'published'";
  if (opts.service) {
    where += ' AND service = ?';
    args.push(opts.service);
  }
  const order = opts.featuredFirst ? 'featured DESC, sort, published_at DESC' : 'sort, published_at DESC';
  const limit = opts.limit ? ` LIMIT ${Number(opts.limit)}` : '';
  const rows = await all<Work>(`SELECT * FROM works WHERE ${where} ORDER BY ${order}${limit}`, args);
  return withCovers(rows);
}

export async function workBySlug(slug: string, includeDrafts = false) {
  const w = await get<Work>(`SELECT * FROM works WHERE slug = ?${includeDrafts ? '' : " AND status = 'published'"}`, [slug]);
  if (!w) return null;
  const [withCover] = await withCovers([w]);
  return withCover;
}

export const workServices = [
  'Ristrutturazione chiavi in mano',
  'Efficientamento energetico',
  'Ristrutturazione',
  'Ristrutturazione tetti',
  'Cartongesso',
  'Tinteggiature',
  'Restauro facciate',
  'Linee vita',
];

export const clientTypes = ['Privato', 'Condominio', 'Azienda', 'Ente pubblico'];
