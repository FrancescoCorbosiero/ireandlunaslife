# Ire & Luna's Life

Nuovo sito statico di **Irene Bellapianta** (educatrice cinofila & esperta in nutrizione),
che sostituirà il WordPress su [ireandlunaslife.it](https://ireandlunaslife.it).

- `legacy/`: archivio del vecchio sito (copy, media, screenshot, analisi dello stile). Parti da
  [`legacy/README.md`](legacy/README.md).
- `tools/legacy-scrape/`: lo script che ha creato l'archivio. Per rifarlo:

```bash
cd tools/legacy-scrape && npm install && NODE_USE_ENV_PROXY=1 npm run scrape
```

`NODE_USE_ENV_PROXY=1` serve solo negli ambienti cloud di Claude Code, dove la rete passa da un proxy.
