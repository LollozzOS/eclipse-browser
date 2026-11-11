# ============================================================================
#  Eclipse by LollozzOS - pezzi in comune tra installatore, tema e Toolbox
# ============================================================================
$script:ECLIPSE_DIR  = Join-Path $env:ProgramFiles 'Eclipse'
# (11/11) il programma si chiama eclipse.exe (prima chrome.exe: il pacchetto li ha tutti e due finche' i PC non sono passati)
$script:ECLIPSE_EXE  = Join-Path $script:ECLIPSE_DIR 'eclipse.exe'
$script:ECLIPSE_DATI = Join-Path $env:LOCALAPPDATA 'Eclipse\User Data'
$script:ECLIPSE_EST  = Join-Path $script:ECLIPSE_DIR 'Estensioni'
$script:ECLIPSE_VIOLA = '6A00FF'
# numeri fissi delle estensioni di Eclipse (dalla chiave nel manifest): restano uguali in ogni installazione
$script:ECLIPSE_ID_CORE  = 'doeokiglaacbfegkolekpjimdbacepgi'
$script:ECLIPSE_ID_SCUDO = 'edhpldnlalckgoccaoemhnnpccbcfebe'

# il colore del tema LollozzOS (lo scrive la finestra del tema / il Toolbox), se no il viola
function Eclipse-Colore([string]$Hex) {
    if ($Hex -match '^#?([0-9A-Fa-f]{6})$') { return $Matches[1].ToUpper() }
    try { $t = (Get-ItemProperty 'HKCU:\Software\LollozzOS' -Name ThemeColor -ErrorAction Stop).ThemeColor; if ($t -match '^#?([0-9A-Fa-f]{6})$') { return $Matches[1].ToUpper() } } catch {}
    return $script:ECLIPSE_VIOLA
}
function Eclipse-Rgb([string]$h, [double]$f) {
    $r = [Convert]::ToInt32($h.Substring(0, 2), 16); $g = [Convert]::ToInt32($h.Substring(2, 2), 16); $b = [Convert]::ToInt32($h.Substring(4, 2), 16)
    if ($f -le 1) { return @([int]($r * $f), [int]($g * $f), [int]($b * $f)) }
    $t = $f - 1; return @([int]($r + (255 - $r) * $t), [int]($g + (255 - $g) * $t), [int]($b + (255 - $b) * $t))
}
# il tema del browser (barre, schede, barra degli indirizzi) e il colore delle pagine di Eclipse
function Eclipse-ScriviTema([string]$Hex) {
    $h = Eclipse-Colore $Hex
    $dir = Join-Path $script:ECLIPSE_EST 'tema'
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $c = [ordered]@{
        frame = (Eclipse-Rgb $h 0.16); frame_inactive = (Eclipse-Rgb $h 0.12)
        toolbar = (Eclipse-Rgb $h 0.24); tab_text = @(255, 255, 255); tab_background_text = @(189, 183, 208)
        bookmark_text = @(225, 220, 240); ntp_background = @(8, 7, 13); ntp_text = @(241, 237, 250)
        omnibox_background = (Eclipse-Rgb $h 0.10); omnibox_text = @(241, 237, 250)
        toolbar_button_icon = (Eclipse-Rgb $h 1.55); button_background = (Eclipse-Rgb $h 0.30)
    }
    $man = [ordered]@{ manifest_version = 3; name = 'Eclipse - tema'; version = '1.0.' + [int]([DateTimeOffset]::UtcNow.ToUnixTimeSeconds() / 60 % 60000); theme = [ordered]@{ colors = $c } }
    [IO.File]::WriteAllText((Join-Path $dir 'manifest.json'), ($man | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))
    foreach ($e in @('core', 'scudo')) {
        $f = Join-Path $script:ECLIPSE_EST "$e\colore.js"
        if (Test-Path -LiteralPath (Split-Path $f)) {
            [IO.File]::WriteAllText($f, "window.ECLIPSE_COLORE = '#$h';`n", (New-Object System.Text.UTF8Encoding($false)))
        }
    }
    try { [void](Eclipse-ColorePagine $h) } catch {}
    return $h
}
# (11/11) le pagine interne (Impostazioni, Cronologia, Download...) nel colore del tema: dentro resources.pak il
# colore e' scritto come  #RRGGBB/*e*/  (lo mette costruisci/stile_pagine.py); qui si cambiano solo quei 6 caratteri,
# senza spostare niente nel file. Con Eclipse aperto il file e' bloccato: ci riprova l'aggiornamento automatico.
function Eclipse-ColoreAttuale {
    $f = Join-Path $script:ECLIPSE_EST 'core\colore.js'
    if (Test-Path -LiteralPath $f) { $m = [regex]::Match((Get-Content -LiteralPath $f -Raw), '#([0-9A-Fa-f]{6})'); if ($m.Success) { return $m.Groups[1].Value.ToUpper() } }
    return (Eclipse-Colore '')
}
function Eclipse-ColorePagine([string]$Hex) {
    $h = Eclipse-Colore $Hex
    $esito = 'nessun file'
    $l1 = [Text.Encoding]::GetEncoding(28591)
    foreach ($pk in @(Get-ChildItem -LiteralPath $script:ECLIPSE_DIR -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^\d+\.\d+\.\d+\.\d+$' } | ForEach-Object { Join-Path $_.FullName 'resources.pak' } | Where-Object { Test-Path -LiteralPath $_ })) {
        $t = $l1.GetString([IO.File]::ReadAllBytes($pk))
        $re = [regex]'#([0-9A-Fa-f]{6})/\*e\*/'
        $tutti = $re.Matches($t)
        if (-not $tutti.Count) { $esito = 'file senza segni del colore'; continue }
        if (@($tutti | Where-Object { $_.Groups[1].Value.ToUpper() -ne $h }).Count -eq 0) { $esito = "gia' #$h"; continue }
        $nuovo = $re.Replace($t, "#$h/*e*/")
        $tmp = "$pk.nuovo"
        [IO.File]::WriteAllBytes($tmp, $l1.GetBytes($nuovo))
        try { Move-Item -LiteralPath $tmp -Destination $pk -Force -ErrorAction Stop; $esito = "#$h ($($tutti.Count) colori)" }
        catch { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue; $esito = 'Eclipse aperto: si applica alla prossima chiusura' }
    }
    return $esito
}
# i processi di Eclipse (eclipse.exe e, nelle versioni vecchie, chrome.exe) dalla sua cartella
function Eclipse-Processi { @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path -like "$($script:ECLIPSE_DIR)\*" }) }
# da chrome.exe a eclipse.exe: c'e' sempre eclipse.exe; chrome.exe si toglie quando collegamenti e registro puntano al nuovo
function Eclipse-NomeNuovo {
    $vecchio = Join-Path $script:ECLIPSE_DIR 'chrome.exe'
    if (-not (Test-Path -LiteralPath $script:ECLIPSE_EXE) -and (Test-Path -LiteralPath $vecchio)) { Copy-Item -LiteralPath $vecchio -Destination $script:ECLIPSE_EXE -Force }
}
function Eclipse-TogliNomeVecchio {
    $vecchio = Join-Path $script:ECLIPSE_DIR 'chrome.exe'
    if ((Test-Path -LiteralPath $script:ECLIPSE_EXE) -and (Test-Path -LiteralPath $vecchio)) { Remove-Item -LiteralPath $vecchio -Force -ErrorAction SilentlyContinue }
}
# le estensioni caricate a ogni avvio (Eclipse con Scudo dentro, tema, store di Chrome)
function Eclipse-Estensioni {
    @('core', 'tema', 'webstore') | ForEach-Object { Join-Path $script:ECLIPSE_EST $_ } | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'manifest.json') }
}
# (10/11 sera) tolti anche: il processo "di riserva" sempre acceso, le funzioni AI di Chrome (Glic/Gemini, Lens,
# ricerca nella cronologia con AI, organizza schede, "aiutami a scrivere", modelli AI scaricati) e le API pubblicitarie
# del "Privacy Sandbox" (Topics, Protected Audience, Attribution, Shared Storage). Nomi che il browser non conosce: ignorati.
# (11/11) IgnoreSearchProviderOverrides spento: cosi' vale la lista dei motori di ricerca in initial_preferences (Google
# primo = predefinito sui profili nuovi, senza "Gestito dalla tua organizzazione"). Provato da Lollozz su Windows 11.
$script:ECLIPSE_SPENTE = @('MediaRouter', 'BackForwardCache', 'SpareRendererForSitePerProcess',
    'Glic', 'GlicRollout', 'LensOverlay', 'HistoryEmbeddings', 'TabOrganization', 'Compose', 'TextSafetyClassifier',
    'OptimizationGuideOnDeviceModel', 'OnDeviceModelPerformanceParams', 'OptimizationHints', 'AutofillAi',
    'BrowsingTopics', 'InterestGroupStorage', 'Fledge', 'AttributionReportingCrossAppWeb', 'PrivacySandboxAdsAPIsOverride', 'SharedStorageAPI',
    'IgnoreSearchProviderOverrides')
$script:ECLIPSE_LEGGERO = @('--renderer-process-limit=8', ('--disable-features=' + ($script:ECLIPSE_SPENTE -join ',')), '--enable-features=SideBySide')
# file del programma che in Eclipse non servono (studiati il 10/11): segnalazione errori a Windows, notifiche a
# browser chiuso (servirebbe una registrazione che Eclipse non fa), app web con apertura dei file. Solo spazio disco.
$script:ECLIPSE_FILE_INUTILI = @('chrome_wer.dll', 'notification_helper.exe', 'chrome_pwa_launcher.exe')
function Eclipse-Argomenti {
    $est = (@(Eclipse-Estensioni) -join ',')
    # (10/11) meno processi delle pagine (tetto 8) e niente memoria delle pagine per il tasto Indietro: meno RAM
    $a = @(('--user-data-dir="{0}"' -f $script:ECLIPSE_DATI), '--no-default-browser-check') + $script:ECLIPSE_LEGGERO
    if ($est) { $a += ('--load-extension="{0}"' -f $est) }
    return ($a -join ' ')
}

# (11/11) Eclipse registrato in Windows come browser: compare in Impostazioni > App > App predefinite e si puo'
# scegliere per i siti (http/https) e i file .html/.pdf. Il "come aprire" usa %LOCALAPPDATA% (vale per ogni utente
# del PC) con le stesse impostazioni dei collegamenti. Chiamata dall'installazione e da ogni aggiornamento.
$script:ECLIPSE_PROGID = 'EclipseHTML'
$script:ECLIPSE_FILE_WEB = @('.htm', '.html', '.shtml', '.xht', '.xhtml', '.svg', '.webp', '.pdf')
function Eclipse-Chiave([string]$percorso) {
    $hk = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, [Microsoft.Win32.RegistryView]::Registry64)
    $k = $hk.CreateSubKey($percorso); $hk.Close(); return $k
}
function Eclipse-Valore([string]$percorso, [string]$nome, [string]$valore, [string]$tipo = 'String') {
    $k = Eclipse-Chiave $percorso
    try { $k.SetValue($nome, $valore, [Microsoft.Win32.RegistryValueKind]$tipo) } finally { $k.Close() }
}
function Eclipse-RegistraBrowser {
    $exe = $script:ECLIPSE_EXE
    $est = (@(Eclipse-Estensioni) -join ',')
    $a = @('--user-data-dir="%LOCALAPPDATA%\Eclipse\User Data"', '--no-default-browser-check') + $script:ECLIPSE_LEGGERO
    if ($est) { $a += ('--load-extension="{0}"' -f $est) }
    $avvio = ('"{0}" {1}' -f $exe, ($a -join ' '))
    $icona = "$exe,0"
    $p = 'SOFTWARE\Classes\' + $script:ECLIPSE_PROGID
    Eclipse-Valore $p '' 'Eclipse HTML Document'
    Eclipse-Valore $p 'FriendlyTypeName' 'Eclipse HTML Document'
    Eclipse-Valore "$p\Application" 'ApplicationName' 'Eclipse'
    Eclipse-Valore "$p\Application" 'ApplicationDescription' 'Eclipse by LollozzOS'
    Eclipse-Valore "$p\Application" 'ApplicationCompany' 'LollozzOS'
    Eclipse-Valore "$p\Application" 'ApplicationIcon' $icona
    Eclipse-Valore "$p\DefaultIcon" '' $icona
    Eclipse-Valore "$p\shell\open\command" '' ($avvio + ' --single-argument %1') 'ExpandString'
    $c = 'SOFTWARE\Clients\StartMenuInternet\Eclipse'
    Eclipse-Valore $c '' 'Eclipse'
    Eclipse-Valore "$c\DefaultIcon" '' $icona
    Eclipse-Valore "$c\shell\open\command" '' $avvio 'ExpandString'
    Eclipse-Valore "$c\Capabilities" 'ApplicationName' 'Eclipse'
    Eclipse-Valore "$c\Capabilities" 'ApplicationDescription' 'Eclipse by LollozzOS: browser leggero senza pubblicita'''
    Eclipse-Valore "$c\Capabilities" 'ApplicationIcon' $icona
    Eclipse-Valore "$c\Capabilities\StartMenu" 'StartMenuInternet' 'Eclipse'
    foreach ($u in @('http', 'https')) { Eclipse-Valore "$c\Capabilities\URLAssociations" $u $script:ECLIPSE_PROGID }
    foreach ($f in $script:ECLIPSE_FILE_WEB) {
        Eclipse-Valore "$c\Capabilities\FileAssociations" $f $script:ECLIPSE_PROGID
        Eclipse-Valore "SOFTWARE\Classes\$f\OpenWithProgids" $script:ECLIPSE_PROGID ''
    }
    Eclipse-Valore 'SOFTWARE\RegisteredApplications' 'Eclipse' "Software\Clients\StartMenuInternet\Eclipse\Capabilities"
}
function Eclipse-TogliRegistrazione {
    $hk = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, [Microsoft.Win32.RegistryView]::Registry64)
    try {
        foreach ($p in @(('SOFTWARE\Classes\' + $script:ECLIPSE_PROGID), 'SOFTWARE\Clients\StartMenuInternet\Eclipse')) { try { $hk.DeleteSubKeyTree($p, $false) } catch {} }
        foreach ($f in $script:ECLIPSE_FILE_WEB) { $k = $hk.OpenSubKey("SOFTWARE\Classes\$f\OpenWithProgids", $true); if ($k) { try { $k.DeleteValue($script:ECLIPSE_PROGID, $false) } finally { $k.Close() } } }
        $k = $hk.OpenSubKey('SOFTWARE\RegisteredApplications', $true); if ($k) { try { $k.DeleteValue('Eclipse', $false) } finally { $k.Close() } }
    } finally { $hk.Close() }
}

# La regola di Windows per Google come ricerca (prova del 10/11): sui PC non aziendali Windows la fa ignorare,
# quindi non si usa piu'. Questa la toglie (installazione e disinstallazione), con "Gestito dalla tua organizzazione".
$script:ECLIPSE_REG_POL = 'HKLM:\SOFTWARE\Policies\Chromium'
function Eclipse-TogliRicercaGoogle {
    if (-not (Test-Path -LiteralPath $script:ECLIPSE_REG_POL)) { return }
    Remove-Item -LiteralPath (Join-Path $script:ECLIPSE_REG_POL 'DefaultSearchProviderEncodings') -Recurse -Force -ErrorAction SilentlyContinue
    foreach ($n in @('DefaultSearchProviderEnabled', 'DefaultSearchProviderName', 'DefaultSearchProviderKeyword', 'DefaultSearchProviderSearchURL', 'DefaultSearchProviderSuggestURL', 'DefaultSearchProviderIconURL')) {
        Remove-ItemProperty -LiteralPath $script:ECLIPSE_REG_POL -Name $n -Force -ErrorAction SilentlyContinue
    }
    # se la chiave e' rimasta vuota (nessun'altra regola), si toglie: sparisce anche "Gestito dalla tua organizzazione"
    $k = Get-Item -LiteralPath $script:ECLIPSE_REG_POL
    if ($k.ValueCount -eq 0 -and $k.SubKeyCount -eq 0) { Remove-Item -LiteralPath $script:ECLIPSE_REG_POL -Force -ErrorAction SilentlyContinue }
}

# ---- preferiti dagli altri browser (Lollozz 10/11) ----
# L'importazione del browser legge solo il file "classico" dei preferiti: il Chrome di oggi, con l'account Google,
# li tiene in "AccountBookmarks" e l'importazione non li vede. Qui si copiano dal browser che ne ha di piu'
# (Chrome account o classico, Edge, Brave, Opera, Vivaldi: stesso formato). Gli altri browser sono solo letti.
# Lo fa solo se in Eclipse non ci sono preferiti del cliente, con Eclipse chiuso; prima fa una copia di sicurezza.
function Eclipse-ContaUrl($nodo) {
    $n = 0
    if ($nodo -is [System.Collections.IDictionary]) {
        if ($nodo.ContainsKey('type') -and $nodo['type'] -eq 'url' -and -not ($nodo.ContainsKey('url') -and $nodo['url'] -match 'go\.microsoft\.com/fwlink')) { $n++ }
        foreach ($v in $nodo.Values) { $n += Eclipse-ContaUrl $v }
    } elseif ($nodo -is [System.Collections.IEnumerable] -and $nodo -isnot [string]) {
        foreach ($v in $nodo) { $n += Eclipse-ContaUrl $v }
    }
    return $n
}
function Eclipse-LeggiPreferiti([string]$f) {
    if (-not (Test-Path -LiteralPath $f)) { return $null }
    try {
        Add-Type -AssemblyName System.Web.Extensions
        $js = New-Object System.Web.Script.Serialization.JavaScriptSerializer
        $js.MaxJsonLength = [int]::MaxValue; $js.RecursionLimit = 1000
        $d = $js.DeserializeObject([IO.File]::ReadAllText($f))
        if ($d -isnot [System.Collections.IDictionary] -or -not $d.ContainsKey('roots')) { return $null }
        return (Eclipse-ContaUrl $d['roots'])
    } catch { return $null }
}
function Eclipse-PortaPreferiti {
    $dest = Join-Path $script:ECLIPSE_DATI 'Default\Bookmarks'
    $gia = Eclipse-LeggiPreferiti $dest
    if ($gia -gt 0) { return "Eclipse ha gia' $gia preferiti: non tocco niente" }
    $L = $env:LOCALAPPDATA; $R = $env:APPDATA
    $fonti = @(
        @('Chrome (account Google)', "$L\Google\Chrome\User Data\Default\AccountBookmarks"),
        @('Chrome', "$L\Google\Chrome\User Data\Default\Bookmarks"),
        @('Edge', "$L\Microsoft\Edge\User Data\Default\Bookmarks"),
        @('Brave', "$L\BraveSoftware\Brave-Browser\User Data\Default\Bookmarks"),
        @('Opera', "$R\Opera Software\Opera Stable\Default\Bookmarks"),
        @('Opera', "$R\Opera Software\Opera Stable\Bookmarks"),
        @('Opera GX', "$R\Opera Software\Opera GX Stable\Bookmarks"),
        @('Vivaldi', "$L\Vivaldi\User Data\Default\Bookmarks")
    )
    $meglio = $null; $max = 0
    foreach ($x in $fonti) { $n = Eclipse-LeggiPreferiti $x[1]; if ($n -gt $max) { $max = $n; $meglio = $x } }
    if (-not $meglio) { return 'nessun altro browser con preferiti (Firefox: si importano dal benvenuto)' }
    New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
    if (Test-Path -LiteralPath $dest) { Copy-Item -LiteralPath $dest -Destination "$dest.prima-di-eclipse" -Force }
    Copy-Item -LiteralPath $meglio[1] -Destination $dest -Force
    Remove-Item -LiteralPath "$dest.bak" -Force -ErrorAction SilentlyContinue
    return "$max preferiti da $($meglio[0])"
}

# ---- video protetti: Netflix, Spotify, Prime Video (Lollozz 10/11, idea da Brave/Chrome) ----
# Serve il "Widevine" di Google. Non lo mettiamo noi nel pacchetto (non si puo' ridistribuire): lo scarica qui
# dal server dei componenti di Google, lo stesso che usano Chrome e Firefox, e lo mette dove il browser lo cerca.
# Limite: Netflix su browser "non ufficiali" a volte rifiuta lo stesso o da' qualita' ridotta.
function Eclipse-Widevine {
    $dir = Join-Path $script:ECLIPSE_DATI 'WidevineCdm'
    $gia = @(Get-ChildItem -LiteralPath $dir -Directory -ErrorAction SilentlyContinue | Where-Object { Test-Path (Join-Path $_.FullName '_platform_specific\win_x64\widevinecdm.dll') })
    if ($gia.Count) { return "gia' presente ($($gia[0].Name))" }
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $pv = '157.0.0.0'; try { $pv = (Get-Item -LiteralPath $script:ECLIPSE_EXE).VersionInfo.ProductVersion } catch {}
    $req = [ordered]@{ request = [ordered]@{
        '@os' = 'win'; '@updater' = 'chromium'; acceptformat = 'crx3'; protocol = '3.1'
        app = @([ordered]@{ appid = 'oimompecagnajdejgnnjijobebaeigek'; updatecheck = @{}; version = '0.0.0.0' })
        arch = 'x64'; nacl_arch = 'x86-64'; prodversion = $pv; updaterversion = $pv; wow64 = $false
        os = [ordered]@{ platform = 'Windows'; arch = 'x86_64'; version = [Environment]::OSVersion.Version.ToString() }
        requestid = [guid]::NewGuid().ToString('B'); sessionid = [guid]::NewGuid().ToString('B') } }
    $body = $req | ConvertTo-Json -Depth 8 -Compress
    $r = Invoke-WebRequest -Uri 'https://update.googleapis.com/service/update2/json' -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 40
    $j = ($r.Content -replace "^\)\]\}'\s*", '') | ConvertFrom-Json
    $uc = @($j.response.app)[0].updatecheck
    if ($uc.status -ne 'ok') { throw "Google non ha dato il componente ($($uc.status))" }
    $ver = $uc.manifest.version
    $nome = @($uc.manifest.packages.package)[0].name
    $base = @(@($uc.urls.url) | ForEach-Object { $_.codebase } | Where-Object { $_ -like 'https://*' })[0]
    if (-not $ver -or -not $nome -or -not $base) { throw 'risposta di Google non chiara' }
    $crx = Join-Path $env:TEMP "eclipse_widevine_$ver.crx"
    Invoke-WebRequest -Uri ($base + $nome) -OutFile $crx -UseBasicParsing -TimeoutSec 180
    # un .crx e' uno zip con un'intestazione davanti: si toglie e si apre
    $b = [IO.File]::ReadAllBytes($crx); $i = -1
    for ($k = 0; $k -lt [Math]::Min($b.Length - 4, 65536); $k++) { if ($b[$k] -eq 0x50 -and $b[$k + 1] -eq 0x4B -and $b[$k + 2] -eq 3 -and $b[$k + 3] -eq 4) { $i = $k; break } }
    if ($i -lt 0) { throw 'file di Google non valido' }
    $zip = "$crx.zip"; [IO.File]::WriteAllBytes($zip, $b[$i..($b.Length - 1)])
    $dest = Join-Path $dir $ver
    if (Test-Path -LiteralPath $dest) { Remove-Item -LiteralPath $dest -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Expand-Archive -LiteralPath $zip -DestinationPath $dest -Force
    Remove-Item -LiteralPath $zip, $crx -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path (Join-Path $dest '_platform_specific\win_x64\widevinecdm.dll'))) { throw 'nel componente manca il file per Windows a 64 bit' }
    return "versione $ver"
}
