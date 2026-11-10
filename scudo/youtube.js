// Eclipse Scudo - modulo YouTube (LollozzOS)
// 1) toglie gli annunci dalle informazioni del video prima che il lettore le legga
// 2) se un annuncio passa lo stesso: muto, velocita' al massimo, "Salta" in automatico
// 3) toglie la finestra "i blocchi annunci non sono consentiti" e fa ripartire il video
(() => {
  if (window.__eclipseScudoYT) return;
  window.__eclipseScudoYT = true;

  const CHIAVI = ['adPlacements', 'adSlots', 'playerAds'];
  function pulisci(o, prof) {
    if (!o || typeof o !== 'object' || (prof = (prof || 0) + 1) > 4) return o;
    for (const k of CHIAVI) if (k in o) { try { delete o[k]; } catch (e) {} }
    const mr = o.auxiliaryUi && o.auxiliaryUi.messageRenderers;
    if (mr && mr.enforcementMessageViewModel) { try { delete mr.enforcementMessageViewModel; } catch (e) {} }
    if (o.playerResponse) pulisci(o.playerResponse, prof);
    if (Array.isArray(o)) for (const x of o) pulisci(x, prof);
    return o;
  }
  const interessa = (o) => o && typeof o === 'object' &&
    (o.adPlacements || o.playerAds || o.adSlots || o.playerResponse || (o.auxiliaryUi && o.auxiliaryUi.messageRenderers) ||
     (Array.isArray(o) && o.some((x) => x && typeof x === 'object' && (x.playerResponse || x.adPlacements))));

  // le informazioni del video gia' scritte nella pagina
  for (const nome of ['ytInitialPlayerResponse', 'ytInitialData']) {
    let v;
    try {
      Object.defineProperty(window, nome, {
        configurable: true, enumerable: true,
        get() { return v; },
        set(x) { v = pulisci(x); },
      });
    } catch (e) {}
  }
  // quelle che arrivano dopo (cambio video senza ricaricare la pagina)
  try {
    JSON.parse = new Proxy(JSON.parse, {
      apply(t, th, a) { const r = Reflect.apply(t, th, a); if (interessa(r)) pulisci(r); return r; },
    });
  } catch (e) {}
  try {
    Response.prototype.json = new Proxy(Response.prototype.json, {
      apply(t, th, a) { return Reflect.apply(t, th, a).then((r) => (interessa(r) ? pulisci(r) : r)); },
    });
  } catch (e) {}

  // rete di sicurezza: se un annuncio parte lo stesso
  let mutoPrima = null;
  function controlla() {
    const p = document.querySelector('#movie_player, .html5-video-player');
    if (p) {
      const v = p.querySelector('video');
      if (p.classList.contains('ad-showing') || p.classList.contains('ad-interrupting')) {
        if (v) {
          if (mutoPrima === null) mutoPrima = v.muted;
          v.muted = true;
          try { v.playbackRate = 16; } catch (e) {}
          if (isFinite(v.duration) && v.duration > 0 && v.currentTime < v.duration - 0.2) { try { v.currentTime = v.duration - 0.1; } catch (e) {} }
        }
        for (const b of p.querySelectorAll('.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button-slot button')) { try { b.click(); } catch (e) {} }
      } else if (mutoPrima !== null && v) {
        v.muted = mutoPrima; mutoPrima = null;
        if (v.playbackRate === 16) v.playbackRate = 1;
      }
    }
    const avviso = document.querySelector('ytd-enforcement-message-view-model');
    if (avviso) {
      const d = avviso.closest('tp-yt-paper-dialog, ytd-popup-container > *') || avviso;
      d.remove();
      for (const b of document.querySelectorAll('tp-yt-iron-overlay-backdrop')) b.remove();
      document.body && (document.body.style.overflow = '');
      const v = document.querySelector('#movie_player video');
      if (v && v.paused) v.play().catch(() => {});
    }
  }
  setInterval(controlla, 250);
})();
