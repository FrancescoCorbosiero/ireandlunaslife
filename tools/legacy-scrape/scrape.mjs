// Archivia il vecchio sito WordPress di ireandlunaslife.it in /legacy:
//   legacy/pages/<slug>/      page.html (render completo), content.html (corpo WP),
//                             content.md (copy in Markdown), text.md (testo visibile), meta.json
//   legacy/posts/<slug>/      idem per gli articoli
//   legacy/screenshots/       <slug>-desktop.png / <slug>-mobile.png (pagina intera)
//   legacy/media/             tutti i file della Libreria Media (originali) + asset del tema
//   legacy/media/index.json   elenco media con alt, didascalia, dimensioni, pagine dove compaiono
//   legacy/style/             CSS del tema, palette e font calcolati (tokens.json)
//   legacy/site.json          menu, social, link esterni, metadati del sito
//
// Uso: cd tools/legacy-scrape && npm install && npm run scrape
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = 'https://ireandlunaslife.it';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../legacy');
const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });

const out = (...p) => path.join(ROOT, ...p);
const write = async (file, data) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data, null, 2) + '\n');
};
const getJSON = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};
const decode = (s) => cheerio.load(`<p>${s}</p>`)('p').text();
const slugOf = (link) => {
  const p = new URL(link).pathname.replace(/^\/|\/$/g, '');
  return p || 'home';
};

async function download(url, dest) {
  try {
    await fs.access(dest);
    return true;
  } catch {}
  const r = await fetch(url);
  if (!r.ok) {
    console.warn('  ! download fallito', r.status, url);
    return false;
  }
  await write(dest, Buffer.from(await r.arrayBuffer()));
  return true;
}

// Rimuove la variante -WxH di WordPress per risalire all'originale
const originalOf = (u) => u.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '').replace(/-scaled(?=\.[a-z0-9]+$)/i, '');

async function main() {
  await fs.mkdir(ROOT, { recursive: true });

  // ---------- 1. Contenuti dalla REST API ----------
  const fields = 'id,slug,link,title,content,excerpt,date,modified,featured_media,parent,menu_order,categories,tags';
  const pages = await getJSON(`${BASE}/wp-json/wp/v2/pages?per_page=100&_fields=${fields}`);
  const posts = await getJSON(`${BASE}/wp-json/wp/v2/posts?per_page=100&_fields=${fields}`);
  const media = await getJSON(`${BASE}/wp-json/wp/v2/media?per_page=100&_fields=id,slug,source_url,alt_text,caption,title,mime_type,media_details,post,date`);
  const categories = await getJSON(`${BASE}/wp-json/wp/v2/categories?per_page=100&_fields=id,name,slug,count`);
  const siteInfo = await getJSON(`${BASE}/wp-json/?_fields=name,description,url,home,site_logo,site_icon_url`);

  const entries = [
    ...pages.map((p) => ({ ...p, kind: 'pages' })),
    ...posts.map((p) => ({ ...p, kind: 'posts' })),
  ];
  console.log(`Pagine: ${pages.length}, articoli: ${posts.length}, media: ${media.length}`);

  // ---------- 2. Media Library (originali) ----------
  const mediaIndex = {};
  for (const m of media) {
    const file = path.basename(new URL(m.source_url).pathname);
    const ok = await download(m.source_url, out('media', 'library', file));
    // in WP 'source_url' può essere la versione -scaled: prova anche l'originale
    const orig = m.media_details?.original_image;
    if (orig) await download(m.source_url.replace(file, orig), out('media', 'library', orig));
    mediaIndex[m.source_url] = {
      id: m.id,
      file: `library/${file}`,
      original: orig ? `library/${orig}` : undefined,
      title: decode(m.title?.rendered ?? ''),
      alt: m.alt_text,
      caption: cheerio.load(m.caption?.rendered ?? '').text().trim(),
      mime: m.mime_type,
      width: m.media_details?.width,
      height: m.media_details?.height,
      date: m.date,
      downloaded: ok,
      usedIn: [],
    };
  }

  // ---------- 3. Render con Playwright: HTML, testo, screenshot, stile ----------
  const browser = await chromium.launch();
  const viewports = {
    desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  };
  const contexts = {};
  for (const [k, v] of Object.entries(viewports)) contexts[k] = await browser.newContext({ ...v, locale: 'it-IT' });

  const extraAssets = new Set();
  const styleSamples = [];
  const externalLinks = new Map();
  let site = null;

  for (const e of entries) {
    const slug = slugOf(e.link);
    const dir = out(e.kind, slug);
    console.log(`→ ${e.kind}/${slug}`);

    const contentHtml = e.content?.rendered ?? '';
    await write(path.join(dir, 'content.html'), contentHtml);

    for (const [vp, ctx] of Object.entries(contexts)) {
      const page = await ctx.newPage();
      // registra ogni immagine/font caricata
      page.on('response', (res) => {
        const u = res.url();
        if (u.startsWith(BASE) && /\.(png|jpe?g|webp|gif|svg|avif|woff2?|ttf|otf|mp4|webm)(\?|$)/i.test(u)) extraAssets.add(u.split('?')[0]);
      });
      await page.goto(e.link, { waitUntil: 'networkidle', timeout: 60000 });
      // scroll per attivare lazy-load e animazioni on-scroll
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(800);
      await page.screenshot({ path: out('screenshots', `${e.kind === 'posts' ? 'post-' : ''}${slug}-${vp}.png`), fullPage: true });

      if (vp !== 'desktop') {
        await page.close();
        continue;
      }

      const html = await page.content();
      await write(path.join(dir, 'page.html'), html);

      const data = await page.evaluate(() => {
        const main = document.querySelector('main') || document.body;
        const clean = main.cloneNode(true);
        clean.querySelectorAll('script,style,noscript').forEach((n) => n.remove());
        const imgs = [...document.querySelectorAll('img')].map((i) => ({
          src: i.currentSrc || i.src,
          alt: i.alt,
          w: i.naturalWidth,
          h: i.naturalHeight,
        }));
        const bgs = [...document.querySelectorAll('*')]
          .map((n) => getComputedStyle(n).backgroundImage)
          .filter((b) => b && b.startsWith('url('))
          .flatMap((b) => [...b.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]));
        const links = [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.href, text: a.innerText.trim() }));
        const headings = [...main.querySelectorAll('h1,h2,h3,h4')].map((h) => ({ tag: h.tagName.toLowerCase(), text: h.innerText.trim() }));
        const nav = [...document.querySelectorAll('header nav a, nav a, .menu a')].map((a) => ({ href: a.href, text: a.innerText.trim() }));
        const footer = document.querySelector('footer')?.innerText.trim() ?? '';

        // campioni di stile per i token
        const pick = (sel) =>
          [...document.querySelectorAll(sel)].slice(0, 6).map((n) => {
            const s = getComputedStyle(n);
            return {
              sel,
              text: (n.innerText || '').trim().slice(0, 40),
              color: s.color,
              background: s.backgroundColor,
              backgroundImage: s.backgroundImage !== 'none' ? s.backgroundImage.slice(0, 200) : undefined,
              fontFamily: s.fontFamily,
              fontSize: s.fontSize,
              fontWeight: s.fontWeight,
              lineHeight: s.lineHeight,
              letterSpacing: s.letterSpacing,
              textTransform: s.textTransform,
              borderRadius: s.borderRadius,
              border: s.border,
              boxShadow: s.boxShadow !== 'none' ? s.boxShadow : undefined,
              padding: s.padding,
            };
          });
        const samples = ['body', 'header', 'footer', 'h1', 'h2', 'h3', 'p', 'a', 'button, .btn, .button, .wp-block-button__link', 'section', 'nav a', 'img'].flatMap(pick);

        // conteggio colori usati
        const colors = {};
        for (const n of document.querySelectorAll('body *')) {
          const s = getComputedStyle(n);
          for (const c of [s.color, s.backgroundColor, s.borderTopColor]) {
            if (!c || c === 'rgba(0, 0, 0, 0)') continue;
            colors[c] = (colors[c] || 0) + 1;
          }
        }
        const fonts = {};
        for (const n of document.querySelectorAll('body *')) {
          const f = getComputedStyle(n).fontFamily;
          fonts[f] = (fonts[f] || 0) + 1;
        }
        return {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content ?? null,
          ogImage: document.querySelector('meta[property="og:image"]')?.content ?? null,
          text: clean.innerText,
          mainHtml: clean.innerHTML,
          imgs,
          bgs,
          links,
          headings,
          nav,
          footer,
          samples,
          colors,
          fonts,
        };
      });

      // Markdown: preferisci il corpo WP; se vuoto (template custom) usa il <main> renderizzato
      const mdSource = contentHtml.trim().length > 50 ? contentHtml : data.mainHtml;
      const md = `# ${decode(e.title.rendered)}\n\n${td.turndown(mdSource)}\n`;
      await write(path.join(dir, 'content.md'), md);
      await write(path.join(dir, 'text.md'), `<!-- Testo visibile in ${e.link} (render desktop) -->\n\n${data.text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()}\n`);
      await write(path.join(dir, 'meta.json'), {
        id: e.id,
        url: e.link,
        slug,
        title: decode(e.title.rendered),
        documentTitle: data.title,
        description: data.description,
        ogImage: data.ogImage,
        date: e.date,
        modified: e.modified,
        excerpt: cheerio.load(e.excerpt?.rendered ?? '').text().trim() || undefined,
        categories: e.categories?.map((id) => categories.find((c) => c.id === id)?.name),
        headings: data.headings,
        images: data.imgs,
        backgroundImages: data.bgs,
        links: data.links,
      });

      for (const i of [...data.imgs.map((x) => x.src), ...data.bgs]) {
        if (!i) continue;
        if (i.startsWith(BASE)) extraAssets.add(i.split('?')[0]);
        const key = Object.keys(mediaIndex).find((k) => originalOf(i.split('?')[0]) === originalOf(k));
        if (key && !mediaIndex[key].usedIn.includes(slug)) mediaIndex[key].usedIn.push(slug);
      }
      for (const l of data.links) {
        try {
          const u = new URL(l.href);
          if (!u.hostname.endsWith('ireandlunaslife.it') && u.protocol.startsWith('http')) externalLinks.set(l.href, l.text);
        } catch {}
      }
      styleSamples.push({ page: slug, samples: data.samples, colors: data.colors, fonts: data.fonts });
      if (!site) site = { nav: data.nav, footer: data.footer };
      await page.close();
    }
  }
  await browser.close();

  // ---------- 4. Asset extra (tema, immagini non in libreria, font) ----------
  const known = new Set(Object.keys(mediaIndex).map(originalOf));
  const extras = [];
  for (const u of extraAssets) {
    if (known.has(originalOf(u)) || known.has(u)) continue;
    const rel = new URL(u).pathname.replace(/^\/wp-content\//, '').replace(/^\//, '');
    const dest = out('media', 'extra', rel);
    if (await download(u, dest)) extras.push({ url: u, file: `extra/${rel}` });
  }
  await write(out('media', 'index.json'), { library: Object.values(mediaIndex), extra: extras });

  // ---------- 5. Stile: CSS del tema + token calcolati ----------
  const home = await (await fetch(BASE)).text();
  const $ = cheerio.load(home);
  const cssLinks = $('link[rel="stylesheet"]').map((_, l) => $(l).attr('href')).get();
  const cssFiles = [];
  for (const href of cssLinks) {
    const u = new URL(href, BASE);
    if (!u.href.includes('/wp-content/themes/') && !u.hostname.includes('fonts.googleapis.com')) continue;
    const r = await fetch(u.href);
    if (!r.ok) continue;
    const name = u.hostname.includes('fonts') ? 'google-fonts.css' : `theme-${path.basename(u.pathname)}`;
    await write(out('style', name), await r.text());
    cssFiles.push({ url: u.href, file: name });
  }
  const inline = $('style')
    .map((_, s) => $(s).html())
    .get()
    .join('\n\n/* ---- */\n\n');
  await write(out('style', 'inline-styles.css'), inline);

  const merge = (key) => {
    const acc = {};
    for (const s of styleSamples) for (const [k, v] of Object.entries(s[key])) acc[k] = (acc[k] || 0) + v;
    return Object.entries(acc)
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count }));
  };
  const allCss = (await Promise.all(cssFiles.map((f) => fs.readFile(out('style', f.file), 'utf8')))).join('\n') + inline;
  const cssVars = [...new Set(allCss.match(/--[a-z0-9-]+\s*:\s*[^;}]+/gi) ?? [])].filter((v) => !v.startsWith('--wp--preset--'));
  const hexes = Object.entries(
    (allCss.match(/#[0-9a-f]{3,8}\b/gi) ?? []).reduce((a, c) => ((a[c.toLowerCase()] = (a[c.toLowerCase()] || 0) + 1), a), {}),
  ).sort((a, b) => b[1] - a[1]);

  await write(out('style', 'tokens.json'), {
    note: 'Valori calcolati dal sito WordPress: servono a capire lo stile attuale, non vanno copiati 1:1.',
    cssFiles,
    themeCssVariables: cssVars,
    hexColorsInCss: hexes.map(([value, count]) => ({ value, count })),
    computedColors: merge('colors').slice(0, 40),
    computedFonts: merge('fonts'),
    samplesByPage: styleSamples.map(({ page, samples }) => ({ page, samples })),
  });

  // ---------- 6. Sito ----------
  await write(out('site.json'), {
    scrapedAt: new Date().toISOString(),
    source: BASE,
    name: decode(siteInfo.name),
    tagline: decode(siteInfo.description),
    siteIcon: siteInfo.site_icon_url,
    nav: site?.nav,
    footerText: site?.footer,
    categories,
    pages: entries.map((e) => ({ kind: e.kind, slug: slugOf(e.link), title: decode(e.title.rendered), url: e.link })),
    externalLinks: [...externalLinks].map(([href, text]) => ({ href, text })),
  });
  console.log(`Fatto. Output in ${ROOT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
