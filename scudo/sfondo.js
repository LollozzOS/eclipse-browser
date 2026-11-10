// Eclipse Scudo - il cervello (gira in sottofondo, si sveglia solo quando serve)
self.window = self;
importScripts('colore.js', 'converti.js');

const GH = 'https://raw.githubusercontent.com/';
const LISTE = {
  pubblicita: [GH + 'easylist/easylist/gh-pages/easylist.txt', GH + 'uBlockOrigin/uAssets/master/filters/filters.txt'],
  traccianti: [GH + 'easylist/easylist/gh-pages/easyprivacy.txt', GH + 'uBlockOrigin/uAssets/master/filters/privacy.txt'],
  cookie: [GH + 'AdguardTeam/FiltersRegistry/master/platforms/extension/chromium/filters/18.txt'],
};
const BASE = { pubblicita: 0, traccianti: 100000, eccezioni: 200000, cookie: 300000 }; // numeri delle regole aggiornate
const BASE_SITI = 900000;           // regole "spento su questo sito"
const OGNI_GIORNI = 4;              // le liste cambiano ogni 4 giorni
const RULESET = ['pubblicita', 'traccianti', 'eccezioni'];
const ID_ECLIPSE = 'doeokiglaacbfegkolekpjimdbacepgi'; // l'estensione Eclipse (benvenuto: "Le tue scelte")

const KEY = (h) => h.replace(/^www\./, '');
const genitori = (h) => { const p = h.split('.'); const r = []; for (let i = 0; i < p.length - 1; i++) r.push(p.slice(i).join('.')); return r; };
const leggi = async (k, def) => { const o = await chrome.storage.local.get(k); return o[k] === undefined ? def : o[k]; };

// ---------- avvio ----------
async function prepara() {
  try { await chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true }); } catch (e) {}
  try { await chrome.action.setBadgeBackgroundColor({ color: self.ECLIPSE_COLORE || '#6A00FF' }); } catch (e) {}
  await controllaPacchetto();
  await applicaBanner(await leggi('banner', true));
  await registraScript();
  chrome.alarms.create('liste', { periodInMinutes: 360, delayInMinutes: 3 });
}
chrome.runtime.onInstalled.addListener(prepara);
chrome.runtime.onStartup.addListener(prepara);
chrome.alarms.onAlarm.addListener((a) => { if (a.name === 'liste') aggiorna(false); });

// se Eclipse e' stato aggiornato con liste piu' nuove di quelle scaricate, si torna a quelle del pacchetto
async function controllaPacchetto() {
  const pac = await (await fetch('liste.json')).json();
  const liste = await leggi('liste', null);
  if (liste && liste.quando >= pac.quando) return;
  await usaPacchetto(pac);
}
async function usaPacchetto(pac) {
  const vecchie = (await chrome.declarativeNetRequest.getDynamicRules()).filter((r) => r.id < BASE_SITI).map((r) => r.id);
  if (vecchie.length) await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: vecchie });
  await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: RULESET });
  await chrome.storage.local.remove(['cosmetica', 'cosmeticaCookie', 'regoleCookie']);
  await chrome.storage.local.set({ liste: pac });
  COS = null;
}

// ---------- finestre "Accetta i cookie" (lista AdGuard Cookie Notices) ----------
async function applicaBanner(acceso) {
  await chrome.storage.local.set({ banner: !!acceso });
  const liste = await leggi('liste', {});
  const via = (await chrome.declarativeNetRequest.getDynamicRules()).filter((r) => r.id >= BASE.cookie && r.id < BASE.cookie + 100000).map((r) => r.id);
  if (liste.dinamico) {
    const regole = acceso ? await leggi('regoleCookie', []) : [];
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: via, addRules: regole });
    await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: ['cookie'] });
  } else {
    if (via.length) await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: via });
    await chrome.declarativeNetRequest.updateEnabledRulesets(acceso ? { enableRulesetIds: ['cookie'] } : { disableRulesetIds: ['cookie'] });
  }
}

// ---------- aggiornamento delle liste ----------
let inCorso = null;
function aggiorna(forza) {
  if (!inCorso) inCorso = faiAggiorna(forza).finally(() => { inCorso = null; });
  return inCorso;
}
async function scarica(n) {
  let t = '';
  for (const u of LISTE[n]) {
    const r = await fetch(u, { cache: 'no-store' });
    if (!r.ok) throw new Error(n + ' ' + r.status);
    const x = await r.text();
    if (x.length < 20000 || !/^\s*[[!]/.test(x)) throw new Error(n + ' non valida');
    t += '\n' + x;
  }
  return t;
}
async function faiAggiorna(forza) {
  const liste = await leggi('liste', null);
  if (!forza && liste && Date.now() - liste.quando < OGNI_GIORNI * 864e5) return { ok: true, liste: liste.data };
  try {
    const testi = { pubblicita: await scarica('pubblicita'), traccianti: await scarica('traccianti') };
    testi.pubblicita += '\n' + await (await fetch('nostre.txt')).text();
    const o = self.ScudoConverti(testi);
    const c = self.ScudoConverti({ cookie: await scarica('cookie') });
    const nuove = [];
    for (const n of ['pubblicita', 'traccianti']) for (const r of o.rete[n]) nuove.push({ ...r, id: BASE[n] + r.id });
    for (const r of o.eccezioni) nuove.push({ ...r, id: BASE.eccezioni + r.id });
    const cookie = [...c.rete.cookie, ...c.eccezioni].map((r, i) => ({ ...r, id: BASE.cookie + i + 1 }));
    if (nuove.length + cookie.length > chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_RULES - 1000) throw new Error('troppe regole');
    const vecchie = (await chrome.declarativeNetRequest.getDynamicRules()).filter((r) => r.id < BASE_SITI).map((r) => r.id);
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: vecchie, addRules: nuove });
    await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: [...RULESET, 'cookie'] });
    const quando = Date.now();
    const info = { quando, data: new Date(quando).toLocaleDateString('it-IT'), regole: nuove.length + cookie.length, dinamico: true };
    await chrome.storage.local.set({ cosmetica: o.cosmetica, cosmeticaCookie: c.cosmetica, regoleCookie: cookie, liste: info });
    await applicaBanner(await leggi('banner', true));
    COS = null;
    return { ok: true, liste: info.data };
  } catch (e) {
    return { ok: false, errore: String(e && e.message || e), liste: liste && liste.data };
  }
}

// ---------- spento su un sito ----------
async function spenti() { return (await chrome.storage.local.get('spenti')).spenti || []; }
function eSpento(lista, host) { return genitori(KEY(host)).some((h) => lista.includes(h)) || lista.includes(KEY(host)); }

async function regoleSiti(lista) {
  const via = (await chrome.declarativeNetRequest.getDynamicRules()).filter((r) => r.id >= BASE_SITI).map((r) => r.id);
  const add = lista.map((h, i) => ({ id: BASE_SITI + i, priority: 100, action: { type: 'allowAllRequests' },
    condition: { requestDomains: [h], resourceTypes: ['main_frame', 'sub_frame'] } }));
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: via, addRules: add });
}

async function registraScript() {
  const lista = await spenti();
  const escludi = lista.flatMap((h) => ['*://' + h + '/*', '*://*.' + h + '/*']);
  const S = [
    { id: 'scudo-pagine', js: ['cosmetica.js'], matches: ['http://*/*', 'https://*/*'], allFrames: true, runAt: 'document_start', world: 'ISOLATED' },
    { id: 'scudo-youtube', js: ['youtube.js'], matches: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*'], allFrames: true, runAt: 'document_start', world: 'MAIN' },
    { id: 'scudo-twitch', js: ['twitch.js'], matches: ['*://*.twitch.tv/*'], allFrames: true, runAt: 'document_start', world: 'MAIN' },
  ];
  for (const s of S) if (escludi.length) s.excludeMatches = escludi;
  try { await chrome.scripting.unregisterContentScripts(); } catch (e) {}
  await chrome.scripting.registerContentScripts(S);
}

// ---------- la parte che nasconde i riquadri pubblicitari ----------
let COS = null;
function prepCos(c) { c.ng = new Set(c.nienteGenerici); c.eg = new Set(c.eccezioniGeneriche); return c; }
async function cosmetica() {
  if (COS) return COS;
  const d = await chrome.storage.local.get(['cosmetica', 'cosmeticaCookie']);
  const main = d.cosmetica || await (await fetch('cosmetica.json')).json();
  const cook = d.cosmeticaCookie || await (await fetch('cosmetica_cookie.json')).json();
  COS = { main: prepCos(main), cookie: prepCos(cook) };
  return COS;
}
function eccezioniPer(c, host) {
  const e = new Set(c.eg);
  for (const h of [KEY(host), ...genitori(host)]) for (const s of c.eccezioniSito[h] || []) e.add(s);
  return e;
}
function selettori(c, m, host) {
  const ecc = eccezioniPer(c, host);
  const niente = [host, ...genitori(host)].some((h) => c.ng.has(h));
  const sel = [];
  if (m.cosa === 'cosmeticaSito') {
    for (const h of new Set([host, KEY(host), ...genitori(host)])) sel.push(...(c.perSito[h] || []));
    if (!niente) sel.push(...c.complessi);
  } else if (!niente) {
    for (const k of m.chiavi || []) sel.push(...(c.generici[k] || []));
  }
  return sel.filter((s) => !ecc.has(s));
}
function css(selettori) { return selettori.map((s) => s + '{display:none!important}').join('\n'); }
async function inserisci(sender, sel) {
  if (!sel.length || !sender.tab) return;
  try {
    await chrome.scripting.insertCSS({ target: { tabId: sender.tab.id, frameIds: [sender.frameId] }, css: css(sel), origin: 'USER' });
  } catch (e) {}
}

async function suMessaggio(m, sender) {
  if (m.cosa === 'cosmeticaSito' || m.cosa === 'generici') {
    const host = m.host || '';
    if (eSpento(await spenti(), host)) return { spento: true };
    const C = await cosmetica();
    let sel = selettori(C.main, m, host);
    if (await leggi('banner', true)) sel = sel.concat(selettori(C.cookie, m, host));
    sel = [...new Set(sel)];
    await inserisci(sender, sel);
    return { ok: true, n: sel.length };
  }
  if (m.cosa === 'stato') {
    const lista = await spenti();
    const { liste } = await chrome.storage.local.get('liste');
    let pub = 0, tra = 0;
    try {
      const { rulesMatchedInfo } = await chrome.declarativeNetRequest.getMatchedRules({ tabId: m.tabId });
      for (const x of rulesMatchedInfo) {
        const rs = x.rule.rulesetId, id = x.rule.ruleId;
        if (rs === 'pubblicita' || rs === 'cookie' || (rs === '_dynamic' && (id < BASE.traccianti || (id >= BASE.cookie && id < BASE_SITI)))) pub++;
        else if (rs === 'traccianti' || (rs === '_dynamic' && id < BASE.eccezioni)) tra++;
      }
    } catch (e) {
      try { pub = parseInt(await chrome.action.getBadgeText({ tabId: m.tabId }), 10) || 0; } catch (e2) {}
    }
    return { spento: m.host ? eSpento(lista, m.host) : false, pub, tra, liste: liste && liste.data, banner: await leggi('banner', true) };
  }
  if (m.cosa === 'interruttore') {
    let lista = await spenti();
    const h = KEY(m.host);
    lista = lista.filter((x) => x !== h && !genitori(h).includes(x));
    if (m.spento) lista.push(h);
    await chrome.storage.local.set({ spenti: lista });
    await regoleSiti(lista);
    await registraScript();
    return { ok: true };
  }
  if (m.cosa === 'aggiorna') return aggiorna(!!m.forza);
  if (m.cosa === 'banner') { await applicaBanner(!!m.acceso); return { ok: true }; }
  return null;
}
chrome.runtime.onMessage.addListener((m, sender, rispondi) => {
  suMessaggio(m || {}, sender).then(rispondi, (e) => rispondi({ ok: false, errore: String(e) }));
  return true;
});

// dal benvenuto di Eclipse (passo "Le tue scelte"): solo l'interruttore dei cookie, solo dall'estensione Eclipse
chrome.runtime.onMessageExternal.addListener((m, sender, rispondi) => {
  if (sender.id !== ID_ECLIPSE || !m || m.cosa !== 'banner') return false;
  applicaBanner(!!m.acceso).then(() => rispondi({ ok: true }), () => rispondi({ ok: false }));
  return true;
});
