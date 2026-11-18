/**
 * Immagini statiche del sito. Per usare le foto reali basta sostituire i file
 * (es. hero.jpg al posto di hero.svg) e aggiornare l'import: Astro genera in automatico
 * le versioni AVIF/WebP ridimensionate.
 */
import hero from './hero.jpg';
import energy from './energy.jpg';
import roof from './roof.jpg';
import interior from './interior.jpg';
import facade from './facade.jpg';
import about from './about.jpg';

export const images = { hero, energy, roof, interior, facade, about } as const;
export type ImageKey = keyof typeof images;
