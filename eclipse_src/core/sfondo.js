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
chrome.runtime.onInstalled.addListener(async () => {
  const { benvenutoVisto } = await chrome.storage.local.get('benvenutoVisto');
  if (benvenutoVisto) return;
  await chrome.storage.local.set({ benvenutoVisto: Date.now() });
  // le scelte consigliate (si cambiano nel benvenuto, passo "Le tue scelte"): niente cookie che ti seguono tra i siti
  try { await chrome.privacy.websites.thirdPartyCookiesAllowed.set({ value: false }); } catch (e) {}
  chrome.tabs.create({ url: chrome.runtime.getURL('benvenuto.html') });
});
// All'apertura di Eclipse la prima scheda puo' partire PRIMA che l'estensione sia pronta: in quel caso esce la
// nuova scheda normale del browser invece di quella di Eclipse. Qui si sostituiscono quelle schede con la nostra.
const NTP_BROWSER = /^chrome:\/\/(newtab|new-tab-page)\/?($|[?#])/;
// (11/11) la pagina "first run" di ungoogled-chromium si apre al primo avvio: la chiudiamo (c'e' il benvenuto di Eclipse)
const PRIMA_PAGINA = /^chrome:\/\/ungoogled-first-run/i;
// se e' l'unica scheda della finestra non si chiude (si chiuderebbe Eclipse): diventa la nuova scheda di Eclipse
async function togliPrimaPagina(t) {
  try {
    const nella = await chrome.tabs.query({ windowId: t.windowId });
    if (nella.length > 1) await chrome.tabs.remove(t.id);
    else await chrome.tabs.update(t.id, { url: chrome.runtime.getURL('nuovascheda.html') });
  } catch (e) {}
}
async function sistemaNuoveSchede() {
  const nostra = chrome.runtime.getURL('nuovascheda.html');
  for (const t of await chrome.tabs.query({})) {
    const u = t.pendingUrl || t.url || '';
    if (PRIMA_PAGINA.test(u)) { await togliPrimaPagina(t); continue; }
    if (NTP_BROWSER.test(u)) { try { await chrome.tabs.update(t.id, { url: nostra }); } catch (e) {} }
  }
}
// se si apre poco dopo (l'estensione parte prima delle schede)
const avvio = Date.now();
chrome.tabs.onUpdated.addListener((id, info, t) => {
  if (Date.now() - avvio > 60000) return;
  const u = info.url || t.pendingUrl || t.url || '';
  if (PRIMA_PAGINA.test(u)) togliPrimaPagina(t);
});
chrome.runtime.onStartup.addListener(sistemaNuoveSchede);
chrome.runtime.onInstalled.addListener(sistemaNuoveSchede);
sistemaNuoveSchede();

// richieste dalle pagine: aprire le pagine interne del browser (le pagine non possono farlo da sole)
chrome.runtime.onMessage.addListener((m, _s, rispondi) => {
  if (m && m.apri && /^chrome:\/\/(settings|extensions)/.test(m.apri)) { chrome.tabs.create({ url: m.apri }); return false; }
  if (m && m.conta) { chrome.tabs.query({ discarded: true }, (t) => rispondi({ inPausa: t.length })); return true; }
  return false;
});
