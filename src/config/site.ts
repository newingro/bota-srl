/**
 * Dati aziendali centralizzati: modificando qui si aggiornano header, footer,
 * pagine legali, dati strutturati (schema.org) ed email.
 */
export const company = {
  name: 'Bota s.r.l.',
  legalName: 'Bota S.r.l.',
  shortName: 'Bota',
  tagline: 'Impresa edile a Campi Bisenzio (FI)',
  vat: '07100460489',
  address: {
    street: 'Via Semita 50',
    postalCode: '50013',
    city: 'Campi Bisenzio',
    province: 'FI',
    region: 'Toscana',
    country: 'IT',
  },
  email: 'info@bota.srl',
  phone: { display: '055 293285', href: 'tel:+39055293285', e164: '+39055293285' },
  mobile: { display: '338 680 8517', href: 'tel:+393386808517', e164: '+393386808517' },
  /** Click-to-chat WhatsApp sul cellulare aziendale (verificare che il numero usi WhatsApp). */
  whatsapp: { href: 'https://wa.me/393386808517?text=Buongiorno%2C%20vorrei%20un%20preventivo%20per%20' },
  hours: [
    { days: 'Lunedì – Venerdì', short: 'Lun–Ven', value: '08:00 – 18:00', schema: { dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00' } },
    { days: 'Sabato', short: 'Sab', value: '08:00 – 17:00', schema: { dayOfWeek: ['Saturday'], opens: '08:00', closes: '17:00' } },
    { days: 'Domenica', short: 'Dom', value: 'Chiuso', schema: null },
  ],
  yearsOfExperience: '10',
  areaServed: 'Firenze e provincia, zone limitrofe',
  /** Link social: compilare quando la pagina Facebook sarà attiva. */
  social: {
    facebook: '',
    instagram: '',
  },
  /** Link "Apri in Google Maps" (nessun cookie: è un normale link esterno). */
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bota+s.r.l.+Via+Semita+50+50013+Campi+Bisenzio+FI',
  /** URL di embed della mappa: caricato SOLO dopo consenso dell'utente. */
  mapsEmbedUrl: 'https://www.google.com/maps?q=Via+Semita+50,+50013+Campi+Bisenzio+FI&output=embed',
  /** Link per lasciare/leggere le recensioni Google (da compilare con il link del Profilo dell'Attività). */
  reviewsUrl: '',
} as const;

export const fullAddress = `${company.address.street}, ${company.address.postalCode} ${company.address.city} (${company.address.province})`;

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/servizi/', label: 'Servizi' },
  { href: '/lavori/', label: 'Lavori' },
  { href: '/chi-siamo/', label: 'Chi siamo' },
  { href: '/contatti/', label: 'Contatti' },
] as const;

/** Versioni dei testi legali: cambiandole il banner cookie viene ri-mostrato. */
export const legal = {
  privacyVersion: '2026-11-18',
  cookieVersion: '2026-11-18',
  /** Testo del consenso newsletter: salvato con ogni iscrizione come prova del consenso. */
  newsletterConsentText:
    'Acconsento a ricevere via email offerte, coupon e novità di Bota s.r.l. Posso annullare l’iscrizione in qualsiasi momento.',
  newsletterConsentVersion: 'nl-2026-11-18',
};
