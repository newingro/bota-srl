/**
 * Dati di ESEMPIO per la preview al cliente (lavori, richieste, iscritti, campagna).
 *   npm run seed:demo     → inserisce i dati di esempio
 *   npm run reset:demo    → rimuove TUTTI i dati di esempio (da fare prima della messa online)
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { all, run } from '../src/lib/db';
import { processUpload, deleteVariants } from '../src/lib/images';
import { randomToken } from '../src/lib/security';
import { legal } from '../src/config/site';

const DEMO_DOMAIN = '@example.com';

async function reset() {
  const works = await all<{ id: number }>('SELECT id FROM works WHERE is_example = 1');
  for (const w of works) {
    const imgs = await all<{ variants: string }>('SELECT variants FROM images WHERE work_id = ?', [w.id]);
    for (const i of imgs) await deleteVariants(i.variants);
    await run('DELETE FROM images WHERE work_id = ?', [w.id]);
    await run('DELETE FROM works WHERE id = ?', [w.id]);
  }
  await run(`DELETE FROM leads WHERE email LIKE ?`, [`%${DEMO_DOMAIN}`]);
  await run(`DELETE FROM subscribers WHERE email LIKE ?`, [`%${DEMO_DOMAIN}`]);
  await run(`DELETE FROM campaigns WHERE subject LIKE '%(esempio)%'`);
  console.log(`Rimossi ${works.length} lavori di esempio e i relativi dati demo.`);
}

async function illustration(name: string, mode: 'after' | 'before' | 'during' = 'after') {
  let img = sharp(readFileSync(`src/assets/img/sorgenti/${name}.svg`), { density: 200 }).resize(1600, 1200);
  if (mode === 'before') img = img.grayscale().modulate({ brightness: 0.82 }).linear(0.85, 10);
  if (mode === 'during') img = img.modulate({ saturation: 0.55, brightness: 0.95 });
  const buf = await img.jpeg({ quality: 88 }).toBuffer();
  return new File([new Uint8Array(buf)], `${name}-${mode}.jpg`, { type: 'image/jpeg' });
}

type DemoImage = { file: string; mode: 'after' | 'before' | 'during'; phase: string; alt: string };
const demoWorks: {
  title: string; slug: string; service: string; location: string; year: string; duration: string; client: string;
  summary: string; challenge: string; solution: string; result: string; images: DemoImage[];
}[] = [
  {
    title: 'Ristrutturazione completa di un appartamento',
    slug: 'esempio-ristrutturazione-appartamento',
    service: 'Ristrutturazione chiavi in mano',
    location: 'Firenze',
    year: '2025',
    duration: '10 settimane',
    client: 'Privato',
    summary: 'Esempio di caso studio: appartamento di 90 mq rinnovato chiavi in mano, dagli impianti alle finiture, con parete attrezzata in cartongesso e illuminazione LED.',
    challenge: 'Appartamento degli anni ’70 con impianti datati, distribuzione degli spazi poco funzionale e finiture usurate.\n\nIl cliente voleva un unico referente per tutti i lavori e tempi certi per il trasloco.',
    solution: '- Demolizioni e nuova distribuzione degli spazi\n- Rifacimento impianto elettrico, idraulico e termico con i nostri partner\n- Parete attrezzata e controsoffitto in cartongesso con gola LED\n- Posa parquet e tinteggiature\n\nUn unico referente ha coordinato tutte le lavorazioni fino alla consegna.',
    result: 'Casa consegnata nei tempi concordati e nel rispetto del budget, con spazi più luminosi e consumi ridotti.',
    images: [
      { file: 'interior', mode: 'after', phase: 'dopo', alt: 'Soggiorno dopo la ristrutturazione con parete attrezzata in cartongesso' },
      { file: 'interior', mode: 'before', phase: 'prima', alt: 'Soggiorno prima della ristrutturazione' },
      { file: 'about', mode: 'after', phase: 'durante', alt: 'Progetto della nuova distribuzione degli spazi' },
    ],
  },
  {
    title: 'Cappotto termico e isolamento del tetto',
    slug: 'esempio-cappotto-termico',
    service: 'Efficientamento energetico',
    location: 'Sesto Fiorentino',
    year: '2024',
    duration: '6 settimane',
    client: 'Condominio',
    summary: 'Esempio di caso studio: efficientamento energetico di una palazzina con cappotto termico, isolamento del sottotetto e assistenza muraria per i nuovi infissi.',
    challenge: 'Edificio con forti dispersioni termiche, muffa negli angoli delle stanze e bollette elevate.',
    solution: '- Valutazione energetica dell’edificio esistente\n- Cappotto termico sulle facciate\n- Isolamento del sottotetto\n- Assistenza muraria per la sostituzione degli infissi',
    result: 'Comfort migliorato in inverno e in estate e **consumi ridotti** per il riscaldamento.',
    images: [
      { file: 'energy', mode: 'after', phase: 'dopo', alt: 'Schema dell’edificio con cappotto termico e isolamento del tetto' },
      { file: 'hero', mode: 'before', phase: 'prima', alt: 'Palazzina prima dell’intervento di efficientamento' },
      { file: 'hero', mode: 'during', phase: 'durante', alt: 'Ponteggio montato durante la posa del cappotto' },
    ],
  },
  {
    title: 'Restauro della facciata di un palazzo storico',
    slug: 'esempio-restauro-facciata',
    service: 'Restauro facciate',
    location: 'Campi Bisenzio',
    year: '2024',
    duration: '8 settimane',
    client: 'Condominio',
    summary: 'Esempio di caso studio: ripristino di intonaci, marcapiani e cornici di una facciata storica e tinteggiatura con pitture di alta qualità.',
    challenge: 'Intonaci distaccati, cornici e marcapiani degradati, tinteggiatura sbiadita.',
    solution: '- Ponteggi e opere provvisionali\n- Ripristino di intonaci e balze\n- Restauro di marcapiani e cornici a disegno complesso\n- Tinteggiatura finale con vernici di alta qualità',
    result: 'Facciata tornata al suo aspetto originale, protetta dagli agenti atmosferici per molti anni.',
    images: [
      { file: 'facade', mode: 'after', phase: 'dopo', alt: 'Facciata del palazzo dopo il restauro' },
      { file: 'facade', mode: 'before', phase: 'prima', alt: 'Facciata del palazzo prima del restauro' },
      { file: 'roof', mode: 'after', phase: '', alt: 'Copertura con linea vita installata' },
    ],
  },
];

async function seed() {
  for (const [i, w] of demoWorks.entries()) {
    const exists = await all('SELECT id FROM works WHERE slug = ?', [w.slug]);
    if (exists.length) continue;
    const { lastId } = await run(
      `INSERT INTO works(slug, title, service, location, year, duration, client_type, summary, challenge, solution, result, status, featured, is_example, sort, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, 1, ?, ?)`,
      [w.slug, w.title, w.service, w.location, w.year, w.duration, w.client, w.summary, w.challenge, w.solution, w.result, i, new Date().toISOString()],
    );
    let cover = 0;
    for (const [j, im] of w.images.entries()) {
      const up = await processUpload(await illustration(im.file, im.mode));
      const { lastId: imgId } = await run('INSERT INTO images(work_id, alt, phase, width, height, variants, sort) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        lastId, im.alt, im.phase, up.width, up.height, JSON.stringify(up.variants), j,
      ]);
      if (j === 0) cover = imgId;
    }
    await run('UPDATE works SET cover_image_id = ? WHERE id = ?', [cover, lastId]);
    console.log(`Lavoro di esempio creato: ${w.title}`);
  }

  const leads = [
    ['Marco Bianchi', '333 1234567', 'Ristrutturazione chiavi in mano', 'Firenze', 'Entro 3 mesi', 'Appartamento di 85 mq al secondo piano, vorrei rifare bagno, cucina e impianti.', 'nuova', 'google', 'cpc', 'ristrutturazioni-firenze', 1],
    ['Giulia Rossi', '347 7654321', 'Ristrutturazione bagno o cucina', 'Campi Bisenzio', 'Il prima possibile', 'Bagno di 6 mq da rifare completamente, con sostituzione della vasca con doccia.', 'contattato', '', '', '', 0],
    ['Condominio Via Roma 12', '055 1234567', 'Restauro facciata', 'Sesto Fiorentino', 'Entro 6 mesi', 'Facciata con intonaco che si stacca, 4 piani.', 'preventivo_inviato', 'facebook', 'social', 'facciate-autunno', 0],
    ['Luca Neri', '320 1112223', 'Efficientamento energetico / cappotto termico', 'Calenzano', 'Sto solo valutando', 'Villetta indipendente, valuto cappotto e isolamento tetto.', 'acquisito', '', '', '', 1],
    ['Sara Conti', '339 4445556', 'Ristrutturazione tetto', 'Signa', 'Entro 3 mesi', 'Infiltrazioni dal tetto, circa 120 mq.', 'perso', '', '', '', 0],
  ] as const;
  const existingDemo = await all('SELECT id FROM leads WHERE email LIKE ?', [`%${DEMO_DOMAIN}`]);
  if (!existingDemo.length) {
    for (const [i, l] of leads.entries()) {
      const email = l[0].toLowerCase().replace(/[^a-z]+/g, '.') + DEMO_DOMAIN;
      await run(
        `INSERT INTO leads(created_at, name, phone, email, service, comune, timing, message, status, utm_source, utm_medium, utm_campaign, newsletter_optin, privacy_ack, source_page, notes, notify_status, autoreply_status)
         VALUES (datetime('now', ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, '/contatti/', 'Dato di esempio per la demo', 'inviata', 'inviata')`,
        [`-${i * 2 + 1} days`, l[0], l[1], email, l[2], l[3], l[4], l[5], l[6], l[7], l[8], l[9], l[10]],
      );
    }
    for (const [email, status] of [['anna.verdi', 'confirmed'], ['paolo.gallo', 'confirmed'], ['elena.fabbri', 'confirmed'], ['marco.bianchi', 'pending']] as const) {
      await run(
        `INSERT INTO subscribers(email, status, token, source, consent_text, consent_version, consent_ip, consent_ua, confirmed_at, confirmed_ip)
         VALUES (?, ?, ?, 'footer', ?, ?, '93.44.120.0', 'Mozilla/5.0 (demo)', ?, ?)`,
        [email + DEMO_DOMAIN, status, randomToken(24), legal.newsletterConsentText, legal.newsletterConsentVersion, status === 'confirmed' ? new Date().toISOString() : null, status === 'confirmed' ? '93.44.120.0' : null],
      );
    }
    const expiry = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
    await run(
      `INSERT INTO campaigns(subject, preheader, title, body, coupon_code, coupon_text, coupon_expiry, cta_label, cta_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Bagno nuovo per Natale? -10% sulla manodopera (esempio)',
        'Offerta riservata agli iscritti alla newsletter',
        'Il tuo bagno nuovo, con il 10% di sconto',
        'Ciao!\n\nFino alla scadenza del coupon, per i lavori di **rifacimento bagno** confermati ti riserviamo uno sconto del 10% sulla manodopera.\n\n- Sopralluogo e preventivo gratuiti\n- Un unico referente dall’inizio alla fine\n- Tempi certi\n\nRispondi a questa email o richiedi il preventivo online indicando il codice.',
        'BAGNO10',
        '10% di sconto sulla manodopera per il rifacimento del bagno',
        expiry,
        'Richiedi il preventivo',
        'https://bota.srl/contatti/?utm_source=newsletter&utm_medium=email&utm_campaign=bagno10#preventivo',
      ],
    );
    console.log('Richieste, iscritti e campagna di esempio creati.');
  }
}

if (process.argv.includes('--reset')) await reset();
else await seed();
