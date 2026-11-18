import sharp from 'sharp';
import { putFile, deleteFiles } from './storage';
import { randomToken } from './security';

export const IMAGE_WIDTHS = [480, 720, 1080, 1600];
export type Variant = { w: number; h: number; url: string };

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];

/**
 * Elabora una foto caricata: corregge l'orientamento EXIF, rimuove i metadati (anche GPS),
 * genera 4 formati WebP ottimizzati (480/720/1080/1600 px) per immagini responsive veloci.
 */
export async function processUpload(file: File, folder = 'lavori') {
  if (!ALLOWED.includes(file.type) && !/\.(jpe?g|png|webp|avif|heic)$/i.test(file.name)) {
    throw new Error(`Formato non supportato: ${file.name}`);
  }
  if (file.size > MAX_BYTES) throw new Error(`File troppo grande (max 25 MB): ${file.name}`);
  const input = Buffer.from(await file.arrayBuffer());
  const base = sharp(input, { failOn: 'none' }).rotate();
  const meta = await base.metadata();
  const srcW = meta.autoOrient?.width ?? meta.width ?? 1600;
  const id = `${folder}/${new Date().getFullYear()}/${randomToken(9)}`;
  const variants: Variant[] = [];
  const widths = IMAGE_WIDTHS.filter((w) => w < srcW);
  if (!widths.length || widths[widths.length - 1] < Math.min(srcW, 1600)) widths.push(Math.min(srcW, 1600));
  for (const w of [...new Set(widths)]) {
    const { data, info } = await sharp(input, { failOn: 'none' })
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 72, effort: 5, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });
    const url = await putFile(`${id}-${info.width}.webp`, data, 'image/webp');
    variants.push({ w: info.width, h: info.height, url });
  }
  const largest = variants[variants.length - 1];
  return { width: largest.w, height: largest.h, variants };
}

export async function deleteVariants(variantsJson: string) {
  try {
    const v = JSON.parse(variantsJson) as Variant[];
    await deleteFiles(v.map((x) => x.url));
  } catch {
    /* niente da eliminare */
  }
}

export function parseVariants(json: unknown): Variant[] {
  try {
    return JSON.parse(String(json)) as Variant[];
  } catch {
    return [];
  }
}

export function srcset(variants: Variant[]) {
  return variants.map((v) => `${v.url} ${v.w}w`).join(', ');
}
