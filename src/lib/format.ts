import { escapeHtml } from './security';

/**
 * Formattazione testi inseriti dal gestionale (sicura: tutto l'HTML viene neutralizzato).
 * Sintassi supportata:
 *   riga vuota      → nuovo paragrafo
 *   - voce          → elenco puntato
 *   **grassetto**   → grassetto
 *   [testo](https://link) → link
 */
export function formatText(src: string, opts: { email?: boolean } = {}) {
  const pStyle = opts.email ? ' style="margin:0 0 14px;"' : '';
  const ulStyle = opts.email ? ' style="margin:0 0 14px;padding-left:20px;"' : '';
  const aStyle = opts.email ? ' style="color:#a63d15;"' : '';
  const inline = (s: string) =>
    escapeHtml(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:|\/)[^\s)]+)\)/g, `<a href="$2"${aStyle}>$1</a>`);
  return src
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n');
      if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
        return `<ul${ulStyle}>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-•]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      return `<p${pStyle}>${lines.map(inline).join('<br>')}</p>`;
    })
    .join('\n');
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function formatDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return '–';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  return d.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Europe/Rome',
  });
}

export function plain(s: string | null | undefined, max = 160) {
  const t = String(s ?? '').replace(/\*\*|\[|\]\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}
