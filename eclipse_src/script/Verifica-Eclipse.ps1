# ============================================================================
#  Eclipse by LollozzOS - fa tutto da solo e scrive un resoconto da mandare (Desktop\Verifica-Eclipse.txt)
#   1) installa / aggiorna Eclipse (Installa-Eclipse.ps1)
#   2) controlla l'installazione: file, estensioni, impostazioni di avvio, profilo, Widevine, modello AI...
#   3) prova RAM e CPU rapida, Chrome contro Eclipse (circa 3 minuti, non usare il PC)
#  Legge soltanto: non tocca Chrome ne' i dati di Chrome. Chiude Eclipse se e' aperto.
# ============================================================================
#requires -RunAsAdministrator
param([switch]$SenzaInstallare, [switch]$SenzaProvaRam)
$ErrorActionPreference = 'Continue'
$qui = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Verifica-Eclipse.txt'
foreach ($f in @('Eclipse-Comune.ps1', 'Installa-Eclipse.ps1', 'Misura-RAM.ps1')) {
    if (-not (Test-Path -LiteralPath (Join-Path $qui $f))) {
        Write-Host "  Manca script\${f}: estrai il pacchetto COMPLETO di Eclipse (Eclipse_by_LollozzOS_v4.zip) e lancia da li'." -ForegroundColor Red
        exit 1
    }
}
$R = New-Object System.Collections.Generic.List[string]
function Riga([string]$t) { $R.Add($t); Write-Host "  $t" }
function Titolo([string]$t) { $R.Add(''); $R.Add("=== $t ==="); Write-Host ''; Write-Host "  === $t ===" -ForegroundColor Magenta }
function MB([string]$p) { try { [math]::Round(((Get-ChildItem -LiteralPath $p -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum) / 1MB, 1) } catch { 0 } }

Riga ('Verifica Eclipse by LollozzOS - ' + (Get-Date -Format 'dd/MM/yyyy HH:mm'))
$os = Get-CimInstance Win32_OperatingSystem; $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
Riga ("Windows: {0} {1} (build {2})" -f $os.Caption, $os.OSArchitecture, $os.BuildNumber)
Riga ("PC: {0} - {1} core/{2} thread - RAM {3} GB" -f $cpu.Name.Trim(), $cpu.NumberOfCores, $cpu.NumberOfLogicalProcessors, [math]::Round($os.TotalVisibleMemorySize / 1MB, 1))

# ---------- 1) installazione ----------
if (-not $SenzaInstallare) {
    Titolo 'Installazione'
    try {
        $log = & (Join-Path $qui 'Installa-Eclipse.ps1') *>&1 | ForEach-Object { "$_" }
        foreach ($l in $log) { if ($l.Trim()) { Riga $l.Trim() } }
    } catch { Riga "INSTALLAZIONE FALLITA: $($_.Exception.Message)" }
}
. (Join-Path $qui 'Eclipse-Comune.ps1')

# ---------- 2) controlli ----------
Titolo 'Programma'
if (Test-Path -LiteralPath $script:ECLIPSE_EXE) {
    $vi = (Get-Item -LiteralPath $script:ECLIPSE_EXE).VersionInfo
    Riga ("Eclipse: {0} - {1} ({2})" -f $vi.ProductName, $vi.ProductVersion, $script:ECLIPSE_DIR)
    Riga ("Spazio su disco del programma: {0} MB" -f (MB $script:ECLIPSE_DIR))
    foreach ($f in $script:ECLIPSE_FILE_INUTILI) {
        $c = @(Get-ChildItem -LiteralPath $script:ECLIPSE_DIR -Recurse -Filter $f -ErrorAction SilentlyContinue)
        Riga ("File inutile {0}: {1}" -f $f, $(if ($c.Count) { 'ANCORA PRESENTE' } else { 'tolto' }))
    }
} else { Riga 'Eclipse NON installato' }

Titolo 'Estensioni'
foreach ($d in @(Get-ChildItem -LiteralPath $script:ECLIPSE_EST -Directory -ErrorAction SilentlyContinue)) {
    $m = Join-Path $d.FullName 'manifest.json'; $info = 'senza manifest'
    if (Test-Path $m) { try { $j = Get-Content -LiteralPath $m -Raw | ConvertFrom-Json; $info = "$($j.name) $($j.version)" } catch { $info = 'manifest illeggibile' } }
    Riga ("{0,-10} {1}  ({2} MB)" -f $d.Name, $info, (MB $d.FullName))
}
$col = Join-Path $script:ECLIPSE_EST 'core\colore.js'
if (Test-Path $col) { Riga ('Colore del tema: ' + ((Get-Content -LiteralPath $col -Raw) -replace '[\r\n]', '').Trim()) }
Riga ('Caricate all''avvio: ' + ((@(Eclipse-Estensioni) | ForEach-Object { Split-Path $_ -Leaf }) -join ', '))

Titolo 'Collegamento e impostazioni di avvio'
try {
    $sh = New-Object -ComObject WScript.Shell
    $lnk = Join-Path ([Environment]::GetFolderPath('CommonDesktopDirectory')) 'Eclipse.lnk'
    if (Test-Path $lnk) { $a = $sh.CreateShortcut($lnk).Arguments; foreach ($x in ($a -split '\s(?=--)')) { Riga "  $x" } } else { Riga 'Collegamento sul desktop: MANCA' }
} catch { Riga "Collegamento: errore $($_.Exception.Message)" }
$pol = 'HKLM:\SOFTWARE\Policies\Chromium'
Riga ('Regole di Windows per Chromium (non dovrebbero esserci): ' + $(if (Test-Path $pol) { ((Get-Item $pol).Property -join ', ') } else { 'nessuna' }))

Titolo 'Profilo di Eclipse'
$dati = $script:ECLIPSE_DATI
if (Test-Path $dati) {
    Riga ("Cartella: {0} ({1} MB)" -f $dati, (MB $dati))
    $pf = Join-Path $dati 'Default\Preferences'
    if (Test-Path $pf) {
        try {
            Add-Type -AssemblyName System.Web.Extensions
            $js = New-Object System.Web.Script.Serialization.JavaScriptSerializer; $js.MaxJsonLength = [int]::MaxValue; $js.RecursionLimit = 1000
            $p = $js.DeserializeObject([IO.File]::ReadAllText($pf))
            $dsp = $null; if ($p.ContainsKey('default_search_provider_data')) { $dsp = $p['default_search_provider_data']['template_url_data'] }
            $guid = $null; if ($p.ContainsKey('default_search_provider') -and $p['default_search_provider'].ContainsKey('guid')) { $guid = $p['default_search_provider']['guid'] }
            $mir = $null; if ($p.ContainsKey('default_search_provider_data') -and $p['default_search_provider_data'].ContainsKey('mirrored_template_url_data')) { $mir = $p['default_search_provider_data']['mirrored_template_url_data'] }
            $mot = if ($dsp) { "$($dsp['short_name']) - $($dsp['url'])" } elseif ($mir) { "$($mir['short_name']) - $($mir['url'])" } elseif ($guid) { "scelto nelle impostazioni (codice $guid)" } else { 'quello di serie (nessuno scelto)' }
            Riga ('Motore di ricerca: ' + $mot)
            $sp = 'non impostato'; if ($p.ContainsKey('browser') -and $p['browser'].ContainsKey('enable_spellchecking')) { $sp = $p['browser']['enable_spellchecking'] }
            Riga "Controllo ortografico: $sp"
            $ck = 'non impostato'; if ($p.ContainsKey('profile') -and $p['profile'].ContainsKey('cookie_controls_mode')) { $ck = $p['profile']['cookie_controls_mode'] }
            Riga "Cookie di terze parti dalle impostazioni (1 = bloccati): $ck (se li blocca Eclipse dal benvenuto qui puo' non risultare)"
            if ($p.ContainsKey('extensions') -and $p['extensions'].ContainsKey('settings')) {
                foreach ($k in $p['extensions']['settings'].Keys) {
                    $e = $p['extensions']['settings'][$k]; $n = ''; if ($e.ContainsKey('manifest')) { $n = $e['manifest']['name'] }
                    $st = ''; if ($e.ContainsKey('disable_reasons')) { $st = ' DISATTIVATA(' + (($e['disable_reasons'] | ForEach-Object { $_ }) -join ',') + ')' } elseif ($e.ContainsKey('state') -and $e['state'] -eq 0) { $st = ' DISATTIVATA' }
                    if ($n) { Riga "Estensione nel profilo: $n [$k]$st" }
                }
            }
        } catch { Riga "Preferences: non leggibile ($($_.Exception.Message))" }
    } else { Riga 'Preferences: non c''e'' (Eclipse mai aperto)' }
    $bm = Eclipse-LeggiPreferiti (Join-Path $dati 'Default\Bookmarks')
    Riga ('Preferiti in Eclipse: ' + $(if ($null -ne $bm) { $bm } else { 'nessun file' }))
    $wv = @(Get-ChildItem -LiteralPath (Join-Path $dati 'WidevineCdm') -Directory -ErrorAction SilentlyContinue)
    Riga ('Widevine (Netflix/Spotify): ' + $(if ($wv.Count) { ($wv.Name -join ', ') + ' - dll: ' + [bool](Test-Path (Join-Path $wv[0].FullName '_platform_specific\win_x64\widevinecdm.dll')) } else { 'NON presente' }))
    foreach ($ai in @('OptGuideOnDeviceModel', 'OptimizationGuidePredictionModels', 'optimization_guide_model_store')) {
        $pa = Join-Path $dati $ai
        Riga ("Cartella AI {0}: {1}" -f $ai, $(if (Test-Path $pa) { "PRESENTE ($(MB $pa) MB)" } else { 'assente' }))
    }
    $big = Get-ChildItem -LiteralPath (Join-Path $dati 'Default') -Directory -ErrorAction SilentlyContinue | ForEach-Object { [pscustomobject]@{ n = $_.Name; mb = (MB $_.FullName) } } | Sort-Object mb -Descending | Select-Object -First 8
    Riga ('Cartelle piu'' grandi del profilo: ' + (($big | ForEach-Object { "$($_.n) $($_.mb) MB" }) -join '; '))
} else { Riga 'Profilo: non c''e'' ancora' }

$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
Riga ('Chrome sul PC: ' + $(if ($chrome) { (Get-Item $chrome).VersionInfo.ProductVersion } else { 'non installato' }))

# ---------- 3) prova RAM ----------
if (-not $SenzaProvaRam) {
    Titolo 'Prova RAM e CPU (3 minuti: non usare il PC)'
    Eclipse-Processi | Stop-Process -Force -ErrorAction SilentlyContinue
    if ($chrome -and @(Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.Path -ieq $chrome }).Count) {
        Write-Host '  Chrome e'' aperto: chiudilo (aspetto fino a 2 minuti)...' -ForegroundColor Yellow
        for ($i = 0; $i -lt 60 -and @(Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.Path -ieq $chrome }).Count; $i++) { Start-Sleep 2 }
    }
    if ($chrome -and @(Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.Path -ieq $chrome }).Count) {
        Riga 'Chrome era ancora aperto: prova RAM saltata'
    } else {
        Start-Sleep 3
        $tmp = Join-Path $env:TEMP 'eclipse_prova_ram.txt'
        try {
            & (Join-Path $qui 'Misura-RAM.ps1') -Rapida -Automatico -Uscita $tmp *>&1 | Out-Null
            if (Test-Path $tmp) { foreach ($l in (Get-Content -LiteralPath $tmp)) { Riga $l } ; Remove-Item $tmp -Force }
            else { Riga 'Prova RAM: nessun risultato' }
        } catch { Riga "Prova RAM: errore $($_.Exception.Message)" }
    }
}

[IO.File]::WriteAllLines($out, $R, (New-Object System.Text.UTF8Encoding($false)))
Write-Host ''
Write-Host "  Fatto. Mandami il file: $out" -ForegroundColor Green
