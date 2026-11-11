// Eclipse: nuova scheda, benvenuto, Libera RAM + Eclipse Scudo (blocco pubblicita') in un solo processo
self.window = self;
importScripts('colore.js', 'scudo/scudo.js');

// al primo avvio: la pagina di benvenuto (importazione da Chrome). Solo una volta: Eclipse carica le sue
// estensioni a ogni apertura e il browser le considera "appena installate" ogni volta, quindi si ricorda qui.
// le scelte consigliate si applicano una volta anche a chi aveva gia' visto il benvenuto (versioni precedenti)
chrome.runtime.onInstalled.addListener(async () => {
  const { scelteApplicate, scelte } = await chrome.storage.local.get(['scelteApplicate', 'scelte']);
  if (scelteApplicate) return;
  const cookie3 = !(scelte && scelte.cookie3 === false);
  try { await chrome.privacy.websites.thirdPartyCookiesAllowed.set({ value: !cookie3 }); } catch (e) {}
  await chrome.storage.local.set({ scelteApplicate: Date.now() });
});
// (11/11) Le schede dell'apertura, in un punto solo. Al primo avvio deve restare UNA scheda: il benvenuto di Eclipse.
// - la pagina "first run" di ungoogled-chromium e la nuova scheda del browser diventano il benvenuto (prima volta)
//   oppure la nuova scheda di Eclipse; le "first run" in piu' si chiudono (mai l'ultima scheda: si chiuderebbe Eclipse)
// - la nuova scheda di Eclipse non "sostituisce" quella del browser: cosi' Chromium non mostra la finestra
//   "Forse intendevi modificare la pagina?" (che con "Ripristina" spegneva l'estensione)
// Eclipse carica le sue estensioni a ogni apertura e il browser le considera "appena installate" ogni volta:
// per questo il benvenuto si ricorda in benvenutoVisto.
// (11/11 notte) con un motore di ricerca diverso da Google (es. Brave) Chromium apre chrome://new-tab-page-third-party:
// prima non era riconosciuta e restava la nuova scheda del browser, senza la barra di ricerca di Eclipse
const NTP_BROWSER = /^chrome:\/\/(newtab|new-tab-page|new-tab-page-third-party)\/?($|[?#])/;
const PRIMA_PAGINA = /^chrome:\/\/ungoogled-first-run/i;
const nostraNtp = () => chrome.runtime.getURL('nuovascheda.html');
const benvenutoUrl = () => chrome.runtime.getURL('benvenuto.html');
// il benvenuto si decide SUBITO (prima di toccare le schede): cosi' la prima scheda diventa direttamente il
// benvenuto, senza passare un secondo dalla nuova scheda
let daMostrare = false;
const statoBenvenuto = chrome.storage.local.get('benvenutoVisto').then(({ benvenutoVisto }) => { daMostrare = !benvenutoVisto; }).catch(() => {});
async function segnaBenvenuto() {
  daMostrare = false;
  await chrome.storage.local.set({ benvenutoVisto: Date.now() });
  // le scelte consigliate (si cambiano nel benvenuto): niente cookie che ti seguono tra i siti
  try { await chrome.privacy.websites.thirdPartyCookiesAllowed.set({ value: false }); } catch (e) {}
}
async function sistemaScheda(t) {
  const u = t.pendingUrl || t.url || '';
  const prima = PRIMA_PAGINA.test(u);
  if (!prima && !NTP_BROWSER.test(u)) return false;
  await statoBenvenuto;
  try {
    if (daMostrare) { await segnaBenvenuto(); await chrome.tabs.update(t.id, { url: benvenutoUrl() }); return true; }
    if (prima && (await chrome.tabs.query({ windowId: t.windowId })).length > 1) { await chrome.tabs.remove(t.id); return true; }
    await chrome.tabs.update(t.id, { url: nostraNtp() });
  } catch (e) {}
  return true;
}
async function sistemaTutte() {
  let trovate = false;
  for (const t of await chrome.tabs.query({})) trovate = (await sistemaScheda(t)) || trovate;
  return trovate;
}
chrome.tabs.onCreated.addListener((t) => { sistemaScheda(t); });
chrome.tabs.onUpdated.addListener((id, info, t) => { if (info.url) sistemaScheda(t); });
chrome.runtime.onStartup.addListener(sistemaTutte);
chrome.runtime.onInstalled.addListener(sistemaTutte);
(async () => {
  await statoBenvenuto;
  await sistemaTutte();
  // nessuna scheda da trasformare (es. il browser ha riaperto le schede della volta prima): il benvenuto in una sua scheda
  setTimeout(async () => {
    if (!daMostrare) return;
    await segnaBenvenuto();
    chrome.tabs.create({ url: benvenutoUrl() });
  }, 2500);
})();

// richieste dalle pagine: aprire le pagine interne del browser (le pagine non possono farlo da sole)
chrome.runtime.onMessage.addListener((m, _s, rispondi) => {
  if (m && m.apri && /^chrome:\/\/(settings|extensions|password-manager)/.test(m.apri)) { chrome.tabs.create({ url: m.apri }); return false; }
  if (m && m.conta) { chrome.tabs.query({ discarded: true }, (t) => rispondi({ inPausa: t.length })); return true; }
  return false;
});
