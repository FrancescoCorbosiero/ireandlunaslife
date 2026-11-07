# Archivio del sito WordPress (ireandlunaslife.it)

Snapshot del vecchio sito WordPress, preso il 7 novembre 2026 con
`tools/legacy-scrape` (`NODE_USE_ENV_PROXY=1 npm run scrape`). È il materiale di partenza per il
restyling come sito statico. **Non è codice da riusare**: il nuovo sito va riscritto da zero.

## Contenuto

| Percorso | Cosa c'è |
|---|---|
| `pages/<slug>/` | `content.md` (copy in Markdown), `text.md` (testo visibile), `content.html` (corpo WP), `page.html` (render completo), `meta.json` (titoli, immagini, link) |
| `posts/<slug>/` | stessa struttura, per gli articoli del blog |
| `screenshots/` | pagina intera, `-desktop` (1440px) e `-mobile` (390px @2x) |
| `media/library/` | i 34 file originali della Libreria Media |
| `media/index.json` | alt, dimensioni e pagine in cui compare ogni media |
| `style/` | CSS del tema custom, Google Fonts, `tokens.json` (colori e font calcolati) |
| `site.json` | menu, social, link esterni, tagline |

## Inventario

**Pagine:** Home · Chi sono · Consulenze · Blog · Contatti, più 1 articolo
("Il mio viaggio nel mondo della cinofilia", 3 aprile 2025). La Home mette insieme
Chi sono, Consulenze e Contatti.

**Chi è:** Irene Bellapianta, *Educatrice Cinofila certificata APNEC & esperta in nutrizione*,
con Luna (cane fulvo/merle). Fa parte del **Team Branco** (come Andrea Bellettati di
comunicazionecinofila, motivo in più per far sì che i due siti non si somiglino).

**Servizi:** Educazione · Alimentazione (piano personalizzato, con modulo Google Forms) ·
Dog-sitting.

**Contatti e link:**
- Email: irene.bp00@gmail.com
- Instagram: [@ireandlunaslife](https://www.instagram.com/ireandlunaslife/) (progetto) e
  [@irenebellapianta](https://www.instagram.com/irenebellapianta/) (personale)
- TikTok: @ireandlunaslife · Facebook (link di condivisione) · Etsy: ojodediosbyire.etsy.com
- Team Branco: https://www.teambranco.com/pages/irene-bellapianta
- Modulo alimentazione: Google Form `1B9JAsYbZ6LBWKU1vyhkWXpnS-uC8aW7uE3Ihjty4mW0`
  (l'URL in `site.json` contiene parametri `fbclid` ed `edit_requested`, da ripulire)

**Media utili:** foto di Luna (`luna-*.jpg`, fino a 5120px), di Irene (`irene-*.jpg`), il
certificato APNEC (`certificato.jpg`), il collage con gli avatar cartoon (`collage.png`), il
logo (`logo*.png`, versione bianca), il logo Team Branco, i prodotti Reico (non usati nelle
pagine), gli sfondi "muro dipinto" (`background*.jpg`).
Doppioni: `luna-9.jpg` = `luna-9-1.jpg`, `collage.png` = `collage-1.png`. Molti originali
pesano 1–3,6 MB: vanno ricompressi (webp/avif responsive) nel nuovo sito.

**Copy da sistemare:** "l mio viaggio…" (manca la I), "Ire & Luna‘s" (apostrofo sbagliato),
`site.json` riporta "Senza categoria" come unica categoria del blog.

## Stile attuale (da `screenshots/` e `style/tokens.json`)

- **Mood:** giocoso, affettuoso, "cartoon". Emoji ovunque (🐾 🎓 🥩 🐕 ❤️), avatar disegnati
  di Irene e Luna, zampette nere come decoro.
- **Colori:** corallo/salmone (`#ff5e78`, `#ff6f61`, `#ff6347`), arancio intonaco nello
  sfondo dell'hero, teal/petrolio (macchia del logo, fascia consulenze), giallo
  (`#ffae00`, `#ffa500`, bottone Team Branco), lilla nella card Educazione, grigio antracite
  (`#404040`, `#333`) per footer e bottoni.
- **Tipografia:** *Coiny* (tondo e grasso, usato quasi ovunque, anche per il corpo, che
  risulta poco leggibile) + *Pacifico* (corsivo per il logo e i titoli di sezione).
- **Forme:** card molto arrotondate (~40px), bottoni a pillola, ombre morbide, bordo
  tratteggiato attorno al logo, sfondi fotografici a tutta larghezza.
- **Punti deboli:** corpo del testo in display font, testi lunghi centrati, gerarchia
  debole, sezioni separate da fasce grigie piatte, immagini pesanti, Home che duplica le
  altre pagine.

## Indicazioni per il restyling

> **Aggiornamento:** il nuovo sito usa come riferimento di stile il branch `template-bacheca`
> di comunicazionecinofila (sticker, nastri, polaroid, ombre "a timbro"), con la codebase
> testata su andreabellettati.it. Per non sembrare lo stesso sito cambiano palette (teal,
> corallo, giallo, prugna/lilla), font (Lilita One, Nunito, Pacifico), foto, sticker e testi.
> Vedi il README principale.
