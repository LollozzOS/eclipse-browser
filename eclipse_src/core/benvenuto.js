const apri = (u) => chrome.runtime.sendMessage({ apri: u });
const on = (id) => { document.querySelectorAll('.passo').forEach((p) => p.classList.remove('on')); document.getElementById(id).classList.add('on'); };
document.getElementById('goo').onclick = () => { apri('chrome://settings/searchEngines'); on('p1'); document.getElementById('imp').className = 'pri'; };
document.getElementById('imp').onclick = () => { apri('chrome://settings/importData'); on('pS'); };
document.getElementById('est').onclick = () => { apri('chrome://extensions'); on('p3'); };
document.getElementById('via').onclick = () => { location.href = 'nuovascheda.html'; };

// le scelte (passo 3): privacy dei cookie, banner dei cookie (Eclipse Scudo), scorciatoie "!"
const demoB = new URLSearchParams(location.search).get('demo');
const S = { cookie3: true, banner: true, bang: true };
function disegnaScelte() { document.querySelectorAll('.sc .int').forEach((b) => b.classList.toggle('on', !!S[b.dataset.k])); }
async function applicaScelte() {
  if (demoB) return;
  try { await chrome.privacy.websites.thirdPartyCookiesAllowed.set({ value: !S.cookie3 }); } catch (e) {}
  try { chrome.runtime.sendMessage({ cosa: 'banner', acceso: S.banner }); } catch (e) {}
  const { aspetto } = await chrome.storage.local.get('aspetto');
  await chrome.storage.local.set({ aspetto: { ...(aspetto || {}), bang: S.bang }, scelte: S });
}
document.querySelectorAll('.sc .int').forEach((b) => { b.onclick = (e) => { e.preventDefault(); S[b.dataset.k] = !S[b.dataset.k]; disegnaScelte(); applicaScelte(); }; });
document.getElementById('scelte').onclick = () => { applicaScelte(); on('p2'); };
if (!demoB) chrome.storage.local.get('scelte', (d) => { Object.assign(S, d.scelte || {}); disegnaScelte(); });
disegnaScelte();

// i pulsanti "Copia" del passo Google
document.querySelectorAll('.cp').forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll('.cp').forEach((x) => { x.classList.remove('ok'); x.textContent = 'Copia'; });
    b.classList.add('ok'); b.textContent = 'Copiato ✓';
    // copia: prima il modo moderno, se non va quello classico
    const vecchio = () => { const t = document.createElement('textarea'); t.value = b.dataset.v; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove(); };
    try { navigator.clipboard.writeText(b.dataset.v).catch(vecchio); } catch (e) { vecchio(); }
  };
});
