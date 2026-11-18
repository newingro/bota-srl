# Bota s.r.l. – Sito web e gestionale

Sito multi-pagina per **Bota s.r.l.** (impresa edile, Campi Bisenzio – FI) pensato per **convertire i visitatori in richieste di preventivo**, più il gestionale riservato **admin.bota.srl**.

| | |
|---|---|
| Framework | [Astro 7](https://astro.build) – pagine statiche, JavaScript solo dove serve |
| Database | libSQL/SQLite in locale · [Turso](https://turso.tech) in produzione |
| Foto | ridimensionate e convertite in WebP all'upload (sharp) · Vercel Blob in produzione |
| Email | SMTP della casella info@bota.srl (oppure Resend) |
| Hosting consigliato | Vercel (in alternativa qualsiasi server Node 22+) |

## Avvio in locale

```bash
npm install
npm run admin:create -- demo@bota.srl "BotaDemo2026!" "Demo Bota"   # utente del gestionale
npm run seed:demo                                                     # dati di esempio (facoltativo)
npm run build && npm run preview                                      # http://127.0.0.1:4321
```

- Sito: `http://127.0.0.1:4321` · Gestionale: `http://127.0.0.1:4321/admin` (in produzione: `https://admin.bota.srl`)
- Senza configurazione SMTP le email **non vengono spedite** ma salvate in `.data/outbox/` (file HTML visualizzabili).
- In locale con `npm run preview` aggiungi `ALLOW_INSECURE_COOKIES=1` per poter fare il login su http.

## Pagine

| Pagina | URL | Note |
|---|---|---|
| Home (landing) | `/` | Hero con CTA, servizi, metodo, ultimi lavori (dal gestionale), perché sceglierci, modulo preventivo |
| Servizi | `/servizi/` | Tutti i servizi con ancore (`#ristrutturazione-tetti`, `#cartongesso`…) |
| Servizi principali | `/servizi/ristrutturazioni-chiavi-in-mano/`, `/servizi/efficientamento-energetico/` | **Stessi URL del sito attuale** (nessuna perdita SEO) |
| Lavori / casi studio | `/lavori/`, `/lavori/<slug>/` | Gestiti dal gestionale; confronto prima/dopo con cursore, galleria, filtri |
| Chi siamo | `/chi-siamo/` | |
| Contatti | `/contatti/` | Modulo, contatti diretti, mappa Google caricata solo su consenso |
| Grazie | `/preventivo/grazie/` | Pagina di conversione (Google Ads / GA4 / Meta) – `noindex` |
| Privacy e cookie | `/privacy-policy/`, `/cookie-policy/` | |
| Newsletter | `/newsletter/conferma/`, `/newsletter/disiscrizione/` | Double opt-in e disiscrizione con un clic |
| SEO | `/sitemap.xml`, `/robots.txt` | La sitemap include automaticamente i lavori pubblicati |

## Flusso della richiesta di preventivo

1. Il visitatore compila il modulo (validazione immediata, anti-spam senza captcha: campo trappola + tempo minimo + limite per IP).
2. La richiesta viene **salvata nel gestionale** (non si perde anche se l'email fallisce) con pagina e campagna di provenienza (utm/gclid).
3. Parte un'email a **info@bota.srl** con i dati e i pulsanti *Chiama*, *Rispondi*, *Apri nel gestionale* (il "Rispondi" va direttamente al cliente).
4. Il cliente riceve **subito la conferma**: ringraziamento, "un nostro operatore la chiamerà al più presto per i dettagli del preventivo o glielo invieremo via email", riepilogo e contatti.
5. Il visitatore arriva su `/preventivo/grazie/`, dove scattano le conversioni (solo se ha accettato i cookie).
6. Se ha spuntato la newsletter riceve l'email di conferma iscrizione (double opt-in).

## Gestionale (admin.bota.srl)

- **Dashboard**: richieste da gestire, richieste ultimi 30 giorni, clienti acquisiti, iscritti, lavori, servizi più richiesti.
- **Richieste preventivo**: elenco con filtri e ricerca, stato (Nuova → Contattato → Preventivo inviato → Acquisito/Perso), note interne, chiamata/WhatsApp/email con un clic, esportazione CSV, cancellazione (diritto all'oblio).
- **Lavori e casi studio**: testi (situazione, intervento, risultato), foto con trascinamento (ridimensionate, WebP, metadati GPS rimossi), fasi *Prima/Durante/Dopo*, copertina, bozza/pubblicato, in evidenza in home, campi SEO.
- **Iscritti newsletter**: confermati / in attesa / disiscritti, **prova del consenso** per ogni iscritto, disiscrizione, eliminazione, CSV.
- **Campagne e coupon**: editor con coupon (codice, descrizione, scadenza) e pulsante, anteprima, invio di prova, invio ai soli confermati, link di disiscrizione e header `List-Unsubscribe` in ogni email.
- **Registro consensi cookie**, **Account** (cambio password, altri utenti).

Sicurezza: password con scrypt, sessioni in cookie `HttpOnly`/`Secure`/`SameSite=Strict`, controllo Origin anti-CSRF, limite tentativi di login, `noindex` e `no-store` su tutta l'area.

## Cookie e privacy: come funziona (alternativa a iubenda)

iubenda offre tre cose: **testi delle policy**, **banner con blocco preventivo** e **registro dei consensi**. Qui sono tutte implementate nel sito:

| Requisito (Garante 10/06/2021, GDPR art. 7) | Implementazione |
|---|---|
| Nessun cookie non tecnico prima del consenso | Nessuno script di terze parti nell'HTML: GA4, Google Ads, Meta Pixel e Google Maps vengono caricati da `src/scripts/consent.ts` **solo** dopo il consenso per quella finalità (verificato: 0 richieste a terzi al primo accesso) |
| "X" di chiusura = rifiuto | La X mantiene i soli cookie tecnici |
| Accetta e Rifiuta con pari evidenza, nessuna casella preselezionata, scroll ≠ consenso | ✔ |
| Scelte granulari per finalità | Pannello *Personalizza*: Contenuti esterni (mappe), Statistiche, Marketing |
| Scelta ricordata 6 mesi, poi ri-proposta | Cookie tecnico `bota_consent` (180 giorni) + versione della policy: cambiando `legal.cookieVersion` in `src/config/site.ts` il banner ricompare |
| Revoca in ogni momento | Link "Preferenze cookie" nel footer e pulsante nella cookie policy; alla revoca vengono cancellati i cookie `_ga`, `_gcl`, `_fbp` e la pagina si ricarica |
| Prova del consenso | Ogni scelta è registrata lato server (ID anonimo, data, scelte, versione, IP troncato, browser) → *Registro consensi* nel gestionale |
| Google Consent Mode v2 (obbligatoria per Google Ads nell'UE) | Modalità "base": default `denied`, `update` solo dopo la scelta |
| Mappa Google | Anteprima locale senza cookie; l'iframe si carica solo con consenso o click su "Mostra mappa interattiva" |
| Font | Self-hosted (nessuna chiamata a Google Fonts) |
| Newsletter | Consenso separato, non preselezionato, double opt-in, prova del consenso, disiscrizione con un clic |

**Cosa resta in capo al titolare (Bota s.r.l.)** – la parte tecnica è a norma, ma i testi legali vanno approvati da chi è responsabile del trattamento:

1. far rileggere `privacy-policy` e `cookie-policy` (sono redatte sulla configurazione reale del sito) e confermare l'elenco fornitori della sezione 6;
2. firmare/accettare i DPA (accordi art. 28) dei fornitori: Vercel, Turso, provider email, Google, Meta (si accettano online nelle rispettive console);
3. tenere un registro dei trattamenti (consigliato);
4. se si aggiungono nuovi strumenti (es. Hotjar, chat), aggiornare cookie policy, `CookieBanner.astro` e `legal.cookieVersion`.

Se il cliente preferisce comunque avere i testi "garantiti" da un fornitore, si può usare **iubenda solo per generare privacy e cookie policy** (piano base) e incorporarle in queste pagine, mantenendo questo banner (più leggero e già con Lighthouse 100).

## SEO, accessibilità e performance

- Lighthouse (mobile e desktop) su tutte le pagine pubbliche: **100 / 100 / 100 / 100** (performance, accessibilità, best practice, SEO).
- Dati strutturati schema.org: `GeneralContractor` (indirizzo, orari, telefono, P.IVA, area servita), `Service`, `Article` per i casi studio, `BreadcrumbList`.
- Title/description unici, canonical, Open Graph con immagine 1200×630, sitemap dinamica, robots.txt.
- Accessibilità: contrasti AA, navigazione da tastiera, skip link, label su tutti i campi, errori annunciati agli screen reader, `prefers-reduced-motion`.
- Prestazioni: CSS inline, un solo font variabile (35 KB) precaricato, immagini AVIF/WebP responsive, ~10 KB di JavaScript totale, home statica con la sezione lavori caricata come *server island*.

## Messa online (dopo la conferma del cliente)

1. **Turso**: crea il database → `DATABASE_URL` e `DATABASE_AUTH_TOKEN`.
2. **Vercel**: importa il progetto, imposta le variabili di `.env.example`, crea uno store **Blob** (`BLOB_READ_WRITE_TOKEN`). Nota: per uso commerciale serve un team Vercel Pro (in alternativa il sito gira su qualsiasi server Node con `npm run build && node dist/server/entry.mjs`).
3. **Email**: parametri SMTP della casella info@bota.srl (o Resend con record SPF/DKIM sul dominio).
4. **Domini**: `bota.srl` e `admin.bota.srl` sullo stesso progetto (il `vercel.json` instrada admin.bota.srl verso il gestionale), `www` → redirect.
5. Crea gli utenti reali con `npm run admin:create` puntando al DB di produzione e **rimuovi i dati di esempio** con `npm run reset:demo`.
6. Google: Search Console + invio sitemap, GA4 (`PUBLIC_GA_ID`), conversione Google Ads sulla pagina grazie (`PUBLIC_GADS_ID`, `PUBLIC_GADS_CONVERSION_LABEL`), Profilo dell'Attività su Google con link al sito; Meta Pixel (`PUBLIC_META_PIXEL_ID`) e link alla pagina Facebook in `src/config/site.ts`.

## Da personalizzare

- **Logo**: `src/components/Logo.astro` (ora è un logo provvisorio) e `scripts/generate-assets.mjs` per favicon/immagine social.
- **Foto del sito**: sostituire i file in `src/assets/img/` (sono illustrazioni segnaposto; i sorgenti SVG sono in `sorgenti/`).
- **Dati aziendali, orari, social, WhatsApp**: `src/config/site.ts`. **Testi dei servizi**: `src/data/services.ts`.
