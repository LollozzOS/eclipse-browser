// Eclipse - la finestrella (clic sull'icona): blocco pubblicita' (AdGuard, NoBreak), cookie, Libera RAM
const $ = (id) => document.getElementById(id);
const demo = new URLSearchParams(location.search).get('demo');

// (15/11) la pubblicita' la bloccano AdGuard e NoBreak (estensioni a parte): qui si vede se sono accese
function blocco(id, ids, e, testoSi) {
  const el = $(id);
  const acceso = !!(e && e.enabled);
  el.classList.toggle('no', !acceso);
  $(ids).textContent = !e ? 'Non trovato in questo Eclipse' : acceso ? testoSi : 'Spento (riaccendilo da Estensioni)';
}
function mostra(d) {
  blocco('ag', 'ags', d.adguard, 'Attivo su tutti i siti, YouTube compreso');
  blocco('nb', 'nbs', d.nobreak, 'Attivo: niente pause pubblicitarie');
  $('liste').textContent = d.liste ? 'Lista dei cookie del ' + d.liste : 'Lista dei cookie: —';
  $('ver').textContent = 'v' + (d.ver || '');
  $('ban').classList.toggle('off', d.banner === false);
}

if (demo) {
  const si = { enabled: true };
  const D = {
    sito: { adguard: si, nobreak: si, liste: '15/11/2026', ver: '2.1.0' },
    spento: { adguard: { enabled: false }, nobreak: si, liste: '15/11/2026', ver: '2.1.0' },
    manca: { adguard: null, nobreak: null, liste: '15/11/2026', ver: '2.1.0', banner: false },
  };
  mostra(D[demo] || D.sito);
} else {
  (async () => {
    let tutte = [];
    try { tutte = await chrome.management.getAll(); } catch (e) {}
    const trova = (re) => tutte.find((x) => x.type === 'extension' && re.test(x.name)) || null;
    const adguard = trova(/^AdGuard/i), nobreak = trova(/^NoBreak/i);
    const st = await chrome.runtime.sendMessage({ cosa: 'stato', host: '', tabId: -1 });
    mostra({ adguard, nobreak, ...st, ver: chrome.runtime.getManifest().version });
    $('aga').onclick = () => { if (adguard && adguard.optionsUrl) chrome.tabs.create({ url: adguard.optionsUrl }); window.close(); };
    $('ban').onclick = async () => {
      const acceso = $('ban').classList.contains('off');
      await chrome.runtime.sendMessage({ cosa: 'banner', acceso });
      $('ban').classList.toggle('off', !acceso);
    };
    $('agg').onclick = async () => {
      $('agg').disabled = true;
      $('agg').textContent = 'Aggiorno…';
      const r = await chrome.runtime.sendMessage({ cosa: 'aggiorna', forza: true });
      $('agg').textContent = r && r.ok ? 'Fatto' : 'Non riuscito';
      if (r && r.liste) $('liste').textContent = 'Lista dei cookie del ' + r.liste;
    };
  })();
}

// ---- Libera RAM (prima era un pulsante a parte) ----
document.getElementById('vai').onclick = () => {
  if (demo) { document.getElementById('ramtxt').textContent = '6 schede messe in pausa'; return; }
  chrome.tabs.query({}, async (tabs) => {
    let n = 0;
    for (const t of tabs) {
      // restano accese: quella in primo piano, quelle che suonano o sono fissate, e le pagine di Eclipse
      if (t.active || t.discarded || t.audible || t.pinned || (t.url || '').startsWith(chrome.runtime.getURL(''))) continue;
      try { await chrome.tabs.discard(t.id); n++; } catch (e) {}
    }
    document.getElementById('ramtxt').textContent = n ? `${n} ${n === 1 ? 'scheda messa' : 'schede messe'} in pausa: la loro RAM è libera` : 'Nessuna scheda da mettere in pausa';
  });
};
