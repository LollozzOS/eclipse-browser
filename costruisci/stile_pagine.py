# Eclipse: le pagine interne (Impostazioni, Cronologia, Download, Estensioni, Preferiti...) nello stile di Eclipse.
# Nei file di Chromium i colori delle pagine sono "variabili" (--google-blue-300, --cr-card-background-color...):
# qui si cambia il VALORE di quelle variabili dentro resources.pak, cosi' la forma delle pagine resta quella di
# Chromium e cambiano colori, sfondi e angoli. Il colore del tema e' scritto come  #5900FF/*e*/  : l'installatore
# (Eclipse-Comune.ps1, Eclipse-ColorePagine) cambia solo quei 6 caratteri, senza spostare niente nel file.
# Le risorse toccate si salvano non compresse (Chromium le legge lo stesso: decide dal contenuto).
import sys, os, re, gzip
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pak, brotli

M = '#5900FF/*e*/'                        # il colore del tema (lo cambia l'installatore)
CH = 'color-mix(in srgb,%s 62%%,white)' % M   # chiaro (testi, link, selezioni)
VALORI = {
    # colore del tema
    'google-blue-300': CH, 'google-blue-400': CH, 'google-blue-700': CH, 'google-blue-refresh-300': CH,
    'google-blue-500': M, 'google-blue-600': M, 'google-blue-refresh-500': M,
    'cr-link-color': CH, 'cr-checked-color': M, 'cr-focus-outline-color': CH,
    'cr-fallback-color-primary': CH, 'cr-fallback-color-on-primary': '#120a24',
    'cr-fallback-color-primary-container': 'color-mix(in srgb,%s 40%%,#000000)' % M,
    'cr-fallback-color-on-primary-container': '#ffffff',
    'cr-fallback-color-tonal-container': 'color-mix(in srgb,%s 30%%,#06040d)' % M,
    'cr-fallback-color-on-tonal-container': '#ffffff',
    'cr-nav-menu-item-background-color-selected': 'color-mix(in srgb,%s 32%%,#06040d)' % M,
    'cr-nav-menu-item-color-selected': '#ffffff', 'cr-nav-menu-item-icon-color-selected': '#ffffff',
    'cr-hover-background-color': 'color-mix(in srgb,%s 14%%,transparent)' % M,
    'cr-active-background-color': 'color-mix(in srgb,%s 22%%,transparent)' % M,
    'cr-tabs-selected-color': CH,
    # sfondi e riquadri (come il benvenuto e la nuova scheda di Eclipse)
    'md-background-color': '#000000', 'cr-fallback-color-surface': '#000000', 'cr-fallback-color-base': '#000000',
    'cr-card-background-color': '#06040d', 'cr-fallback-color-base-container': '#06040d',
    'cr-fallback-color-surface1': '#06040d', 'cr-fallback-color-surface2': '#0d0a18', 'cr-fallback-color-surface3': '#0d0a18',
    'cr-fallback-color-surface4': '#0d0a18', 'cr-fallback-color-surface5': '#0d0a18',
    'cr-menu-background-color': '#0d0a18', 'cr-fallback-color-surface-variant': '#1a1530',
    'cr-card-border-radius': '14px', 'cr-card-shadow': 'none',
    # testi
    'cr-primary-text-color': '#F1EDFA', 'cr-secondary-text-color': '#a9a6b8',
    'cr-fallback-color-on-surface': '#F1EDFA', 'cr-fallback-color-on-surface-subtle': '#a9a6b8',
}
NOMI = sorted(VALORI, key=len, reverse=True)
RE = re.compile(r'--(' + '|'.join(re.escape(n) for n in NOMI) + r')(\s*):(\s*)([^;}`"\\]+)')


LOGO_SCURO = b'//resources/images/chrome_logo_dark.svg'


def dec(v):
    if v[:2] == b'\x1e\x9b': return brotli.decompress(v[8:]), True
    if v[:2] == b'\x1f\x8b': return gzip.decompress(v), True
    return v, False


def applica(f):
    p = pak.leggi(f)
    toccate = cambi = 0
    for rid, v in list(p['res'].items()):
        try: d, compresso = dec(v)
        except Exception: continue
        if b'--cr-' not in d and b'--google-blue' not in d and b'--md-background' not in d and LOGO_SCURO not in d: continue
        try: t = d.decode('utf-8')
        except UnicodeDecodeError: continue
        n = [0]
        def sost(m):
            n[0] += 1
            return '--%s%s:%s%s' % (m.group(1), m.group(2), m.group(3), VALORI[m.group(1)])
        t2 = RE.sub(sost, t)
        # nel modo scuro le pagine mettono il logo grigio di Chromium (un disegno a parte): si usa quello di Eclipse
        if LOGO_SCURO.decode() in t2:
            n[0] += t2.count(LOGO_SCURO.decode()); t2 = t2.replace(LOGO_SCURO.decode(), 'chrome://theme/current-channel-logo@2x')
        if n[0]:
            p['res'][rid] = t2.encode('utf-8'); toccate += 1; cambi += n[0]
    pak.scrivi(f, p)
    return toccate, cambi


if __name__ == '__main__':
    f = sys.argv[1]
    toccate, cambi = applica(f)
    print('pagine interne: risorse toccate', toccate, 'colori cambiati', cambi)
    if toccate < 20 or cambi < 300:
        sys.exit('ERRORE: troppo pochi colori cambiati (%d/%d): il formato e\' cambiato, controllare a mano' % (toccate, cambi))
