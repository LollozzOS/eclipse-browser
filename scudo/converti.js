// Eclipse Scudo - il motore che legge le liste (formato EasyList) e le trasforma in regole del browser.
// Codice LollozzOS. Gira sia alla preparazione del pacchetto (node) sia dentro l'estensione per l'aggiornamento.
(function (G) {
  'use strict';

  const TIPI = {
    script: 'script', image: 'image', stylesheet: 'stylesheet', css: 'stylesheet', object: 'object',
    xmlhttprequest: 'xmlhttprequest', xhr: 'xmlhttprequest', subdocument: 'sub_frame', frame: 'sub_frame',
    ping: 'ping', beacon: 'ping', media: 'media', font: 'font', websocket: 'websocket', other: 'other',
    'object-subrequest': 'object', webrtc: null,
  };
  // opzioni che non sappiamo fare con le regole del browser: la riga si salta (meglio niente che sbagliare)
  const SALTA = new Set(['popup', 'rewrite', 'csp', 'redirect', 'redirect-rule', 'removeparam', 'header', 'sitekey',
    'replace', 'permissions', 'urltransform', 'popunder', 'empty', 'mp4', 'genericblock', 'cname', 'ehide', 'shide']);
  const ASCII = /^[\x20-\x7e]*$/;
  const DOMINIO = /^[a-z0-9*][a-z0-9.*-]*$/;
  const MAX_GRUPPO = 2000;

  function dominiOpz(v, sep) {
    const si = [], no = [];
    for (let d of v.split(sep)) {
      d = d.trim().toLowerCase();
      if (!d) continue;
      const neg = d[0] === '~';
      if (neg) d = d.slice(1);
      if (!DOMINIO.test(d) || d.includes('*')) return null; // domini con * o non latini: salto la riga
      (neg ? no : si).push(d);
    }
    return { si, no };
  }

  // una riga di rete -> { regola, gruppo } oppure null
  function rete(riga, st) {
    let eccezione = false;
    if (riga.startsWith('@@')) { eccezione = true; riga = riga.slice(2); }
    let patt = riga, opz = '';
    const d = riga.lastIndexOf('$');
    if (d > 0 && !(riga.startsWith('/') && riga.endsWith('/'))) {
      const dopo = riga.slice(d + 1);
      if (/^~?[a-z0-9-]+(=|,|$)/i.test(dopo)) { patt = riga.slice(0, d); opz = dopo; }
    } else if (d === 0) { patt = ''; opz = riga.slice(1); }
    if (patt.length > 2 && patt.startsWith('/') && patt.endsWith('/')) { st.regex++; return null; }
    const c = {};
    const tipi = new Set(), noTipi = new Set();
    let importante = false, documento = false, nascondi = false, minuscolo = true;
    if (opz) {
      for (let o of opz.split(',')) {
        o = o.trim();
        const neg = o[0] === '~';
        const nome = (neg ? o.slice(1) : o).split('=')[0].toLowerCase();
        const val = o.includes('=') ? o.slice(o.indexOf('=') + 1) : '';
        if (SALTA.has(nome)) { st.saltate++; return null; }
        if (nome in TIPI) {
          if (!TIPI[nome]) { st.saltate++; return null; }
          (neg ? noTipi : tipi).add(TIPI[nome]);
        } else if (nome === 'third-party' || nome === '3p') c.domainType = neg ? 'firstParty' : 'thirdParty';
        else if (nome === 'first-party' || nome === '1p') c.domainType = neg ? 'thirdParty' : 'firstParty';
        else if (nome === 'domain' || nome === 'from') {
          const x = dominiOpz(val, '|'); if (!x) { st.saltate++; return null; }
          if (x.si.length) c.initiatorDomains = x.si;
          if (x.no.length) c.excludedInitiatorDomains = x.no;
        } else if (nome === 'denyallow') {
          const x = dominiOpz(val, '|'); if (!x) { st.saltate++; return null; }
          c.excludedRequestDomains = x.si;
        } else if (nome === 'match-case') minuscolo = false;
        else if (nome === 'important') importante = true;
        else if (nome === 'all') { /* nessun limite di tipo */ }
        else if (nome === 'document' || nome === 'doc') documento = true;
        else if (nome === 'elemhide' || nome === 'generichide') nascondi = true;
        else { st.saltate++; return null; }
      }
    }
    // le eccezioni "non nascondere su questo sito" valgono per la parte che nasconde (cosmetica)
    if (nascondi) {
      if (eccezione) { const m = /^\|\|([a-z0-9.-]+)\^?$/.exec(patt.toLowerCase()); if (m) st.nienteGenerici.add(m[1]); }
      if (!documento) return null;
    }
    if (documento && !eccezione) { st.saltate++; return null; }
    if (!ASCII.test(patt)) { st.saltate++; return null; }
    if (patt === '*') patt = '';
    const azione = eccezione ? (documento ? 'allowAllRequests' : 'allow') : 'block';
    if (documento) tipi.clear(), tipi.add('main_frame'), tipi.add('sub_frame');
    if (tipi.size) c.resourceTypes = [...tipi];
    if (noTipi.size && !tipi.size) c.excludedResourceTypes = [...noTipi];
    if (!minuscolo) c.isUrlFilterCaseSensitive = true;
    const prio = azione === 'block' ? (importante ? 3 : 1) : (importante ? 4 : 2);
    // ||dominio^ senza altro: si mettono tanti domini in una regola sola (molte meno regole, meno memoria)
    const m = /^\|\|([a-z0-9.-]+)\^$/.exec(minuscolo ? patt.toLowerCase() : patt);
    if (m && m[1].includes('.')) {
      return { gruppo: JSON.stringify({ a: azione, p: prio, c }), dominio: m[1] };
    }
    if (!patt) {
      if (!c.initiatorDomains && !c.requestDomains) { st.saltate++; return null; }
    } else {
      if (/^\|?\|?\*?$/.test(patt)) { st.saltate++; return null; }
      c.urlFilter = patt;
    }
    if (azione === 'allowAllRequests' && !c.resourceTypes) c.resourceTypes = ['main_frame', 'sub_frame'];
    return { regola: { priority: prio, action: { type: azione }, condition: c } };
  }

  function cosmetica(riga, sep, st) {
    const i = riga.indexOf(sep);
    const domini = riga.slice(0, i), sel = riga.slice(i + sep.length).trim();
    if (!sel || /:-abp-|:xpath|:contains|:matches-|:style\(|:remove\(|:has-text|:upward|:min-text-length|:watch-attr|:others\(|:if\(|:if-not|:remove-attr|:remove-class|\{|^\+js|^\^/.test(sel)) { st.saltate++; return; }
    const eccezione = sep === '#@#';
    const x = domini ? dominiOpz(domini, ',') : { si: [], no: [] };
    if (!x) { st.saltate++; return; }
    const K = st.cos;
    if (eccezione) {
      for (const h of x.si) (K.eccezioniSito[h] ||= []).push(sel);
      if (!x.si.length) K.eccezioniGeneriche.add(sel);
      return;
    }
    if (x.si.length) {
      for (const h of x.si) (K.perSito[h] ||= []).push(sel);
      for (const h of x.no) (K.eccezioniSito[h] ||= []).push(sel);
      return;
    }
    for (const h of x.no) (K.eccezioniSito[h] ||= []).push(sel);
    const m = /^([#.])([A-Za-z0-9_-]+)(.*)$/.exec(sel);
    if (m && !/[,]/.test(m[3])) (K.generici[m[1] + m[2]] ||= []).push(sel);
    else K.complessi.push(sel);
  }

  // testi = { nomeLista: testo }  ->  { rete: { nomeLista: [regole] }, eccezioni: [regole], cosmetica, stat }
  function converti(testi) {
    const out = { rete: {}, eccezioni: [], stat: {} };
    const cos = { generici: {}, complessi: [], perSito: {}, eccezioniSito: {}, eccezioniGeneriche: new Set() };
    const nienteGenerici = new Set();
    const gruppiEcc = new Map();
    const visti = new Set();
    for (const [nome, testo] of Object.entries(testi)) {
      const st = { regex: 0, saltate: 0, righe: 0, nienteGenerici, cos };
      const regole = [], gruppi = new Map();
      for (let riga of testo.split(/\r?\n/)) {
        riga = riga.trim();
        if (!riga || riga[0] === '!' || riga[0] === '[') continue;
        st.righe++;
        if (visti.has(riga)) continue;
        // regole che cambiano il codice delle pagine (AdGuard/uBlock): non le facciamo
        if (/#@?%#|#@?\$\?#|\$\$|#@?\^#|##\^/.test(riga)) { st.saltate++; continue; }
        visti.add(riga);
        const s = /#@?#|#\?#|#\$#|#@\$#|#@\?#/.exec(riga);
        if (s) { if (s[0] === '##' || s[0] === '#@#') cosmetica(riga, s[0], st); else st.saltate++; continue; }
        const r = rete(riga, st);
        if (!r) continue;
        const dest = r.regola ? (r.regola.action.type === 'block' ? regole : out.eccezioni) : null;
        if (dest) { dest.push(r.regola); continue; }
        const mappa = JSON.parse(r.gruppo).a === 'block' ? gruppi : gruppiEcc;
        (mappa.get(r.gruppo) || mappa.set(r.gruppo, []).get(r.gruppo)).push(r.dominio);
      }
      for (const [k, dom] of gruppi) regole.push(...daGruppo(k, dom));
      out.rete[nome] = regole;
      out.stat[nome] = { righe: st.righe, regole: regole.length, saltate: st.saltate, regex: st.regex };
    }
    for (const [k, dom] of gruppiEcc) out.eccezioni.push(...daGruppo(k, dom));
    // ogni lista e le eccezioni hanno i loro numeri (id da 1)
    for (const l of [...Object.values(out.rete), out.eccezioni]) l.forEach((r, i) => { r.id = i + 1; });
    cos.eccezioniGeneriche = [...cos.eccezioniGeneriche];
    cos.nienteGenerici = [...nienteGenerici];
    out.cosmetica = cos;
    return out;
  }

  function daGruppo(k, dom) {
    const g = JSON.parse(k), res = [];
    const u = [...new Set(dom)].sort();
    for (let i = 0; i < u.length; i += MAX_GRUPPO) {
      res.push({ priority: g.p, action: { type: g.a }, condition: { ...g.c, requestDomains: u.slice(i, i + MAX_GRUPPO) } });
    }
    return res;
  }

  G.ScudoConverti = converti;
  if (typeof module !== 'undefined') module.exports = converti;
})(typeof globalThis !== 'undefined' ? globalThis : self);
