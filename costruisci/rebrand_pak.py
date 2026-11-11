# Eclipse: nome e loghi dentro i file .pak di Chromium (lingue e immagini)
import sys,io,os,re,glob,brotli
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import pak
from PIL import Image
V=sys.argv[1]           # cartella della versione (…/157.0.8103.38)
M=sys.argv[2]           # cartella con b_<misura>.png e eclipse_viola.svg
NOME='Eclipse'
TIENI_LINGUE=('it','en-US')
# 1) lingue: solo italiano e inglese (le altre si tolgono: lo spazio su disco, non la RAM)
tolte=0
for f in glob.glob(os.path.join(V,'Locales','*.pak')):
    base=os.path.basename(f)[:-4].split('_')[0]
    if base not in TIENI_LINGUE: os.remove(f); tolte+=1
print('lingue tolte:',tolte)
# 2) il nome: Chromium -> Eclipse, tranne i crediti agli autori (riconosciuti dal testo, non dal numero)
cambi=0
for f in glob.glob(os.path.join(V,'Locales','*.pak')):
    p=pak.leggi(f)
    for rid,val in list(p['res'].items()):
        if b'Chromium' not in val: continue
        try: t=val.decode('utf-8')
        except UnicodeDecodeError: continue
        if 'Chromium Authors' in t or 'Copyright' in t: continue
        if 'open source' in t and 'Chromium</a>' in t:
            t=t.replace('Chromium',NOME,1)           # "Eclipse e' possibile grazie al progetto open source Chromium"
        elif 'Chromium open source project' in t or 'progetto open source Chromium' in t:
            continue
        else:
            t=t.replace('Chromium',NOME)
        p['res'][rid]=t.encode('utf-8'); cambi+=1
    pak.scrivi(f,p)
print('scritte cambiate:',cambi)
# 2b) (11/11) scritte "Chrome" del programma diventano "Eclipse": solo le frasi intere elencate qui (il nome vero di
#     prodotti Google come "Chrome Web Store" resta). Confronto esatto: le frasi lunghe che la contengono non cambiano.
SCRITTE_CHROME={
    'Aggiorna Chrome': 'Aggiorna Eclipse',
    'Chrome non è aggiornato': 'Eclipse non è aggiornato',
    'Chrome ha reimpostato queste impostazioni': 'Eclipse ha reimpostato queste impostazioni',
    'Dati di Chrome eliminati': 'Dati di Eclipse eliminati',
    'Colori di Chrome': 'Colori di Eclipse',
    'Il tuo profilo Chrome': 'Il tuo profilo Eclipse',
    'Google Chrome sta cercando di inserire la password su $1.': 'Eclipse sta cercando di inserire la password su $1.',
}
cambi_scritte=0
for f in glob.glob(os.path.join(V,'Locales','*.pak')):
    p=pak.leggi(f); n=0
    for rid,val in list(p['res'].items()):
        try: t=val.decode('utf-8')
        except UnicodeDecodeError: continue
        if t in SCRITTE_CHROME:
            p['res'][rid]=SCRITTE_CHROME[t].encode('utf-8'); n+=1
    if n: pak.scrivi(f,p)
    if os.path.basename(f).startswith('it'): cambi_scritte+=n   # le frasi sono in italiano: si contano nel file italiano
print('scritte Chrome -> Eclipse:',cambi_scritte)
if cambi_scritte<len(SCRITTE_CHROME): sys.exit('ERRORE: scritte Chrome da cambiare non trovate (%d/%d)'%(cambi_scritte,len(SCRITTE_CHROME)))
if cambi<500: sys.exit('ERRORE: troppo poche scritte cambiate (%d): il formato e\' cambiato, controllare a mano'%cambi)
# 3) i loghi di Chromium -> icona Eclipse. Riconosciuti dall'IMPRONTA dell'immagine (impronte.json, fatte sulla 157),
#    cosi' funziona anche nelle versioni nuove dove i numeri cambiano. Se non li trova tutti: si ferma (meglio niente
#    che un Eclipse con pezzi di Chromium).
import json, hashlib
IMP=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'impronte.json')))
def ahash(b):
    im=Image.open(io.BytesIO(b)).convert('RGBA')
    bg=Image.new('RGBA',im.size,(0,0,0,255)); bg.alpha_composite(im)
    g=bg.convert('L').resize((16,16),Image.LANCZOS)
    px=list(g.getdata()); m=sum(px)/len(px)
    return ''.join('1' if x>m else '0' for x in px)
def dist(a,b): return sum(x!=y for x,y in zip(a,b))
def png(s):
    src=os.path.join(M,'b_%d.png'%s)
    im=Image.open(src) if os.path.exists(src) else Image.open(os.path.join(M,'b_512.png')).resize((s,s),Image.LANCZOS)
    o=io.BytesIO(); im.save(o,'PNG',optimize=True); return o.getvalue()
trovate=[0]*len(IMP['png']); svg_ok=False
for f in ['chrome_100_percent.pak','chrome_200_percent.pak','resources.pak']:
    p=pak.leggi(os.path.join(V,f)); n=0
    cand=[(i,x) for i,x in enumerate(IMP['png']) if x['file']==f]
    misure={(x['w'],x['h']) for _,x in cand}
    for rid,v in list(p['res'].items()):
        if v[:8]!=b'\x89PNG\r\n\x1a\n': continue
        try: w,h=Image.open(io.BytesIO(v)).size
        except Exception: continue
        if (w,h) not in misure: continue
        hv=ahash(v); preso=False
        for i,x in cand:
            if (x['w'],x['h'])==(w,h) and dist(hv,x['hash'])<=10:
                trovate[i]+=1; preso=True   # immagini uguali in piu' posti: valgono per tutte le impronte simili
        if preso: p['res'][rid]=png(w); n+=1
    if f=='resources.pak':
        s_eclipse=open(os.path.join(M,'eclipse_viola_trasp.svg'),'rb').read()
        for x in IMP['svg']:
            for rid,v in list(p['res'].items()):
                if v[:2]!=b'\x1e\x9b': continue
                try: t=brotli.decompress(v[8:])
                except Exception: continue
                if hashlib.sha256(t).hexdigest()==x['sha'] or (abs(len(t)-x['len'])<x['len']*0.1 and t[:200].decode('utf-8','replace')==x['pezzo'][:200]):
                    p['res'][rid]=b'\x1e\x9b'+len(s_eclipse).to_bytes(6,'little')+brotli.compress(s_eclipse); svg_ok=True; n+=1
    pak.scrivi(os.path.join(V,f),p); print(f,'loghi sostituiti:',n)
mancano=[IMP['png'][i] for i,c in enumerate(trovate) if c==0]
troppi=[IMP['png'][i] for i,c in enumerate(trovate) if c>3]
if mancano or troppi or not svg_ok:
    sys.exit('ERRORE loghi: mancano %s, troppi %s, svg %s'%([(x['file'],x['w']) for x in mancano],[(x['file'],x['w']) for x in troppi],svg_ok))
# 4) le tessere di Start (VisualElements)
for nome in ('Logo.png','SmallLogo.png'):
    q=os.path.join(V,'VisualElements',nome)
    if os.path.exists(q):
        s=Image.open(q).size[0]
        Image.open(os.path.join(M,'b_512.png')).resize((s,s),Image.LANCZOS).save(q)
print('ok')
