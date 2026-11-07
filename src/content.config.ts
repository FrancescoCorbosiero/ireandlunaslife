import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content Collections in Markdown: Irene aggiunge articoli senza toccare codice.
 * Metti i file in src/content/articoli/*.md: il nome del file diventa lo
 * slug della pagina di dettaglio (/blog/<slug>).
 */

const articoli = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articoli' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    category: z.string(),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    /** Etichetta del placeholder quando manca la foto reale (es. "FOTO · CIOTOLA"). */
    placeholderLabel: z.string().optional(),
    /** Mostrato in evidenza in cima all'indice. */
    featured: z.boolean().default(false),
    /** published = pagina on-site; coming-soon = card "Presto disponibile". */
    status: z.enum(['published', 'coming-soon']).default('published'),
    /** Se presente, i link puntano qui (es. Instagram) invece della pagina di dettaglio. */
    externalUrl: z.url().optional(),
  }),
});

export const collections = { articoli };
