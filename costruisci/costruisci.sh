#!/usr/bin/env bash
# Eclipse by LollozzOS - costruisce il pacchetto da un Ungoogled Chromium per Windows (installer .exe o .zip).
# Uso: costruisci/costruisci.sh <ungoogled.exe|.zip> <numero> [etichetta ungoogled]  ->  uscita/
# Si ferma (codice di errore) se qualcosa del rebrand non torna: meglio niente che un Eclipse a meta'.
set -euo pipefail
R=$(cd "$(dirname "$0")/.." && pwd); IN=$1; NUM=$2; TAG=${3:-}
L=$R/lavoro; U=$R/uscita; rm -rf "$L" "$U"; mkdir -p "$L" "$U"
echo "== 1) estraggo $IN"
case "$IN" in
  *.exe) 7z x -y -o"$L/x" "$IN" >/dev/null; 7z x -y -o"$L/x2" "$L/x/chrome.7z" >/dev/null; SRC=$L/x2/Chrome-bin ;;
  *.zip) 7z x -y -o"$L/x" "$IN" >/dev/null; SRC=$(dirname "$(find "$L/x" -maxdepth 3 -name chrome.exe | head -1)") ;;
  *) echo "formato non riconosciuto"; exit 1 ;;
esac
VER=$(ls "$SRC" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
[ -n "$VER" ] || { echo "ERRORE: versione non trovata"; exit 1; }
echo "   versione Chromium $VER"
P="$L/Eclipse by LollozzOS"; E="$P/Eclipse"; mkdir -p "$P"; cp -r "$SRC" "$E"

echo "== 2) rebrand (nomi, loghi, lingue, icone, dati dei file)"
python3 -W ignore "$R/costruisci/rebrand_pak.py" "$E/$VER" "$R/marchio"
for f in chrome_wer.dll notification_helper.exe chrome_pwa_launcher.exe; do find "$E" -name "$f" -delete; done
(cd "$R/costruisci" && { [ -d node_modules ] || npm install --silent --no-audit --no-fund; } && node rebrand_pe.js "$E" "$R/marchio" "$VER")
cp "$R/pacchetto/initial_preferences" "$E/"
python3 -W ignore "$R/costruisci/stile_pagine.py" "$E/$VER/resources.pak"
python3 "$R/costruisci/prima_pagina.py" "$E/$VER/chrome.dll"
# il programma si chiama eclipse.exe; chrome.exe resta (identico) solo per i PC con gli script di aggiornamento vecchi
cp "$E/chrome.exe" "$E/eclipse.exe"

echo "== 3) Scudo: liste aggiornate di oggi + estensione unica"
LI=$L/liste; mkdir -p "$LI"; GH=https://raw.githubusercontent.com
curl -fsSL "$GH/easylist/easylist/gh-pages/easylist.txt" -o "$LI/easylist.txt"
curl -fsSL "$GH/easylist/easylist/gh-pages/easyprivacy.txt" -o "$LI/easyprivacy.txt"
curl -fsSL "$GH/uBlockOrigin/uAssets/master/filters/filters.txt" -o "$LI/ubo-filters.txt"
curl -fsSL "$GH/uBlockOrigin/uAssets/master/filters/privacy.txt" -o "$LI/ubo-privacy.txt"
curl -fsSL "$GH/AdguardTeam/FiltersRegistry/master/platforms/extension/chromium/filters/18.txt" -o "$LI/adguard-cookie.txt"
node "$R/costruisci/costruisci.js" "$LI" "$R/scudo"
python3 "$R/costruisci/unisci.py"

echo "== 4) pacchetto"
cp -r "$R/eclipse_src/core" "$P/core"; rm -rf "$P/core/_metadata"
cp -r "$R/eclipse_src/script" "$P/script"
cp "$R"/pacchetto/*.bat "$R/pacchetto/LEGGIMI.txt" "$P/"
VERS="$VER.$NUM"
printf '%s\n' "$VERS" > "$P/versione.txt"
# controlli finali: il nome Eclipse c'e', i file tolti non ci sono
for x in "$E/eclipse.exe" "$E/$VER/chrome.dll"; do strings -el "$x" | grep -q "LollozzOS" || { echo "ERRORE: $x senza i dati Eclipse/LollozzOS"; exit 1; }; done
for f in chrome_wer.dll notification_helper.exe chrome_pwa_launcher.exe; do [ -z "$(find "$E" -name "$f")" ] || { echo "ERRORE: $f ancora presente"; exit 1; }; done
grep -q "ungoogled-chromium first run page" "$E/$VER/chrome.dll" && { echo "ERRORE: pagina first run ancora dentro"; exit 1; }
python3 -c "import sys;sys.exit(0 if open(sys.argv[1],'rb').read().count(b'/*e*/')>100 else 1)" "$E/$VER/resources.pak" || { echo "ERRORE: colori delle pagine interne mancanti"; exit 1; }
Z="Eclipse_by_LollozzOS_$VERS.zip"
(cd "$L" && zip -qr -9 "$U/$Z" "Eclipse by LollozzOS")
SHA=$(sha256sum "$U/$Z" | cut -d' ' -f1); DIM=$(stat -c %s "$U/$Z")
python3 - "$U/versione.json" <<PY
import json,sys,datetime
json.dump({"numero":$NUM,"versione":"$VERS","chromium":"$VER","ungoogled":"$TAG","file":"$Z","sha256":"$SHA","dimensione":$DIM,
           "data":datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")},open(sys.argv[1],"w"),indent=1)
PY
echo "== fatto: $U/$Z ($((DIM/1048576)) MB)"; cat "$U/versione.json"
