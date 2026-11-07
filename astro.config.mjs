// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio definitivo (anche in src/config.ts e public/robots.txt).
// Serve a sitemap.xml, canonical e agli URL assoluti di Open Graph.
export default defineConfig({
  site: 'https://ireandlunaslife.it',
  integrations: [sitemap()],
  // Font self-hosted (Fonts API, provider locale): i .woff2 (subset latin,
  // scaricati una tantum da Google Fonts / Fontsource) vivono in src/assets/fonts e vengono
  // serviti da /_astro con hash immutabile. Vantaggi:
  // · zero richieste a Google dal browser dei visitatori (privacy/GDPR);
  // · build deterministica, nessuna dipendenza di rete al deploy;
  // · fallback locali con metriche adattate (meno layout shift al caricamento).
  fonts: [
    {
      // Titoli grandi e nastri: tondo, pesante, allegro.
      provider: fontProviders.local(),
      name: 'Lilita One',
      cssVariable: '--font-lilita',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [{ src: ['./src/assets/fonts/lilita-one-latin.woff2'], weight: 400, style: 'normal' }],
      },
    },
    {
      // Testo e titoli piccoli: una sola famiglia variabile (peso 200–1000).
      provider: fontProviders.local(),
      name: 'Nunito',
      cssVariable: '--font-nunito',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/nunito-latin.woff2'], weight: '200 1000', style: 'normal' },
          { src: ['./src/assets/fonts/nunito-latin-italic.woff2'], weight: '200 1000', style: 'italic' },
        ],
      },
    },
    {
      // Il corsivo del logo, per le note scritte a mano.
      provider: fontProviders.local(),
      name: 'Pacifico',
      cssVariable: '--font-pacifico',
      fallbacks: ['cursive'],
      options: {
        variants: [{ src: ['./src/assets/fonts/pacifico-latin.woff2'], weight: 400, style: 'normal' }],
      },
    },
  ],
  // Gli URL del vecchio sito WordPress che cambiano: chi arriva da Google o
  // da un vecchio link atterra sulla pagina giusta.
  redirects: {
    '/ireandlunaslife-blog': '/blog/il-mio-viaggio-nel-mondo-della-cinofilia',
    '/category/senza-categoria': '/blog',
    '/feed': '/rss.xml',
  },
  // Prefetch dei link interni (lavora insieme alle View Transitions del ClientRouter).
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});
