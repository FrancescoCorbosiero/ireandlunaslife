/**
 * Configurazione centrale del sito: sorgente unica di verità per
 * contatti, link e integrazioni. Importabile sia lato server (.astro)
 * sia lato client (scripts), così non si duplicano valori in giro.
 */

/** Dominio di produzione: aggiorna qui, in astro.config.mjs e in public/robots.txt. */
export const SITE = 'https://ireandlunaslife.it';

/** Brand */
export const SITE_NAME = "Ire & Luna's Life";
export const OWNER_NAME = 'Irene Bellapianta';
export const SITE_TAGLINE = 'Educatrice cinofila & nutrizione';

/** Contatti reali (cablati ovunque) */
export const EMAIL = 'irene.bp00@gmail.com';
export const IG_HANDLE = '@ireandlunaslife';
export const IG_URL = 'https://www.instagram.com/ireandlunaslife/';
/** Il profilo personale di Irene (collaborazioni). */
export const IG_PERSONAL_HANDLE = '@irenebellapianta';
export const IG_PERSONAL_URL = 'https://www.instagram.com/irenebellapianta/';
export const TIKTOK_URL = 'https://www.tiktok.com/@ireandlunaslife';
export const FACEBOOK_URL = 'https://www.facebook.com/share/1BsukpDQSX/';
export const ETSY_URL = 'https://ojodediosbyire.etsy.com/';
export const TEAM_BRANCO_URL = 'https://www.teambranco.com/pages/irene-bellapianta';
/** Modulo Google per il piano alimentare personalizzato. */
export const NUTRITION_FORM_URL = 'https://docs.google.com/forms/d/1B9JAsYbZ6LBWKU1vyhkWXpnS-uC8aW7uE3Ihjty4mW0/viewform';

/**
 * WhatsApp e telefono: per ora vuoti, quindi bottoni, link e invio del
 * questionario su WhatsApp restano nascosti e i contatti passano da email e
 * Instagram. Quando c'è un numero, scrivilo qui (formato internazionale senza
 * "+" né spazi, es. '393331234567') e rifai il build: tutto il flusso
 * WhatsApp si riattiva da solo (header, footer, contatti, questionario).
 */
export const WA_NUMBER: string = '';
export const HAS_WA = WA_NUMBER !== '';
export const WA_LINK = HAS_WA ? `https://wa.me/${WA_NUMBER}` : '';
export const PHONE = HAS_WA ? `+${WA_NUMBER}` : '';
export const PHONE_DISPLAY = HAS_WA ? `+${WA_NUMBER.slice(0, 2)} ${WA_NUMBER.slice(2, 5)} ${WA_NUMBER.slice(5)}` : '';

/**
 * Carattere dei titoli grandi (il testo resta sempre in Nunito). Cambia
 * questa riga e rifai il build:
 *  · 'impact'  — Lilita One maiuscolo: tondo e pesante, da manifesto allegro
 *  · 'rounded' — Nunito nero in minuscolo: più quieto
 */
export const TYPE_STYLE: 'impact' | 'rounded' = 'impact';

/** Anno dell'attestato di Educatrice Cinofila (APNEC, dicembre 2024). */
export const CERTIFIED_SINCE = 2024;

/** Numero all'italiana con il punto delle migliaia anche a 4 cifre (4.760). */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('it-IT', { useGrouping: 'always' }).format(n);
}

/**
 * cal.com: UNICA costante per l'integrazione del calendario (serve anche
 * WhatsApp, vedi CallModal). Finché è vuota, il modale non compare.
 */
export const CAL_LINK = '';

/**
 * Endpoint di invio dei form (modulo "Scrivimi" della pagina Contatti).
 *
 * Si decide AL BUILD con la variabile d'ambiente PUBLIC_FORM_ENDPOINT:
 *  · vuota (default)                      → Netlify Forms (POST alla pagina)
 *  · '/api/form'                          → server Docker + AWS SES (Dockerfile la imposta già)
 *  · '/.netlify/functions/invia-form'     → Netlify Function + AWS SES
 * Il payload è sempre lo stesso: application/x-www-form-urlencoded con
 * `form-name`. La logica SES è in server/form-handler.mjs.
 */
export const FORM_ENDPOINT: string = import.meta.env.PUBLIC_FORM_ENDPOINT ?? '';

/** Helper: costruisce un deep-link WhatsApp con testo precompilato ('' senza numero). */
export function waLink(text: string): string {
  return HAS_WA ? `${WA_LINK}?text=${encodeURIComponent(text)}` : '';
}

/** Helper: link email con oggetto (e testo) precompilati. */
export function mailLink(subject: string, body = ''): string {
  const q = new URLSearchParams({ subject, ...(body ? { body } : {}) });
  return `mailto:${EMAIL}?${q.toString().replace(/\+/g, '%20')}`;
}
