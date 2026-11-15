# Eclipse by LollozzOS

Browser leggero e senza pubblicità, basato su **Ungoogled Chromium**, per i PC ottimizzati LollozzOS.

- **Niente pubblicità**: AdGuard AdBlocker su tutti i siti (YouTube compreso) e NoBreak su Twitch, già dentro e già attivi; via anche le finestre dei cookie
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
- **AdGuard AdBlocker** — Adguard Software Ltd, licenza GPL-3.0 ([sorgente](https://github.com/AdguardTeam/AdguardBrowserExtension)). Nel pacchetto
  c'è la versione ufficiale per Chrome (MV3), scaricata dalle loro pubblicazioni e non modificata.
- **NoBreak – Ad-free Twitch** — Tsvetan Eftenov, licenza MIT ([sorgente](https://github.com/eftenow/twitch-ads-blocker-one-click)); motore **VAFT** di
  pixeltris/TwitchAdSolutions, licenza MIT. Copia in `estensioni/nobreak` con le licenze.
- Finestre dei cookie: lista **AdGuard Cookie Notices** (GPLv3, AdGuard), convertita dal nostro motore (`scudo/converti.js`).
- Al momento dell'installazione vengono scaricati dai siti ufficiali, non ridistribuiti qui: **chromium-web-store**
  (NeverDecaf) per installare dallo store di Chrome e il modulo **Widevine** di Google per i video protetti.
- Nome, icona Eclipse, estensione Eclipse (nuova scheda, benvenuto, Libera RAM, cookie) e script: **LollozzOS**.
