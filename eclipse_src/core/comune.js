// colori derivati dal colore del tema (come la finestra del tema di LollozzOS)
(function () {
  const h = (window.ECLIPSE_COLORE || '#6A00FF').replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const mix = (t, c) => `rgb(${Math.round(r * t + c * (1 - t))},${Math.round(g * t + c * (1 - t))},${Math.round(b * t + c * (1 - t))})`;
  const s = document.documentElement.style;
  s.setProperty('--acc', `rgb(${r},${g},${b})`);
  s.setProperty('--acc-chiaro', mix(0.6, 255));
  s.setProperty('--acc-buio', mix(0.3, 8));
  s.setProperty('--acc-luce', `rgba(${r},${g},${b},.45)`);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  s.setProperty('--su-acc', lum > 165 ? '#121216' : '#ffffff');
})();
