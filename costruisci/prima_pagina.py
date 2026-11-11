# Eclipse: la pagina "ungoogled-chromium first run" (chrome://ungoogled-first-run) e' scritta dentro chrome.dll.
# Si sostituisce con una pagina di Eclipse (stesse dimensioni: il resto si riempie di spazi, niente si sposta).
# I crediti a Chromium e a ungoogled-chromium restano. Al primo avvio Eclipse trasforma subito questa scheda nel benvenuto:
# per quell'istante la pagina e' solo lo sfondo scuro (il riquadro compare dopo 1,5 secondi, se uno la apre a mano).
import sys
f = sys.argv[1]
b = bytearray(open(f, 'rb').read())
SEGNO = b'<title>ungoogled-chromium first run page</title>'
n = b.count(SEGNO)
if n != 1:
    sys.exit('ERRORE: pagina first run trovata %d volte (deve essere 1): controllare a mano' % n)
i = b.find(SEGNO)
s = b.rfind(b'\x00', 0, i) + 1
e = b.find(b'\x00', i)
NUOVA = '''<title>Eclipse</title>
<meta name="color-scheme" content="dark">
<style>
 @import url(chrome://resources/css/text_defaults_md.css);
 html{color:#F1EDFA;background:#0a0912;line-height:1.5}
 a{color:#b47fff}
 section{max-width:36em;margin:12vh auto;padding:2em 2.4em;border-radius:14px;background:#14121c;border:1px solid #2a2638;animation:c .4s 1.5s both}
 @keyframes c{from{opacity:0}to{opacity:1}}
 h1{font-size:1.6em;font-weight:600;margin:0 0 .4em}
 p{color:#a9a6b8;margin:.6em 0}
</style>
<base target="_blank">
<section>
 <h1>Eclipse by LollozzOS</h1>
 <p>Il browser di LollozzOS, creato da Lollozz: massimo risparmio di memoria e risorse in background, con blocco
 integrato di pubblicit&agrave;, tracciamento e contenuti superflui.</p>
 <p>Eclipse &egrave; basato sui progetti open source <a href="https://www.chromium.org/">Chromium</a> e
 <a href="https://github.com/ungoogled-software/ungoogled-chromium">ungoogled-chromium</a>.
 Crediti e licenze in Impostazioni &rsaquo; Informazioni.</p>
</section>
'''.encode('ascii')
vecchia = e - s
if len(NUOVA) > vecchia:
    sys.exit('ERRORE: la pagina nuova (%d) e\' piu\' lunga di quella vecchia (%d)' % (len(NUOVA), vecchia))
b[s:e] = NUOVA + b' ' * (vecchia - len(NUOVA))
open(f, 'wb').write(b)
print('pagina first run sostituita (%d byte su %d)' % (len(NUOVA), vecchia))
