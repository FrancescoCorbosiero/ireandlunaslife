/* =====================================================================
   SEO — impostazioni centrali e helper per i dati strutturati.
   "Preparazione": qui si concentrerà la configurazione SEO definitiva
   quando i contenuti saranno reali (titoli, description, OG image dedicate…).
   ===================================================================== */
import { SITE, SITE_NAME, OWNER_NAME, EMAIL, PHONE, IG_URL, TIKTOK_URL, FACEBOOK_URL, TEAM_BRANCO_URL } from '../config';
import { publicImage } from './images';

export const DEFAULT_DESCRIPTION =
  'Irene Bellapianta, educatrice cinofila certificata APNEC: educazione, alimentazione su misura e dog-sitting, con Luna sempre al fianco.';
/** Carica og-home.jpg (1200×630) in public/assets per un'anteprima social
    dedicata; finché manca si usa il logo. */
export const DEFAULT_OG_IMAGE = publicImage('og-home') ?? '/assets/logo.jpg';
export const LOCALE = 'it_IT';
export const DEFAULT_ROBOTS = 'index, follow';
export const THEME_COLOR = '#145a5c';

/** Handle Twitter/X — compila quando l'account sarà attivo (es. '@...'). */
export const TWITTER_HANDLE = '';
/** Codice di verifica Google Search Console — incolla qui quando disponibile. */
export const GOOGLE_SITE_VERIFICATION = '';

export function absoluteUrl(path: string): string {
  return new URL(path, SITE).href;
}

const SAME_AS = [IG_URL, TIKTOK_URL, FACEBOOK_URL, TEAM_BRANCO_URL];

/** Grafo base presente su ogni pagina: WebSite + Person + LocalBusiness. */
export function siteGraph(): Record<string, unknown>[] {
  return [
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: SITE,
      name: SITE_NAME,
      inLanguage: 'it-IT',
      publisher: { '@id': `${SITE}/#irene` },
    },
    {
      '@type': 'Person',
      '@id': `${SITE}/#irene`,
      name: OWNER_NAME,
      jobTitle: 'Educatrice cinofila certificata APNEC',
      url: SITE,
      image: absoluteUrl('/assets/chi-sono.jpg'),
      sameAs: SAME_AS,
    },
    {
      '@type': 'LocalBusiness',
      '@id': `${SITE}/#business`,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      image: absoluteUrl('/assets/hero.jpg'),
      url: SITE,
      email: EMAIL,
      ...(PHONE ? { telephone: PHONE } : {}),
      areaServed: 'IT',
      founder: { '@id': `${SITE}/#irene` },
      sameAs: SAME_AS,
      knowsAbout: ['Educazione cinofila', 'Alimentazione del cane', 'Relazione cane-proprietario', 'Dog-sitting'],
    },
  ];
}

/** BreadcrumbList per le pagine di dettaglio. */
export function breadcrumbLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.url),
    })),
  };
}
