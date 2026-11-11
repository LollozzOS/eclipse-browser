const demoB = new URLSearchParams(location.search).get('demo');
const apri = (u) => { if (!demoB) chrome.runtime.sendMessage({ apri: u }); };
document.getElementById('cerca').onclick = () => apri('chrome://settings/search');
// "Importa": la guida (preferiti e cronologia con un clic, password con il file esportato da Chrome)
const velo = document.getElementById('velo');
document.getElementById('imp').onclick = () => velo.classList.add('on');
document.getElementById('fatto').onclick = () => velo.classList.remove('on');
velo.onclick = (e) => { if (e.target === velo) velo.classList.remove('on'); };
document.getElementById('impPref').onclick = () => apri('chrome://settings/importData');
document.getElementById('impPass').onclick = () => apri('chrome://password-manager/settings');
document.getElementById('copia').onclick = (e) => {
  const v = 'chrome://password-manager/settings', b = e.currentTarget;
  const vecchio = () => { const t = document.createElement('textarea'); t.value = v; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (x) {} t.remove(); };
  try { navigator.clipboard.writeText(v).catch(vecchio); } catch (x) { vecchio(); }
  b.textContent = 'Copiato \u2713';
};
if (new URLSearchParams(location.search).get('guida')) velo.classList.add('on');
document.getElementById('via').onclick = () => { location.href = 'nuovascheda.html'; };

// le scelte: privacy dei cookie, finestre dei cookie (Eclipse Scudo), scorciatoie "!" (si salvano subito)
const S = { cookie3: true, banner: true, bang: true };
function disegnaScelte() { document.querySelectorAll('.int').forEach((b) => b.classList.toggle('on', !!S[b.dataset.k])); }
async function applicaScelte() {
  if (demoB) return;
  try { await chrome.privacy.websites.thirdPartyCookiesAllowed.set({ value: !S.cookie3 }); } catch (e) {}
  try { chrome.runtime.sendMessage({ cosa: 'banner', acceso: S.banner }); } catch (e) {}
  const { aspetto } = await chrome.storage.local.get('aspetto');
  await chrome.storage.local.set({ aspetto: { ...(aspetto || {}), bang: S.bang }, scelte: S });
}
document.querySelectorAll('.int').forEach((b) => { b.onclick = () => { S[b.dataset.k] = !S[b.dataset.k]; disegnaScelte(); applicaScelte(); }; });
if (!demoB) chrome.storage.local.get('scelte', (d) => { Object.assign(S, d.scelte || {}); disegnaScelte(); });
disegnaScelte();
