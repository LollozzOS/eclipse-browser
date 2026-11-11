const demoB = new URLSearchParams(location.search).get('demo');
const apri = (u) => { if (!demoB) chrome.runtime.sendMessage({ apri: u }); };
document.getElementById('cerca').onclick = () => apri('chrome://settings/search');
document.getElementById('imp').onclick = () => apri('chrome://settings/importData');
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
