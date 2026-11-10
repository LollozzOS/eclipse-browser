// Eclipse Scudo - modulo Twitch (LollozzOS)
// Su Twitch la pubblicita' e' dentro il video stesso. Il lettore lavora in un "worker" che scarica le liste dei
// pezzi di video (.m3u8). Noi entriamo in quel worker: quando nella lista compare la pubblicita', chiediamo a
// Twitch lo stesso live come lettore "piccolo" (autoplay/embed), che di solito non ha annunci, e passiamo quei
// pezzi al lettore finche' la pubblicita' non finisce. Se anche quello ha annunci, togliamo i pezzi di annuncio
// (il video si ferma qualche secondo invece di mostrare la pubblicita').
(() => {
  if (window.__eclipseScudoTW) return;
  window.__eclipseScudoTW = true;

  // ===================== codice che gira dentro il worker del lettore =====================
  function dentroWorker() {
    const CID = 'kimne78kx3ncx6brgo4mv6wki5h1ko'; // id pubblico del sito web di Twitch
    const F = self.fetch.bind(self);
    const varianti = new Map();   // url lista media -> { canale, res }
    const usher = new Map();      // canale -> url della lista principale (con i parametri del lettore)
    const scorta = new Map();     // canale + res -> { url, tipo, quando }
    const TIPI = ['autoplay', 'embed', 'picture-by-picture', 'thunderdome'];
    let inPub = false;

    const conPub = (t) => t.includes('stitched') || t.includes('X-TV-TWITCH-AD') || /CLASS="twitch-(stitched-)?ad/.test(t);
    const eUsher = (u) => /usher\.ttvnw\.net\/api\/(v2\/)?channel\/hls\/[^/?]+\.m3u8/.test(u);

    function leggiPrincipale(url, testo) {
      const m = /\/hls\/([^/?]+)\.m3u8/.exec(url);
      if (!m) return;
      const canale = decodeURIComponent(m[1]).toLowerCase();
      usher.set(canale, url);
      const r = testo.split('\n');
      for (let i = 0; i < r.length; i++) {
        if (r[i].startsWith('#EXT-X-STREAM-INF')) {
          const res = (/RESOLUTION=(\d+x\d+)/.exec(r[i]) || [])[1] || '';
          const u = (r[i + 1] || '').trim();
          if (u && !u.startsWith('#')) varianti.set(u, { canale, res });
        }
      }
    }
    const altezza = (res) => parseInt((res || '0x0').split('x')[1], 10) || 0;
    function scegli(testo, res) {
      const r = testo.split('\n'), opz = [];
      for (let i = 0; i < r.length; i++) if (r[i].startsWith('#EXT-X-STREAM-INF')) {
        opz.push({ res: (/RESOLUTION=(\d+x\d+)/.exec(r[i]) || [])[1] || '', url: (r[i + 1] || '').trim() });
      }
      if (!opz.length) return null;
      const h = altezza(res);
      opz.sort((a, b) => altezza(b.res) - altezza(a.res));
      return (opz.find((o) => altezza(o.res) <= h) || opz[opz.length - 1]).url;
    }
    async function gettone(canale, tipo) {
      const corpo = {
        operationName: 'PlaybackAccessToken_Template',
        query: 'query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isLive) {    value    signature   authorization { isForbidden forbiddenReasonCode }   __typename  }  videoPlaybackAccessToken(id: $vodID, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isVod) {    value    signature   __typename  }}',
        variables: { isLive: true, login: canale, isVod: false, vodID: '', playerType: tipo },
      };
      const r = await F('https://gql.twitch.tv/gql', { method: 'POST', headers: { 'Client-ID': CID, 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(corpo) });
      const j = await r.json();
      const t = j && j.data && j.data.streamPlaybackAccessToken;
      return t && t.value ? t : null;
    }
    async function trovaScorta(canale, res) {
      const k = canale + '|' + res;
      const c = scorta.get(k);
      if (c && Date.now() - c.quando < 5 * 60e3) {
        const t = await (await F(c.url)).text();
        if (!conPub(t)) return t;
      }
      const base = usher.get(canale);
      for (const tipo of TIPI) {
        if (c && c.tipo === tipo) continue;
        try {
          const tok = await gettone(canale, tipo);
          if (!tok) continue;
          const u = new URL(base || ('https://usher.ttvnw.net/api/channel/hls/' + canale + '.m3u8'));
          u.searchParams.set('sig', tok.signature);
          u.searchParams.set('token', tok.value);
          u.searchParams.set('player_type', tipo);
          const pr = await F(u.href);
          if (!pr.ok) continue;
          const url = scegli(await pr.text(), res);
          if (!url) continue;
          const t = await (await F(url)).text();
          if (!conPub(t)) { scorta.set(k, { url, tipo, quando: Date.now() }); return t; }
        } catch (e) {}
      }
      return null;
    }
    // ultima difesa: togliere i pezzi di annuncio (quelli che non si chiamano "live")
    function senzaPezziPub(t) {
      const r = t.split('\n'), out = [];
      for (let i = 0; i < r.length; i++) {
        const x = r[i];
        if (x.startsWith('#EXT-X-DATERANGE') && /stitched|twitch-ad|Amazon/i.test(x)) continue;
        if (x.startsWith('#EXTINF') && !/,live\s*$/.test(x)) { i++; continue; }
        out.push(x);
      }
      return out.join('\n');
    }

    self.fetch = async function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || String(input);
      if (eUsher(url)) {
        const r = await F(input, init);
        try { leggiPrincipale(url, await r.clone().text()); } catch (e) {}
        return r;
      }
      const v = varianti.get(url) || (url.endsWith('.m3u8') ? varianti.get(url.split('?')[0]) : null);
      if (!v) return F(input, init);
      const r = await F(input, init);
      let t;
      try { t = await r.clone().text(); } catch (e) { return r; }
      if (!conPub(t)) {
        inPub = false;
        return r;
      }
      inPub = true;
      let nuovo = null;
      try { nuovo = await trovaScorta(v.canale, v.res); } catch (e) {}
      if (!nuovo) nuovo = senzaPezziPub(t);
      return new Response(nuovo, { status: 200, statusText: 'OK', headers: r.headers });
    };
    // la lista principale puo' arrivare anche dalla pagina
    self.addEventListener('message', (e) => {
      const d = e.data;
      if (d && d.eclipseScudoUsher) { try { leggiPrincipale(d.eclipseScudoUsher, d.testo); } catch (x) {} e.stopImmediatePropagation(); }
    });
  }

  // ===================== nella pagina =====================
  const W = window.Worker;
  const tutti = new Set();
  function testoDi(url) {
    try { const x = new XMLHttpRequest(); x.open('GET', url, false); x.send(); return x.status === 200 || x.status === 0 ? x.responseText : null; } catch (e) { return null; }
  }
  class ScudoWorker extends W {
    constructor(url, opz) {
      let u = url;
      try {
        const s = String(url);
        let corpo = null;
        if (s.startsWith('blob:')) {
          const t = testoDi(s);
          if (t && /wasmworker|amazon-ivs|ivs-wasm/i.test(t)) corpo = t;
        } else if (/wasmworker|amazon-ivs/i.test(s)) {
          corpo = 'importScripts(' + JSON.stringify(new URL(s, location.href).href) + ');';
        }
        if (corpo) u = URL.createObjectURL(new Blob(['(' + dentroWorker.toString() + ')();\n' + corpo], { type: 'text/javascript' }));
      } catch (e) {}
      super(u, opz);
      if (u !== url) tutti.add(this);
    }
  }
  try { window.Worker = ScudoWorker; } catch (e) {}

  const FP = window.fetch;
  window.fetch = new Proxy(FP, {
    apply(t, th, a) {
      const p = Reflect.apply(t, th, a);
      try {
        const u = typeof a[0] === 'string' ? a[0] : a[0] && a[0].url;
        if (u && /usher\.ttvnw\.net\/api\/(v2\/)?channel\/hls\//.test(u)) {
          p.then((r) => r.clone().text()).then((testo) => { for (const w of tutti) w.postMessage({ eclipseScudoUsher: u, testo }); }).catch(() => {});
        }
      } catch (e) {}
      return p;
    },
  });
})();
