/*
  Eclipse - lingua inglese.
  Browser in italiano -> le pagine di Eclipse restano in italiano (questo file non fa niente).
  Qualsiasi altra lingua -> i testi passano in inglese.
  Per aggiungere o correggere una frase: e' una riga [italiano, inglese] nell'elenco qui sotto.
*/
;(() => {
  let it = true
  try { const f = new URLSearchParams(location.search).get('lingua'); const l = (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage) ? chrome.i18n.getUILanguage() : (navigator.language || 'it'); it = f ? f === 'it' : /^it/i.test(l) } catch {}
  if (it) return
  const D = [
    ["Accendi o spegni", "Turn on or off"],
    ["Pubblicità", "Ads"],
    ["Apri", "Open"],
    ["Via le finestre \"Accetta i cookie\"", "No more \"Accept cookies\" pop-ups"],
    ["su tutti i siti", "on all sites"],
    ["Libera RAM", "Free RAM"],
    ["Mette in pausa le schede che non stai guardando: la loro RAM si libera, si ricaricano quando ci torni.", "Pauses the tabs you are not looking at: their RAM is freed, they reload when you go back to them."],
    ["Metti in pausa le altre schede", "Pause the other tabs"],
    ["Lista dei cookie: —", "Cookie list: —"],
    ["Aggiorna ora", "Update now"],
    ["Blocco pubblicità: AdGuard AdBlocker (AdGuard, GPLv3) e NoBreak per Twitch (T. Eftenov, MIT; motore VAFT di pixeltris, MIT). Finestre dei cookie: lista AdGuard Cookie Notices (GPLv3), motore LollozzOS.", "Ad blocking: AdGuard AdBlocker (AdGuard, GPLv3) and NoBreak for Twitch (T. Eftenov, MIT; VAFT engine by pixeltris, MIT). Cookie pop-ups: AdGuard Cookie Notices list (GPLv3), LollozzOS engine."],
    ["Benvenuto in Eclipse", "Welcome to Eclipse"],
    ["Il browser di LollozzOS, creato da Lollozz: massimo risparmio di memoria e di risorse in background, con blocco integrato di pubblicità, tracciamento e contenuti superflui.", "The LollozzOS browser, created by Lollozz: maximum savings on memory and background resources, with built-in blocking of ads, tracking and unnecessary content."],
    ["Ottimizzazioni attive", "Active optimizations"],
    ["Blocco di pubblicità e tracciamento", "Ad and tracking blocking"],
    ["AdGuard filtra annunci e tracker su tutti i siti, YouTube incluso; NoBreak toglie le pause pubblicitarie su Twitch. Già attivi, senza niente da impostare.", "AdGuard filters ads and trackers on all sites, YouTube included; NoBreak removes ad breaks on Twitch. Already active, nothing to set up."],
    ["Gestione intelligente della memoria", "Smart memory management"],
    ["Le schede inattive vengono sospese automaticamente per liberare RAM.", "Inactive tabs are suspended automatically to free RAM."],
    ["Nessuna attività superflua in background", "No unnecessary background activity"],
    ["Servizi non essenziali, funzioni di intelligenza artificiale e processi inutilizzati sono disattivati.", "Non-essential services, artificial intelligence features and unused processes are turned off."],
    ["Ricerca Google", "Google Search"],
    ["Motore di ricerca predefinito per la barra degli indirizzi e la nuova scheda.", "Default search engine for the address bar and the new tab."],
    ["Cambia", "Change"],
    ["I tuoi dati e le tue preferenze", "Your data and preferences"],
    ["Preferiti, password e cronologia", "Bookmarks, passwords and history"],
    ["Trasferiscili da Chrome, Edge o Firefox: ti guidiamo passo per passo.", "Bring them over from Chrome, Edge or Firefox: we guide you step by step."],
    ["Importa", "Import"],
    ["Protezione dai cookie di terze parti", "Third-party cookie protection"],
    ["Impedisce ai siti di seguirti da una pagina all'altra. Alcuni accessi tramite servizi esterni potrebbero non funzionare.", "Stops sites from following you from one page to another. Some sign-ins through external services may not work."],
    ["Rimozione dei banner dei cookie", "Cookie banner removal"],
    ["Nasconde automaticamente le richieste di consenso. Se un sito non risponde, spegni questa scelta dalla finestrella di Eclipse.", "Hides consent requests automatically. If a site does not respond, turn this off from the Eclipse pop-up."],
    ["Scorciatoie di ricerca", "Search shortcuts"],
    ["Digita !yt, !a o !w nella nuova scheda per cercare direttamente su YouTube, Amazon o Wikipedia.", "Type !yt, !a or !w in the new tab to search directly on YouTube, Amazon or Wikipedia."],
    ["Inizia a navigare", "Start browsing"],
    ["Eclipse by LollozzOS, creato da Lollozz. Basato sui progetti open source Chromium e Ungoogled Chromium: crediti e licenze in Impostazioni › Informazioni.", "Eclipse by LollozzOS, created by Lollozz. Based on the open source projects Chromium and Ungoogled Chromium: credits and licences in Settings › About."],
    ["Importa i tuoi dati", "Import your data"],
    ["Due strade: una per preferiti e cronologia, una per le password.", "Two ways: one for bookmarks and history, one for passwords."],
    ["Preferiti e cronologia", "Bookmarks and history"],
    ["Da Chrome, Edge o Firefox con un clic: scegli il browser e conferma.", "From Chrome, Edge or Firefox in one click: choose the browser and confirm."],
    ["Apri l'importazione di Eclipse e scegli il browser di prima.", "Open the Eclipse import and choose your previous browser."],
    ["Chrome protegge le password in modo che solo lui possa leggerle: si passano con un file, in due minuti.", "Chrome protects passwords so that only it can read them: you move them with a file, in two minutes."],
    ["In Chrome apri", "In Chrome open"],
    ["e premi", "and press"],
    ["Esporta password", "Export passwords"],
    ["Copia indirizzo", "Copy address"],
    ["Qui in Eclipse premi", "Here in Eclipse press"],
    ["Importa password", "Import passwords"],
    ["e scegli il file salvato.", "and choose the saved file."],
    ["Al termine cancella il file: contiene le password in chiaro.", "When finished delete the file: it contains the passwords in plain text."],
    ["Fatto", "Done"],
    ["Cerca sul web o scrivi un indirizzo", "Search the web or type an address"],
    ["Nuova scheda", "New tab"],
    ["✎ Personalizza", "✎ Customize"],
    ["Personalizza Eclipse", "Customize Eclipse"],
    ["Sfondo", "Background"],
    ["Nella pagina", "On the page"],
    ["Orologio", "Clock"],
    ["ora e data sopra il logo", "time and date above the logo"],
    ["Logo Eclipse", "Eclipse logo"],
    ["toglilo se lo sfondo ha già una scritta", "remove it if the background already has a wordmark"],
    ["Scorciatoie \"!\"", "\"!\" shortcuts"],
    ["\"!yt gatti\" cerca su YouTube, \"!a\" Amazon, \"!w\" Wikipedia…", "\"!yt cats\" searches YouTube, \"!a\" Amazon, \"!w\" Wikipedia…"],
    ["Non trovato in questo Eclipse", "Not found in this Eclipse"],
    ["Spento (riaccendilo da Estensioni)", "Off (turn it back on from Extensions)"],
    ["Attivo su tutti i siti, YouTube compreso", "Active on all sites, YouTube included"],
    ["Attivo: niente pause pubblicitarie", "Active: no ad breaks"],
    ["Lista dei cookie del", "Cookie list of"],
    ["Aggiorno…", "Updating…"],
    ["Non riuscito", "Failed"],
    ["scheda messa", "tab"],
    ["schede messe", "tabs"],
    ["in pausa: la loro RAM è libera", "paused: their RAM is free"],
    ["Nessuna scheda da mettere in pausa", "No tabs to pause"],
    ["Copiato ✓", "Copied ✓"],
    ["Indirizzo del sito (es. www.reddit.com)", "Site address (e.g. www.reddit.com)"],
    ["Tinta unita", "Solid colour"],
    ["La tua foto", "Your photo"],
    ["!yt gatti", "!yt cats"],
    ["cerca su", "search on"],
    ["scheda in pausa", "tab paused"],
    ["schede in pausa", "tabs paused"],
    [": la loro RAM è libera", ": their RAM is free"],
    ["Schede in pausa automatiche attive", "Automatic tab pausing active"],
    ["Google Immagini", "Google Images"],
    ["Google Traduttore", "Google Translate"],
    ["in pausa", "paused"]
  ]
  const L = 'A-Za-z\u00C0-\u00FA'
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  D.sort((a, b) => b[0].length - a[0].length)
  const M = new Map(D)
  const re = new RegExp(D.map(([a]) => (new RegExp('^[' + L + ']').test(a) ? '(?<![' + L + '])' : '') + esc(a) + (new RegExp('[' + L + ']$').test(a) ? '(?![' + L + '])' : '')).join('|'), 'g')
  const tr = (s) => (s && /[A-Za-z]/.test(s) ? s.replace(re, (m) => M.get(m) || m) : s)
  const nodo = (n) => {
    if (n.nodeType === 3) { const p = n.parentNode && n.parentNode.nodeName; if (p === 'SCRIPT' || p === 'STYLE' || p === 'TEXTAREA') return; const v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; return }
    if (n.nodeType !== 1) return
    for (const a of ['title', 'placeholder', 'alt']) { const x = n.getAttribute && n.getAttribute(a); if (x) { const v = tr(x); if (v !== x) n.setAttribute(a, v) } }
    for (const c of n.childNodes) nodo(c)
  }
  const avvia = () => {
    document.documentElement.lang = 'en'
    try { document.title = tr(document.title) } catch {}
    nodo(document.body)
    new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'childList') m.addedNodes.forEach(nodo); else nodo(m.target) } })
      .observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'alt'] })
  }
  if (document.body) avvia(); else document.addEventListener('DOMContentLoaded', avvia)
})()
