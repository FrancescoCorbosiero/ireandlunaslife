# Ire & Luna's Life

Sito di **Irene Bellapianta**, educatrice cinofila certificata APNEC, e di Luna, la sua
Australian Cattle Dog. Sostituisce il vecchio WordPress su
[ireandlunaslife.it](https://ireandlunaslife.it). Costruito con **Astro** (TypeScript),
statico, pensato prima per il telefono.

> **Da dove viene.** La codebase è quella di
> [comunicazionecinofila](https://github.com/FrancescoCorbosiero/comunicazionecinofila)
> (testata in produzione su andreabellettati.it), nella versione del branch
> **`template-bacheca`**: sticker scontornati, nastri inclinati, polaroid con lo scotch,
> timbri ed etichette storte. Da `main` sono stati portati i fix successivi (l'anello del
> bottone "torna su"). Architettura, animazioni (GSAP + Lenis), form e deploy sono gli
> stessi; **design system, foto e testi sono di Irene**:
>
> - palette dal vecchio sito e dal logo: teal/laguna, corallo, giallo sole, prugna e lilla,
>   su un fondo latte caldo (`src/styles/brand.css`);
> - font **Lilita One** (titoli e nastri), **Nunito** (testo), **Pacifico** (il corsivo del
>   logo, per le note a mano), self-hosted;
> - sticker ricavati dalle foto vere di Irene e Luna (`scripts/make-stickers.py`).

Il vecchio sito è archiviato in [`legacy/`](legacy/README.md): testi, media originali,
screenshot e analisi dello stile.

## Comandi

> **Richiede Node ≥ 22.12** (Astro 6). Il repo include `.nvmrc`.

```bash
npm install        # installa le dipendenze
npm run dev        # sviluppo su http://localhost:4321
npm run build      # build statica in dist/
npm run preview    # anteprima della build
npm run check      # type-check (astro check)
npm run assets     # rigenera favicon + comprime le foto di public/assets
```

## Pagine

| URL | Cosa c'è |
|---|---|
| `/` | Hero, i tre servizi, chi siamo, l'approccio, come iniziamo, la bacheca di Luna, blog, Team Branco |
| `/chi-sono` | La storia di Irene (Rocky → Luna → diploma APNEC), il diploma, Instagram |
| `/consulenze` | Educazione, Alimentazione (con il Google Form), Dog-sitting |
| `/blog`, `/blog/<slug>` | Il blog (Markdown in `src/content/articoli/`) |
| `/contatti` | Modulo "Scrivimi" in tre passi + tutti i canali |

Gli URL del vecchio WordPress restano validi: `/chi-sono`, `/consulenze`, `/blog`,
`/contatti` sono gli stessi, e `/ireandlunaslife-blog` (il vecchio articolo) e `/feed`
reindirizzano (`redirects` in `astro.config.mjs`).

## Struttura

```
src/
  config.ts              # ⭐ contatti, link social, Team Branco, WhatsApp (vuoto), stile titoli
  lib/seo.ts             # default SEO + JSON-LD (Person/LocalBusiness/breadcrumb)
  layouts/Base.astro     # <head>: meta/OG, JSON-LD, font, ClientRouter
  components/            # Header, Footer, Sticker, Ticker, ArticleCard, icone…
  scripts/site.ts        # nav, modulo "Scrivimi", ricerca blog, sticky CTA…
  scripts/motion.ts      # ⭐ animazioni GSAP + Lenis (API ad attributi: vedi l'intestazione)
  pages/                 # index, chi-sono, consulenze, contatti, blog, 404, rss
  content/articoli/*.md  # articoli del blog
  styles/                # brand.css (design system), site.css, sections.css, motion.css…
  assets/                # foto (ottimizzate al build), sticker, font
public/assets/           # favicon, anteprime social, foto degli articoli (vedi il README lì)
legacy/                  # archivio del vecchio WordPress
tools/legacy-scrape/     # lo script che ha creato l'archivio
server/, netlify/        # invio dei form via AWS SES (Docker o Netlify Function)
```

## Aggiungere un articolo

Crea `src/content/articoli/mio-articolo.md` (il nome file è lo slug):

```md
---
title: "Titolo dell'articolo"
date: 2026-06-01
category: "Educazione"   # Educazione | Alimentazione | Dog-sitting | Racconti
excerpt: "Riassunto breve mostrato nelle card."
coverAlt: "Descrizione della copertina"
featured: false
---

Corpo dell'articolo in **Markdown**.
```

La copertina si collega da sola se carichi `public/assets/articolo-mio-articolo.jpg`.

## Contatti e WhatsApp

Tutto sta in [`src/config.ts`](./src/config.ts). Oggi **non c'è un numero di telefono**:
`WA_NUMBER` è vuoto, quindi bottoni WhatsApp, link `tel:` e il modale "scegli uno slot" non
compaiono, e il modulo "Scrivimi" invia un'email. Il codice WhatsApp della codebase originale
è rimasto: **scrivi il numero in `WA_NUMBER`** (es. `'393331234567'`), rifai il build e il
flusso WhatsApp-first si riattiva ovunque (header, footer, contatti, CTA, articoli).

## Form: email via AWS SES

Il modulo passa da un solo punto di uscita (`submitForm()` in `src/scripts/site.ts`); la
destinazione si decide al build con `PUBLIC_FORM_ENDPOINT` (vedi `src/config.ts`):

| `PUBLIC_FORM_ENDPOINT` | Dove finiscono i dati |
|---|---|
| `/api/form` (default nell'immagine Docker) | server Node del container → **email via AWS SES** |
| `/.netlify/functions/invia-form` | Netlify Function → **email via AWS SES** |
| vuota | Netlify Forms (dashboard Netlify) |

L'email arriva a Irene con Reply-To = l'email di chi scrive (e un bottone "Rispondi su
WhatsApp" se ha lasciato il telefono). Se l'invio fallisce, il sito propone un'email già
compilata. La logica è in `server/form-handler.mjs`.

**Configurare SES (una volta):** verifica il dominio `ireandlunaslife.it` in SES (DKIM, SPF,
DMARC), esci dalla sandbox, crea un utente IAM con il solo permesso `ses:SendEmail`, poi copia
`.env.example` in `.env` e compila regione, chiavi, `SES_FROM` e `SES_TO`. Con
`SES_DRY_RUN=true` le email vengono solo stampate nei log.

## Deploy con Docker + Caddy

```bash
docker network create caddy          # una volta, se Caddy non l'ha già
cp .env.example .env                 # dominio + credenziali SES
docker compose up -d --build
```

L'immagine builda il sito con `PUBLIC_FORM_ENDPOINT=/api/form` e lo serve con
`server/index.mjs`; HTTPS e dominio li gestisce Caddy tramite label. In alternativa la build
statica gira su Netlify / Vercel / Cloudflare Pages (`npm run build`, output `dist/`).

**Dominio:** `https://ireandlunaslife.it`, impostato in `astro.config.mjs`, `src/config.ts`,
`public/robots.txt` e `.env.example`. Al momento del passaggio, punta i record DNS di
`ireandlunaslife.it` e `www` al server dove gira Caddy.

## Sticker

```bash
pip install "rembg[cpu]" scipy
python scripts/make-stickers.py
```

Scontorna gli originali in `legacy/media/library/` (modello BiRefNet, scaricato da GitHub al
primo uso) e salva in `src/assets/stickers/`. Nelle pagine:
`<Sticker src={...} width={240} rotate={-4} />`.

## Da completare

- **Numero WhatsApp** (se Irene vuole usarlo): `WA_NUMBER` in `src/config.ts`.
- **AWS SES**: dominio, sandbox, utente IAM, `.env`.
- **Altri articoli** per il blog (oggi c'è quello migrato dal vecchio sito).
- **Verifica Search Console**: `GOOGLE_SITE_VERIFICATION` in `src/lib/seo.ts`.
