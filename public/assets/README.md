# Foto del sito: carica il file col nome giusto e via

Ci sono due cartelle di foto:

- **`src/assets/`**: le foto delle pagine. Astro le ottimizza al build (webp
  responsive). Ogni foto ha un nome che dice cosa raffigura; per cambiarla basta
  caricare un file con lo **stesso nome** (jpg consigliato).
- **`public/assets/`** (qui): favicon, anteprime social e foto degli articoli,
  servite così come sono. Dopo un cambio: `npm run assets` (comprime le foto e,
  se hai cambiato `logo.jpg`, rigenera favicon e icone).

## `public/assets/`

| File | A cosa serve |
|---|---|
| `logo.jpg` | Avatar tondo in header e footer, sorgente delle favicon (quadrato, ≥ 512px) |
| `og-home.jpg` | Anteprima social di home e contatti (**1200×630**) |
| `hero.jpg`, `chi-sono.jpg` | Anteprime social di Consulenze e Chi sono, dati strutturati |
| `articolo-<slug>.jpg` | Copertina dell'articolo `src/content/articoli/<slug>.md` (si collega da sola) |
| `blog/*.jpg` | Foto dentro gli articoli |

## `src/assets/`

| File | Dove compare |
|---|---|
| `hero.jpg` | Home, il disco dell'hero |
| `chi-sono.jpg` | Home, la foto ad arco di "Chi siamo" |
| `irene-luna-selfie.jpg` | Chi sono, il ritratto dell'hero (lo sostituisce `ritratto.jpg`, se lo carichi) |
| `irene-lago.jpg` | Home (polaroid dell'approccio), Consulenze (Educazione), Chi sono |
| `luna-ciotola.jpg` | Home (polaroid "la pappa!"), Consulenze (Alimentazione) |
| `dog-sitting.jpg` | Consulenze (Dog-sitting) |
| `certificato.jpg` | Chi sono, il diploma |
| `luna-campo.jpg`, `luna-natale.jpg`, `luna-panchina.jpg`, `luna-bacio.jpg`, `luna-ritratto.jpg`, `luna-erba.jpg` | Home, la bacheca di polaroid (se ne manca una, sparisce dalla bacheca) |
| `team-branco.png` | Card Team Branco (home e contatti) |

## Sticker

Le foto scontornate con il bordo bianco stanno in `src/assets/stickers/` e si
rigenerano con `python scripts/make-stickers.py` partendo dagli originali ad alta
risoluzione in `legacy/media/library/` (vedi l'intestazione dello script).
