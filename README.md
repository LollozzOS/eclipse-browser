# Eclipse by LollozzOS

Browser leggero e senza pubblicità, basato su **Ungoogled Chromium**, per i PC ottimizzati LollozzOS.

- **Eclipse Scudo**: blocco di pubblicità e traccianti (anche YouTube e Twitch) e delle finestre dei cookie
- schede in pausa da sole, Libera RAM, nuova scheda personalizzabile, scorciatoie di ricerca "!"
- niente servizi Google nascosti, funzioni AI e pubblicitarie di Chrome spente

## Scaricare
L'ultima versione è nelle **[Releases](../../releases/latest)**: scarica lo zip, estrai e lancia `INSTALLA-ECLIPSE.bat`.
Una volta installato, Eclipse si aggiorna da solo (un controllo al giorno, quando Eclipse è chiuso).

## Come nasce ogni versione
Ogni giorno una procedura automatica (`.github/workflows/eclipse.yml`) controlla se è uscito un Ungoogled Chromium
nuovo; se sì applica il rebrand Eclipse (`costruisci/`), prepara il pacchetto e lo pubblica qui.

## Crediti e licenze
- **Chromium** — © The Chromium Authors, licenza BSD. I crediti completi sono dentro il browser: `chrome://credits`.
- **Ungoogled Chromium** — ungoogled-software, licenza BSD-3-Clause.
- Liste di blocco usate da Scudo: **EasyList / EasyPrivacy** (CC BY-SA 3.0, easylist.to), **uBlock Origin filters**
  (GPLv3, uBlockOrigin/uAssets), **AdGuard Cookie Notices** (GPLv3, AdGuard). Convertite dal motore di Scudo (`scudo/converti.js`).
- Al momento dell'installazione vengono scaricati dai siti ufficiali, non ridistribuiti qui: **chromium-web-store**
  (NeverDecaf) per installare dallo store di Chrome e il modulo **Widevine** di Google per i video protetti.
- Nome, icona Eclipse, estensioni, Scudo e script: **LollozzOS**.
