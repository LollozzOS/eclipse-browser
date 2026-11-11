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
const NTP_BROWSER = /^chrome:\/\/(newtab|new-tab-page)\/?($|[?#])/;
const PRIMA_PAGINA = /^chrome:\/\/ungoogled-first-run/i;
const nostraNtp = () => chrome.runtime.getURL('nuovascheda.html');
const benvenutoUrl = () => chrome.runtime.getURL('benvenuto.html');
let daMostrare = false;
async function sistemaScheda(t) {
  const u = t.pendingUrl || t.url || '';
  const prima = PRIMA_PAGINA.test(u);
  if (!prima && !NTP_BROWSER.test(u)) return;
  try {
    if (daMostrare) { daMostrare = false; await chrome.tabs.update(t.id, { url: benvenutoUrl() }); return; }
    if (prima && (await chrome.tabs.query({ windowId: t.windowId })).length > 1) { await chrome.tabs.remove(t.id); return; }
    await chrome.tabs.update(t.id, { url: nostraNtp() });
  } catch (e) {}
}
async function sistemaTutte() { for (const t of await chrome.tabs.query({})) await sistemaScheda(t); }
chrome.tabs.onCreated.addListener((t) => { sistemaScheda(t); });
chrome.tabs.onUpdated.addListener((id, info, t) => { if (info.url) sistemaScheda(t); });
chrome.runtime.onStartup.addListener(sistemaTutte);
sistemaTutte();
chrome.runtime.onInstalled.addListener(async () => {
  const { benvenutoVisto } = await chrome.storage.local.get('benvenutoVisto');
  if (benvenutoVisto) { sistemaTutte(); return; }
  await chrome.storage.local.set({ benvenutoVisto: Date.now() });
  // le scelte consigliate (si cambiano nel benvenuto): niente cookie che ti seguono tra i siti
  try { await chrome.privacy.websites.thirdPartyCookiesAllowed.set({ value: false }); } catch (e) {}
  daMostrare = true;
  await sistemaTutte();
  // se le schede dell'apertura erano gia' sistemate (o non c'erano): il benvenuto prende il posto della nuova
  // scheda di Eclipse, oppure si apre in una scheda sua
  setTimeout(async () => {
    if (!daMostrare) return;
    daMostrare = false;
    const tutte = await chrome.tabs.query({});
    const ntp = tutte.find((t) => (t.pendingUrl || t.url || '') === nostraNtp());
    if (ntp) chrome.tabs.update(ntp.id, { url: benvenutoUrl() }).catch(() => {});
    else if (!tutte.some((t) => (t.pendingUrl || t.url || '') === benvenutoUrl())) chrome.tabs.create({ url: benvenutoUrl() });
  }, 1500);
});

// richieste dalle pagine: aprire le pagine interne del browser (le pagine non possono farlo da sole)
chrome.runtime.onMessage.addListener((m, _s, rispondi) => {
  if (m && m.apri && /^chrome:\/\/(settings|extensions)/.test(m.apri)) { chrome.tabs.create({ url: m.apri }); return false; }
  if (m && m.conta) { chrome.tabs.query({ discarded: true }, (t) => rispondi({ inPausa: t.length })); return true; }
  return false;
});
