// Eclipse Scudo - la finestrella (clic sull'icona dello scudo)
const $ = (id) => document.getElementById(id);
const demo = new URLSearchParams(location.search).get('demo');

function videoTesto(host) {
  if (/(^|\.)youtube\.com$/.test(host)) return 'Modulo YouTube attivo: gli annunci vengono tolti prima che parta il video.';
  if (/(^|\.)twitch\.tv$/.test(host)) return 'Modulo Twitch attivo: durante la pubblicità vedi il live a qualità ridotta, poi torna normale.';
  return '';
}

function mostra(d) {
  document.body.classList.toggle('spento', !!d.spento);
  $('host').textContent = d.host || 'Pagina di Eclipse';
  $('stato').textContent = !d.host ? 'Qui non c\'è niente da bloccare' : d.spento ? 'Spento su questo sito' : 'Protezione attiva';
  $('int').style.visibility = d.host ? 'visible' : 'hidden';
  $('tot').textContent = d.pub + d.tra;
  $('pub').textContent = d.pub;
  $('tra').textContent = d.tra;
  const v = videoTesto(d.host || '');
  $('video').textContent = v;
  $('video').classList.toggle('si', !!v);
  $('liste').textContent = d.liste ? 'Liste del ' + d.liste : 'Liste: —';
  $('ver').textContent = 'v' + (d.ver || '');
  $('ban').classList.toggle('off', d.banner === false);
}

if (demo) {
  const D = {
    sito: { host: 'www.ilmeteo.it', pub: 41, tra: 17, liste: '10/11/2026', ver: '1.0.0' },
    yt: { host: 'www.youtube.com', pub: 9, tra: 6, liste: '10/11/2026', ver: '1.0.0' },
    tw: { host: 'www.twitch.tv', pub: 5, tra: 11, liste: '10/11/2026', ver: '1.0.0' },
    spento: { host: 'www.ilmeteo.it', pub: 0, tra: 0, spento: true, liste: '10/11/2026', ver: '1.0.0' },
  };
  mostra(D[demo] || D.sito);
} else {
  (async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let host = '';
    try { const u = new URL(tab.url); if (/^https?:$/.test(u.protocol)) host = u.hostname; } catch (e) {}
    const st = await chrome.runtime.sendMessage({ cosa: 'stato', host, tabId: tab.id });
    mostra({ host, ...st, ver: chrome.runtime.getManifest().version });
    $('int').onclick = async () => {
      const spento = !document.body.classList.contains('spento');
      await chrome.runtime.sendMessage({ cosa: 'interruttore', host, spento });
      chrome.tabs.reload(tab.id);
      window.close();
    };
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
      if (r && r.liste) $('liste').textContent = 'Liste del ' + r.liste;
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
