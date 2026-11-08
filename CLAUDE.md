# CLAUDE.md — Ire & Luna's Life (ireandlunaslife.it)

Sito di **Irene Bellapianta**, educatrice cinofila certificata APNEC, e della sua cagnolina Luna.
Il sito è gestito dallo studio per conto della cliente. Il branch di default è `main`.

## Generatore e versioni

- **Astro 6** (`astro` ^6.4.4, nel lockfile 6.4.4), TypeScript in modalità strict, output **statico**.
- Integrazione `@astrojs/sitemap` 3.7.x; animazioni con **GSAP** 3 e **Lenis** 1.
- **Node ≥ 22.12** (`.nvmrc` / `.node-version` = 22).
- Build: `npm ci && npm run build` → sito finito in `dist/`.
- Type-check: `npm run check` (lo esegue anche la CI in `.github/workflows/build.yml`).
- Gestore pacchetti: **npm** (`package-lock.json`). Non usare yarn/pnpm.

## Struttura

```
src/
  content/articoli/*.md  # articoli del blog (Content Collection) — CONTENUTO
  pages/                 # pagine: index, chi-sono, consulenze, contatti, blog, blog/[slug], 404, rss.xml.ts
  components/            # Header, Footer, Sticker, Ticker, ArticleCard, CoverImage, icone…
  layouts/Base.astro     # <head>: meta/OG, JSON-LD, font, ClientRouter
  styles/                # brand.css (design system: palette, font), site.css, sections.css, content.css, motion.css, effects.css
  assets/                # foto delle pagine (ottimizzate da Astro), sticker/, fonts/
  scripts/               # site.ts (nav, modulo "Scrivimi", ricerca blog), motion.ts (GSAP + Lenis)
  lib/                   # seo.ts (SEO e JSON-LD), images.ts, dates.ts
  config.ts              # contatti, link social, WhatsApp, endpoint dei form
  content.config.ts      # schema della collection "articoli"
public/
  assets/                # favicon, immagini social (OG), copertine e foto degli articoli
  robots.txt, _headers, site.webmanifest, favicon.ico
server/, netlify/        # invio dei form via AWS SES (server Node per Docker / Netlify Function)
legacy/                  # archivio del vecchio sito WordPress (solo riferimento)
tools/legacy-scrape/     # script che ha creato l'archivio
scripts/                 # optimize-assets.mjs, make-stickers.py
```

Pagine e URL: `/`, `/chi-sono`, `/consulenze`, `/blog`, `/blog/<slug>`, `/contatti`, `/404`, `/rss.xml`.

## Contenuto vs layout vs configurazione

- **Contenuto** (modificabile su richiesta della cliente): articoli in `src/content/articoli/`,
  i testi dentro le pagine `src/pages/*.astro`, le foto in `src/assets/` e `public/assets/`.
- **Layout / grafica** (modificabile con cura): `src/components/`, `src/layouts/`, `src/styles/`.
- **Configurazione e codice** (non toccare senza indicazione esplicita dello studio):
  `astro.config.mjs`, `src/config.ts`, `src/content.config.ts`, `src/lib/`, `src/scripts/`,
  `package.json`, `package-lock.json`, `tsconfig.json`, `netlify.toml`, `public/_headers`,
  `public/robots.txt`, `public/site.webmanifest`, `Dockerfile`, `docker-compose.yml`,
  `.github/`, `server/`, `netlify/`, `scripts/`, `tools/`, `.env*`.

## Convenzioni

- **Lingua**: tutto il sito è in **italiano** (`lang="it"`, locale `it_IT`). Tono caldo, in prima
  persona (Irene parla al lettore con il "tu"). Usa apostrofi e virgolette tipografiche come nei
  testi esistenti (’ “ ”), date e numeri all'italiana (`formatNumber` in `src/config.ts`).
- **Formattazione**: indentazione a 2 spazi, apici singoli in TS/JS, stile dei file esistenti.
  Commenti nel codice in italiano.
- **Nomi file**: minuscolo, kebab-case, senza accenti (`chi-sono.astro`, `luna-prato.jpg`).
  Il nome del file `.md` di un articolo è lo slug dell'URL.
- **Stile**: usa le variabili e le classi del design system in `src/styles/brand.css`
  (colori, font Lilita One / Nunito / Pacifico); non introdurre nuovi font esterni né CDN
  (i font sono self-hosted per privacy/GDPR).
- **Immagini**: le foto delle pagine vanno in `src/assets/` e si importano nel frontmatter
  della pagina (Astro le ottimizza). Per sostituire una foto basta caricare un file con lo
  **stesso nome**. Le foto degli articoli e le immagini social vanno in `public/assets/`
  (vedi `public/assets/README.md`). Ogni immagine deve avere un `alt` descrittivo in italiano.

### Aggiungere un articolo del blog

Crea `src/content/articoli/<slug>.md`:

```md
---
title: "Titolo dell'articolo"
date: 2026-06-01
category: "Educazione"   # Educazione | Alimentazione | Dog-sitting | Racconti
excerpt: "Riassunto breve mostrato nelle card."
coverAlt: "Descrizione della copertina"
featured: false
---

Corpo in **Markdown**.
```

Campi opzionali (schema in `src/content.config.ts`): `cover`, `placeholderLabel`,
`status` (`published` | `coming-soon`), `externalUrl`. La copertina si collega da sola se
esiste `public/assets/articolo-<slug>.jpg`; le foto interne vanno in `public/assets/blog/`.

### Aggiungere una pagina

Crea `src/pages/<nome>.astro` usando il layout `Base` (`import Base from '../layouts/Base.astro'`)
con `title` e `description` in italiano, sul modello delle pagine esistenti. Se deve comparire nel
menu, aggiungi la voce in `src/components/SiteHeader.astro` (e nel footer se serve).

## Cosa non deve mai cambiare

- Il dominio `https://ireandlunaslife.it` (in `astro.config.mjs`, `src/config.ts`, `public/robots.txt`).
- Gli URL esistenti (`/chi-sono`, `/consulenze`, `/blog`, `/contatti`, `/blog/<slug>`) e i
  `redirects` dal vecchio WordPress in `astro.config.mjs`: servono a non perdere posizionamento.
- Il contenuto della cartella `legacy/` (archivio storico) e `tools/`.
- Credenziali e segreti: non creare né committare `.env`; nessuna chiave AWS nel repo.
- La logica di invio form (`submitForm()` in `src/scripts/site.ts`, `server/`, `netlify/`) e
  l'endpoint `PUBLIC_FORM_ENDPOINT`.
- I contatti reali della cliente (email, Instagram, link) in `src/config.ts`, salvo richiesta
  esplicita; il numero WhatsApp (`WA_NUMBER`) si imposta solo se la cliente lo fornisce.
- Dipendenze e lockfile: non aggiungere o aggiornare pacchetti.
- Il diploma/certificato APNEC e i dati professionali di Irene non vanno alterati.
