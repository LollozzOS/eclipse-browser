// Eclipse Scudo - nasconde i riquadri pubblicitari della pagina.
// Non porta nella pagina tutte le regole: guarda quali nomi (id e classi) ci sono davvero e chiede solo quelle.
(() => {
  if (window.__eclipseScudo) return;
  window.__eclipseScudo = true;
  const host = location.hostname;
  if (!host) return;
  const manda = (m) => { try { return chrome.runtime.sendMessage(m).catch(() => null); } catch (e) { return Promise.resolve(null); } };
  let spento = false;
  manda({ cosa: 'cosmeticaSito', host }).then((r) => { if (r && r.spento) spento = true; });

  const visti = new Set();
  let coda = [];
  let timer = 0;
  function nomi(el) {
    if (el.nodeType !== 1) return;
    const id = el.id;
    if (id && typeof id === 'string') { const k = '#' + id; if (!visti.has(k)) { visti.add(k); coda.push(k); } }
    const cl = el.classList;
    if (cl) for (let i = 0; i < cl.length; i++) { const k = '.' + cl[i]; if (!visti.has(k)) { visti.add(k); coda.push(k); } }
  }
  function giro(radice) {
    nomi(radice);
    if (radice.querySelectorAll) { const t = radice.querySelectorAll('[id],[class]'); for (let i = 0; i < t.length; i++) nomi(t[i]); }
  }
  function invia() {
    timer = 0;
    if (spento || !coda.length) { coda = []; return; }
    const c = coda; coda = [];
    manda({ cosa: 'generici', host, chiavi: c });
  }
  function presto(ms) { if (!timer) timer = setTimeout(invia, ms); }

  const os = new MutationObserver((lista) => {
    for (const m of lista) {
      if (m.type === 'attributes') nomi(m.target);
      else for (const n of m.addedNodes) if (n.nodeType === 1) giro(n);
    }
    if (coda.length) presto(400);
  });
  function parti() {
    giro(document.documentElement);
    invia();
    os.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['id', 'class'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', parti, { once: true });
  else parti();
})();
