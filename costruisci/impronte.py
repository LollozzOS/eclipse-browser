# Crea le "impronte" dei loghi di Chromium da una versione originale (una volta sola): python impronte.py <cartella versione> <uscita.json>
# Un'impronta = misura dell'immagine + come appare ridotta a 16x16 in bianco e nero. Cosi' nelle versioni nuove i loghi
# si riconoscono guardando l'immagine, non dal numero di posizione (che cambia a ogni versione).
import sys, os, io, json, hashlib, brotli
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pak
from PIL import Image
LOGHI = {15304, 15306, 41272, 15357, 15358, 15359, 15152, 15188, 15189, 15190}
SVG = 53260
def ahash(b):
    im = Image.open(io.BytesIO(b)).convert('RGBA')
    bg = Image.new('RGBA', im.size, (0, 0, 0, 255)); bg.alpha_composite(im)
    g = bg.convert('L').resize((16, 16), Image.LANCZOS)
    px = list(g.getdata()); m = sum(px) / len(px)
    return ''.join('1' if x > m else '0' for x in px)
def svgtesto(v):
    return brotli.decompress(v[8:]) if v[:2] == b'\x1e\x9b' else v
V = sys.argv[1]; out = {'png': [], 'svg': []}
for f in ['chrome_100_percent.pak', 'chrome_200_percent.pak', 'resources.pak']:
    p = pak.leggi(os.path.join(V, f))
    for rid in sorted(LOGHI):
        v = p['res'].get(rid)
        if v and v[:8] == b'\x89PNG\r\n\x1a\n':
            w, h = Image.open(io.BytesIO(v)).size
            out['png'].append({'file': f, 'id157': rid, 'w': w, 'h': h, 'hash': ahash(v)})
    if f == 'resources.pak' and SVG in p['res']:
        t = svgtesto(p['res'][SVG])
        out['svg'].append({'file': f, 'id157': SVG, 'sha': hashlib.sha256(t).hexdigest(), 'len': len(t), 'pezzo': t[:300].decode('utf-8', 'replace')})
json.dump(out, open(sys.argv[2], 'w'), indent=1)
print('impronte png', len(out['png']), 'svg', len(out['svg']))
