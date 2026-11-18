export type Service = {
  slug: string;
  title: string;
  /** Titolo breve per card e menu */
  short: string;
  icon: string;
  /** Riassunto per card e meta description */
  excerpt: string;
  /** Paragrafi del testo */
  body: string[];
  /** Punti di dettaglio (lavorazioni incluse) */
  points?: string[];
  /** Pagina dedicata (true) oppure sezione con ancora in /servizi/ */
  page: boolean;
  /** Immagine (chiave di src/assets/img) */
  image: string;
  seoTitle?: string;
  seoDescription?: string;
};

export const mainServices: Service[] = [
  {
    slug: 'ristrutturazioni-chiavi-in-mano',
    title: 'Ristrutturazioni chiavi in mano',
    short: 'Chiavi in mano',
    icon: 'key',
    page: true,
    image: 'interior',
    excerpt:
      'Ristrutturazione completa del tuo immobile con un unico referente: cura dei dettagli, giusto prezzo e pieno rispetto dei tempi.',
    body: [
      'Affidati a Bota s.r.l. per la ristrutturazione completa del tuo immobile. Lavoriamo con la massima cura nei dettagli per garantirti un risultato estremamente soddisfacente al giusto prezzo e nel pieno rispetto dei tempi.',
      'Inoltre lavoriamo in collaborazione con i migliori professionisti del settore per fornire servizi aggiuntivi quali rifacimento impianto elettrico, impianto termico e idraulico, fotovoltaico, installazione e posa parquet, e molto altro.',
    ],
    points: [
      'Opere murarie e demolizioni',
      'Rifacimento bagni e cucine',
      'Impianto elettrico',
      'Impianto termico e idraulico',
      'Fotovoltaico',
      'Posa parquet e pavimenti',
      'Cartongessi e controsoffitti',
      'Tinteggiature e finiture',
    ],
    seoTitle: 'Ristrutturazioni chiavi in mano a Firenze e provincia',
    seoDescription:
      'Ristrutturazioni complete chiavi in mano a Firenze, Campi Bisenzio e provincia: un unico referente per opere murarie, impianti, bagni e finiture. Preventivo gratuito.',
  },
  {
    slug: 'efficientamento-energetico',
    title: 'Efficientamento energetico',
    short: 'Efficientamento',
    icon: 'leaf',
    page: true,
    image: 'energy',
    excerpt:
      'Valutazione energetica dell’edificio, cappotti termici, isolamento di tetti e sottotetti, impianti radianti: meno sprechi, più comfort.',
    body: [
      'Affidati a Bota s.r.l. per l’efficientamento energetico del tuo immobile. Siamo in grado di offrire una valutazione energetica dell’edificio esistente, stimando la quantità di lavoro necessaria per migliorare il tuo immobile dal punto di vista energetico.',
      'In seguito, ci occupiamo di realizzazione cappotti termici, isolamento di superfici opache e inclinate, tetti e sottotetti, posa impianto radiante, e collaboriamo con le migliori aziende locali fornitrici di infissi, fornendo loro assistenza muraria.',
    ],
    points: [
      'Valutazione energetica dell’edificio esistente',
      'Cappotto termico',
      'Isolamento di superfici opache e inclinate',
      'Isolamento di tetti e sottotetti',
      'Posa impianto radiante',
      'Assistenza muraria per la sostituzione degli infissi',
    ],
    seoTitle: 'Efficientamento energetico e cappotto termico a Firenze',
    seoDescription:
      'Efficientamento energetico a Firenze e provincia: valutazione energetica, cappotto termico, isolamento tetti e sottotetti, impianti radianti. Richiedi un preventivo gratuito.',
  },
];

export const otherServices: Service[] = [
  {
    slug: 'ristrutturazioni',
    title: 'Ristrutturazioni',
    short: 'Ristrutturazioni',
    icon: 'home',
    page: false,
    image: 'interior',
    excerpt: 'Ristrutturazioni complete e personalizzate, per esigenze e budget diversi.',
    body: [
      'Ristrutturare la propria casa deve essere un sogno, e per far sì che rimanga tale l’unico modo è affidarsi a professionisti del settore in grado di prevedere ogni lavorazione necessaria, ogni possibile imprevisto e all’occorrenza risolverlo.',
      'La nostra impresa esegue ristrutturazioni complete e personalizzate, in grado di soddisfare le diverse esigenze e i diversi budget a seconda del tipo di intervento. Affidati a noi e non te ne pentirai!',
    ],
  },
  {
    slug: 'ristrutturazione-tetti',
    title: 'Ristrutturazione tetti',
    short: 'Tetti',
    icon: 'roof',
    page: false,
    image: 'roof',
    excerpt: 'Tetti sicuri, impermeabilizzati e ben isolati: dalla struttura portante alla linea vita.',
    body: [
      'Avere un tetto sicuro, impermeabilizzato e ben isolato è molto importante per il tuo benessere, la tua sicurezza e per ridurre gli sprechi di energia.',
      'La nostra impresa valuta le tue esigenze ed esegue le opere necessarie al restauro del tuo tetto, fornendo ponteggi ed opere provvisionali in genere, struttura portante, isolamento termico, impermeabilizzazione, manto di copertura e linea vita.',
    ],
  },
  {
    slug: 'cartongesso',
    title: 'Cartongesso',
    short: 'Cartongesso',
    icon: 'layers',
    page: false,
    image: 'interior',
    excerpt: 'Pareti attrezzate, cabine armadio, controsoffitti, velette e gole per LED su misura.',
    body: [
      'Creare delle belle strutture in cartongesso che si adattano alle tue esigenze è un’arte di pochi.',
      'La nostra impresa può consigliarti e realizzare strutture in cartongesso da adattare ad ogni situazione, come pareti attrezzate, cabine armadio, rivestimenti camini, velette e gole per LED, pareti divisorie, controsoffitti e molto altro ancora. Contattaci subito per un preventivo gratuito!',
    ],
  },
  {
    slug: 'tinteggiature',
    title: 'Tinteggiature',
    short: 'Tinteggiature',
    icon: 'roller',
    page: false,
    image: 'facade',
    excerpt: 'Tinteggiature di interni ed esterni con materiali di qualità, in sicurezza e pulizia.',
    body: [
      'Il nostro team si occupa anche di tinteggiature di interni ed esterni. Utilizziamo solo i migliori materiali per ottenere un lavoro duraturo nel tempo, lavorando in completa sicurezza e pulizia, usando colori bianchi o tinte a scelta del cliente.',
      'Siamo specializzati in una vasta gamma di servizi di tinteggiature, ed effettuiamo il lavoro in squadra per un risultato più veloce che mai.',
    ],
  },
  {
    slug: 'restauro-facciate',
    title: 'Restauro facciate',
    short: 'Facciate',
    icon: 'building',
    page: false,
    image: 'facade',
    excerpt: 'Ripristino di intonaci, balze, marcapiani e cornici anche a disegno complesso.',
    body: [
      'Se vuoi ridare vita alla tua facciata e fare un restauro di alta qualità, la nostra impresa ti consiglierà la soluzione migliore e più economica.',
      'Forniamo ponteggi ed opere provvisionali in genere e ci occupiamo di ripristino di intonaci, ripristino di balze, restauro di marcapiani e cornici anche a disegno complesso, terminando il lavoro usando per tinteggiare vernici di alta qualità.',
    ],
  },
  {
    slug: 'linee-vita',
    title: 'Linee vita',
    short: 'Linee vita',
    icon: 'shield',
    page: false,
    image: 'roof',
    excerpt: 'Progettazione, posa e manutenzione periodica di linee vita e ancoraggi certificati.',
    body: [
      'Per avere la possibilità di poter fare manutenzione e per avere un accesso facile e sicuro in copertura è necessario utilizzare dispositivi di protezione collettiva.',
      'La nostra impresa si occupa della progettazione e della messa in servizio fornendo progettazione e realizzazione ancoraggi sotto tegola e linee vita certificate, con manutenzione periodica programmata.',
    ],
  },
];

export const allServices = [...mainServices, ...otherServices];

/** Opzioni del menu a tendina nel modulo preventivo */
export const quoteServiceOptions = [
  'Ristrutturazione chiavi in mano',
  'Efficientamento energetico / cappotto termico',
  'Ristrutturazione bagno o cucina',
  'Ristrutturazione tetto',
  'Cartongesso',
  'Tinteggiature',
  'Restauro facciata',
  'Linea vita',
  'Altro',
];

export const serviceHref = (s: Service) => (s.page ? `/servizi/${s.slug}/` : `/servizi/#${s.slug}`);

export const whyUs = [
  {
    title: 'Esperienza',
    icon: 'medal',
    text: 'Abbiamo anni di esperienza nel settore edile a Firenze e siamo in grado di gestire progetti di qualsiasi dimensione e complessità.',
  },
  {
    title: 'Qualità',
    icon: 'check',
    text: 'La nostra mission è fornire servizi edili di massima qualità ai nostri clienti, garantendo al contempo la massima soddisfazione.',
  },
  {
    title: 'Professionalità',
    icon: 'compass',
    text: 'Coordiniamo tutte le fasi progettuali e ci coordiniamo con gli altri professionisti del cantiere per consegnare l’eccellenza.',
  },
  {
    title: 'Etica',
    icon: 'handshake',
    text: 'I nostri valori sono il rispetto e la trasparenza. Lavoriamo in modo etico e responsabile, rispettando le leggi e le norme del settore.',
  },
];

export const processSteps = [
  { title: 'Richiedi il preventivo', text: 'Compila il modulo in 2 minuti o chiamaci: raccontaci cosa vuoi realizzare.' },
  { title: 'Ti ricontattiamo', text: 'Un nostro operatore ti chiama al più presto per capire le tue esigenze e, se serve, fissare un sopralluogo.' },
  { title: 'Ricevi il preventivo', text: 'Ti inviamo un preventivo chiaro e dettagliato, con tempi e costi definiti.' },
  { title: 'Realizziamo i lavori', text: 'Un unico referente coordina il cantiere fino alla consegna, nel rispetto di tempi e budget.' },
];
