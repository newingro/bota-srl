import type { AstroGlobal } from 'astro';

/** URL interno all'area riservata (gestisce sia /admin/... sia admin.bota.srl/...). */
export function ahref(Astro: AstroGlobal, path = '') {
  const base = Astro.locals.adminBase ?? '/admin';
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p === '/' ? '' : p}` || '/';
}

export const leadStatuses = [
  { value: 'nuova', label: 'Nuova', tone: 'brand' },
  { value: 'contattato', label: 'Contattato', tone: 'info' },
  { value: 'preventivo_inviato', label: 'Preventivo inviato', tone: 'warn' },
  { value: 'acquisito', label: 'Acquisito', tone: 'ok' },
  { value: 'perso', label: 'Perso', tone: 'muted' },
] as const;

export const statusLabel = (v: string) => leadStatuses.find((s) => s.value === v) ?? { value: v, label: v, tone: 'muted' };

export const flashMessages: Record<string, string> = {
  saved: 'Modifiche salvate.',
  created: 'Elemento creato.',
  deleted: 'Elemento eliminato.',
  uploaded: 'Foto caricate.',
  sent: 'Campagna inviata.',
  test: 'Email di prova inviata.',
  password: 'Password aggiornata.',
  user: 'Utente creato.',
};

export async function readForm(Astro: AstroGlobal) {
  if (Astro.request.method !== 'POST') return null;
  try {
    return await Astro.request.formData();
  } catch {
    return null;
  }
}

export const fstr = (f: FormData, k: string, max = 5000) => String(f.get(k) ?? '').trim().slice(0, max);
