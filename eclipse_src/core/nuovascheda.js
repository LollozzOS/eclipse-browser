// i collegamenti rapidi (il cliente li cambia: tasto destro... qui con "+" e la "x")
const SERIE = [
  ['YouTube', 'https://www.youtube.com'], ['Gmail', 'https://mail.google.com'], ['Twitch', 'https://www.twitch.tv'],
  ['Discord', 'https://discord.com/app'], ['Steam', 'https://store.steampowered.com']
];
const ico = (u) => { try { return 'https://' + new URL(u).hostname + '/favicon.ico'; } catch { return ''; } };
function disegna(lista) {
  const g = document.getElementById('g'); g.innerHTML = '';
  lista.forEach(([n, u], i) => {
    const a = document.createElement('a'); a.className = 't'; a.href = u;
    a.innerHTML = `<div class="ic"><img alt=""></div><span></span><div class="x" title="Togli">✕</div>`;
    a.querySelector('img').src = ico(u); a.querySelector('img').onerror = function () { this.replaceWith(Object.assign(document.createElement('b'), { textContent: n[0] })); };
    a.querySelector('span').textContent = n;
    a.querySelector('.x').onclick = (e) => { e.preventDefault(); lista.splice(i, 1); salva(lista); };
    g.appendChild(a);
  });
  if (lista.length < 10) {
    const p = document.createElement('a'); p.className = 't agg'; p.href = '#';
    p.innerHTML = '<div class="ic">+</div><span>Aggiungi</span>';
    p.onclick = (e) => { e.preventDefault(); const u = prompt('Indirizzo del sito (es. www.reddit.com)'); if (!u) return;
      const url = /^https?:\/\//.test(u) ? u : 'https://' + u; let n = u; try { n = new URL(url).hostname.replace(/^www\./, ''); } catch {}
      lista.push([n.charAt(0).toUpperCase() + n.slice(1).split('.')[0], url]); salva(lista); };
    g.appendChild(p);
  }
}
function salva(l) { chrome.storage.local.set({ collegamenti: l }); disegna(l); }
if (new URLSearchParams(location.search).get('demo')) disegna(SERIE.slice()); else chrome.storage.local.get('collegamenti', (d) => disegna(d.collegamenti || SERIE.slice()));
// l'aspetto della pagina (pannello Personalizza): sfondo, orologio, logo, scorciatoie "!"
const SFONDI = [['eclipse', 'Eclipse'], ['tinta', 'Tinta unita'], ['pianeta', 'Pianeta'], ['samurai', 'Samurai'], ['riflesso', 'Riflesso'], ['scia', 'Scia'], ['foto', 'La tua foto']];
let A = { sfondo: 'eclipse', orologio: false, logo: true, bang: true }, FOTO = null;
const demo = new URLSearchParams(location.search).get('demo');
function applica() {
  const sf = document.getElementById('sf');
  sf.className = ''; sf.style.backgroundImage = '';
  if (A.sfondo === 'tinta') sf.className = 'tinta';
  else if (A.sfondo === 'foto' && FOTO) { sf.className = 'img'; sf.style.backgroundImage = `url(${FOTO})`; }
  else if (A.sfondo !== 'eclipse' && A.sfondo !== 'foto') { sf.className = 'img'; sf.style.backgroundImage = `url(sfondi/${A.sfondo}.jpg)`; }
  document.getElementById('orologio').style.display = A.orologio ? '' : 'none';
  document.body.classList.toggle('con-ora', A.orologio);
  for (const id of ['logo', 'nm', 'sub']) document.getElementById(id).style.display = A.logo ? '' : 'none';
  document.querySelectorAll('.int').forEach((b) => b.classList.toggle('on', !!A[b.dataset.k]));
  const g = document.getElementById('sfg'); g.innerHTML = '';
  for (const [k, n] of SFONDI) {
    const d = document.createElement('div'); d.className = 'sfo' + (k === 'eclipse' ? ' ecl' : k === 'tinta' ? ' tin' : k === 'foto' && !FOTO ? ' foto' : '') + (A.sfondo === k ? ' on' : '');
    if (k === 'foto' && FOTO) d.style.backgroundImage = `url(${FOTO})`;
    else if (!['eclipse', 'tinta', 'foto'].includes(k)) d.style.backgroundImage = `url(sfondi/${k}_mini.jpg)`;
    d.innerHTML = (k === 'foto' && !FOTO ? '+' : '') + `<span>${n}</span>`;
    d.onclick = () => { if (k === 'foto') document.getElementById('file').click(); else { A.sfondo = k; salvaA(); } };
    g.appendChild(d);
  }
}
function salvaA() { if (!demo) chrome.storage.local.set({ aspetto: A }); applica(); }
function orologio() {
  const d = new Date();
  document.getElementById('ora').textContent = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('data').textContent = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}
setInterval(orologio, 10000); orologio();
document.querySelectorAll('.int').forEach((b) => { b.onclick = () => { A[b.dataset.k] = !A[b.dataset.k]; salvaA(); }; });
document.getElementById('apri').onclick = () => document.getElementById('pan').classList.add('su');
document.getElementById('chiudi').onclick = () => document.getElementById('pan').classList.remove('su');
// la foto del cliente: ridotta a 1920 px e salvata solo in questo browser
document.getElementById('file').onchange = (e) => {
  const f = e.target.files[0]; if (!f) return;
  const img = new Image();
  img.onload = () => {
    const k = Math.min(1, 1920 / img.width), c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    FOTO = c.toDataURL('image/jpeg', 0.82); A.sfondo = 'foto';
    chrome.storage.local.set({ fotoSfondo: FOTO }); salvaA(); URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(f);
};
if (demo) {
  const D = { base: {}, pianeta: { sfondo: 'pianeta', orologio: true, logo: false }, pannello: { sfondo: 'samurai', orologio: true, logo: false } };
  Object.assign(A, D[demo] || {}); applica();
  if (demo === 'pannello') document.getElementById('pan').classList.add('su');
  if (demo === 'bang') { document.getElementById('q').value = '!yt gatti'; mostraBang(); }
} else {
  chrome.storage.local.get(['aspetto', 'fotoSfondo'], (d) => { Object.assign(A, d.aspetto || {}); FOTO = d.fotoSfondo || null; applica(); });
}
applica();

// la ricerca: scorciatoie "!" (se accese), indirizzi, oppure il motore di ricerca scelto nel browser
function mostraBang() {
  const q = document.getElementById('q').value.trim(), bt = document.getElementById('bt');
  const m = A.bang && (/^!(\w+)/.exec(q) || /\s!(\w+)$/.exec(q));
  const b = m && window.ECLIPSE_BANG[m[1].toLowerCase()];
  bt.style.display = b ? 'block' : 'none'; if (b) bt.textContent = 'cerca su ' + b[0];
}
document.getElementById('q').addEventListener('input', mostraBang);
document.getElementById('f').onsubmit = (e) => {
  e.preventDefault(); const q = document.getElementById('q').value.trim(); if (!q) return;
  const b = A.bang ? window.eclipseBang(q) : null;
  if (b) { location.href = b; return; }
  const sembraUrl = /^[^\s]+\.[a-z]{2,}(\/.*)?$/i.test(q) || /^https?:\/\//.test(q);
  if (sembraUrl) location.href = /^https?:\/\//.test(q) ? q : 'https://' + q;
  else chrome.search.query({ text: q, disposition: 'CURRENT_TAB' });
};
if (!demo) chrome.runtime.sendMessage({ conta: true }, (r) => {
  const n = r ? r.inPausa : 0;
  document.getElementById('pill').innerHTML = n ? `<b>●</b> ${n} ${n === 1 ? 'scheda in pausa' : 'schede in pausa'}: la loro RAM è libera` : '<b>●</b> Schede in pausa automatiche attive';
});
