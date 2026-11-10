# Unisce Eclipse Scudo dentro l'estensione Eclipse (un processo in meno). Sorgente: scudo/ext -> eclipse_src/core/scudo
import json, os, re, shutil
B = os.path.dirname(os.path.abspath(__file__))
R = os.path.dirname(B); S = os.path.join(R, 'scudo'); C = os.path.join(R, 'eclipse_src', 'core'); D = os.path.join(C, 'scudo')
shutil.rmtree(D, ignore_errors=True); os.makedirs(D)
for f in ['converti.js', 'cosmetica.js', 'youtube.js', 'twitch.js', 'nostre.txt', 'liste.json', 'cosmetica.json', 'cosmetica_cookie.json', 'logo.svg']:
    shutil.copy(os.path.join(S, f), D)
shutil.copytree(os.path.join(S, 'regole'), os.path.join(D, 'regole'))
sw = open(os.path.join(S, 'sfondo.js'), encoding='utf-8').read()
R = [("self.window = self;\nimportScripts('colore.js', 'converti.js');", "importScripts('scudo/converti.js');"),
     ("fetch('liste.json')", "fetch('scudo/liste.json')"), ("fetch('nostre.txt')", "fetch('scudo/nostre.txt')"),
     ("fetch('cosmetica.json')", "fetch('scudo/cosmetica.json')"), ("fetch('cosmetica_cookie.json')", "fetch('scudo/cosmetica_cookie.json')"),
     ("js: ['cosmetica.js']", "js: ['scudo/cosmetica.js']"), ("js: ['youtube.js']", "js: ['scudo/youtube.js']"), ("js: ['twitch.js']", "js: ['scudo/twitch.js']"),
     ("""chrome.runtime.onMessage.addListener((m, sender, rispondi) => {
  suMessaggio(m || {}, sender).then(rispondi, (e) => rispondi({ ok: false, errore: String(e) }));
  return true;
});""", """chrome.runtime.onMessage.addListener((m, sender, rispondi) => {
  if (!m || !m.cosa) return false; // i messaggi senza "cosa" sono della parte Eclipse (nuova scheda, benvenuto)
  suMessaggio(m, sender).then(rispondi, (e) => rispondi({ ok: false, errore: String(e) }));
  return true;
});""")]
for a, b in R:
    assert a in sw, a[:50]
    sw = sw.replace(a, b)
sw = sw[:sw.index('// dal benvenuto di Eclipse (passo "Le tue scelte")')]
open(os.path.join(D, 'scudo.js'), 'w', encoding='utf-8').write('// Eclipse Scudo (dentro l\'estensione Eclipse dal 10/11: un processo in meno)\n' + sw)
# manifest unico
m = json.load(open(os.path.join(C, 'manifest.json')))
ms = json.load(open(os.path.join(S, 'manifest.json')))
m['description'] = 'Nuova scheda, benvenuto, Libera RAM ed Eclipse Scudo di Eclipse by LollozzOS'
m['version'] = '2.0.0'
m['permissions'] = list(dict.fromkeys(m['permissions'] + ms['permissions']))
m['host_permissions'] = ms['host_permissions']
m['declarative_net_request'] = {'rule_resources': [dict(r, path='scudo/' + r['path']) for r in ms['declarative_net_request']['rule_resources']]}
m['action'] = {'default_title': 'Eclipse', 'default_popup': 'pannello.html', 'default_icon': m['action']['default_icon']}
json.dump(m, open(os.path.join(C, 'manifest.json'), 'w'), ensure_ascii=False, indent=2)
print('ok', m['permissions'])
