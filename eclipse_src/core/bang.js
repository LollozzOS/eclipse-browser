// Eclipse by LollozzOS - scorciatoie di ricerca "!" (idea di Helium/DuckDuckGo): "!yt gatti" cerca subito su YouTube.
// %s = quello che hai scritto. Lista nostra, corta e utile (si allunga quando serve).
window.ECLIPSE_BANG = {
  g: ['Google', 'https://www.google.com/search?q=%s'],
  img: ['Google Immagini', 'https://www.google.com/search?tbm=isch&q=%s'],
  yt: ['YouTube', 'https://www.youtube.com/results?search_query=%s'],
  w: ['Wikipedia', 'https://it.wikipedia.org/w/index.php?search=%s'],
  a: ['Amazon', 'https://www.amazon.it/s?k=%s'],
  eb: ['eBay', 'https://www.ebay.it/sch/i.html?_nkw=%s'],
  sub: ['Subito', 'https://www.subito.it/annunci-italia/vendita/usato/?q=%s'],
  m: ['Google Maps', 'https://www.google.com/maps/search/%s'],
  tr: ['Google Traduttore', 'https://translate.google.com/?sl=auto&tl=it&text=%s'],
  tw: ['Twitch', 'https://www.twitch.tv/search?term=%s'],
  r: ['Reddit', 'https://www.reddit.com/search/?q=%s'],
  gh: ['GitHub', 'https://github.com/search?q=%s'],
  x: ['X', 'https://x.com/search?q=%s'],
  tt: ['TikTok', 'https://www.tiktok.com/search?q=%s'],
  sp: ['Spotify', 'https://open.spotify.com/search/%s'],
  st: ['Steam', 'https://store.steampowered.com/search/?term=%s'],
  imdb: ['IMDb', 'https://www.imdb.com/find/?q=%s'],
  b: ['Brave Search', 'https://search.brave.com/search?q=%s'],
  ddg: ['DuckDuckGo', 'https://duckduckgo.com/?q=%s'],
  bing: ['Bing', 'https://www.bing.com/search?q=%s'],
  gpt: ['ChatGPT', 'https://chatgpt.com/?q=%s'],
  cl: ['Claude', 'https://claude.ai/new?q=%s'],
  news: ['Google News', 'https://news.google.com/search?q=%s&hl=it'],
  meteo: ['iLMeteo', 'https://www.ilmeteo.it/meteo/%s'],
};
// "!yt gatti" oppure "gatti !yt" -> indirizzo; null se non c'e' una scorciatoia conosciuta
window.eclipseBang = function (q) {
  const m = /^!(\w+)\s*(.*)$/.exec(q) || /^(.*?)\s+!(\w+)$/.exec(q);
  if (!m) return null;
  const [k, testo] = q.startsWith('!') ? [m[1], m[2]] : [m[2], m[1]];
  const b = window.ECLIPSE_BANG[k.toLowerCase()];
  if (!b) return null;
  if (!testo.trim()) return new URL(b[1]).origin;
  return b[1].replace('%s', encodeURIComponent(testo.trim()));
};
