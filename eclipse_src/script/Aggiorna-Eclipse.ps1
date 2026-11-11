# ============================================================================
#  Eclipse by LollozzOS - aggiornamento automatico (attivita' pianificata, come SYSTEM, una volta al giorno)
#  1) legge l'ultima versione pubblicata su GitHub (LollozzOS/eclipse-browser, Releases), in collegamento sicuro
#  2) se e' piu' nuova di quella installata e Eclipse e' chiuso: scarica, controlla l'impronta del pacchetto,
#     sostituisce SOLO il programma e l'estensione Eclipse (il colore del tema resta). Profilo, preferiti e
#     password del cliente non vengono toccati. Se Eclipse e' aperto riprova la volta dopo.
#  Diario: C:\ProgramData\LollozzOS\Eclipse\aggiornamenti.log
# ============================================================================
param([switch]$Forza)
$ErrorActionPreference = 'Stop'
$REPO = 'LollozzOS/eclipse-browser'
$dir = Join-Path $env:ProgramFiles 'Eclipse'
$log = Join-Path $env:ProgramData 'LollozzOS\Eclipse\aggiornamenti.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
function Diario([string]$t) { Add-Content -LiteralPath $log -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm') + '  ' + $t) -Encoding UTF8 }
if ((Test-Path $log) -and (Get-Item $log).Length -gt 200KB) { Remove-Item $log -Force }
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$tmp = Join-Path $env:TEMP 'eclipse_aggiorna'
try {
    if (-not ((Test-Path -LiteralPath (Join-Path $dir 'eclipse.exe')) -or (Test-Path -LiteralPath (Join-Path $dir 'chrome.exe')))) { Diario 'Eclipse non installato: niente da fare'; exit 0 }
    $installato = 0
    $vf = Join-Path $dir 'versione.txt'
    if (Test-Path $vf) { $n = ((Get-Content -LiteralPath $vf -Raw).Trim() -split '\.')[-1]; [int]::TryParse($n, [ref]$installato) | Out-Null }
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    $base = "https://github.com/$REPO/releases/latest/download"
    $jf = Join-Path $tmp 'versione.json'
    Invoke-WebRequest -Uri "$base/versione.json" -OutFile $jf -UseBasicParsing -TimeoutSec 60
    $v = Get-Content -LiteralPath $jf -Raw | ConvertFrom-Json
    if (-not $Forza -and [int]$v.numero -le $installato) {
        # (11/11) le pagine interne nel colore del tema, se l'ultima volta Eclipse era aperto
        if (-not @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path -like "$dir\*" }).Count) {
            try { . (Join-Path $dir 'Eclipse-Comune.ps1'); if (Get-Command Eclipse-ColorePagine -ErrorAction SilentlyContinue) { $c = Eclipse-ColorePagine (Eclipse-ColoreAttuale); if ($c -notmatch '^gia|^nessun') { Diario "colore delle pagine: $c" } } } catch {}
        }
        Diario "gia' aggiornato ($($v.versione))"; exit 0
    }
    $aperto = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path -like "$dir\*" })
    if ($aperto.Count) { Diario "nuova versione $($v.versione) pronta, ma Eclipse e' aperto: riprovo piu' tardi"; exit 0 }
    Diario "scarico $($v.versione) ($([math]::Round($v.dimensione / 1MB)) MB)"
    $zf = Join-Path $tmp $v.file
    Invoke-WebRequest -Uri "https://github.com/$REPO/releases/download/$($v.tag)/$($v.file)" -OutFile $zf -UseBasicParsing -TimeoutSec 1800
    if ((Get-FileHash -LiteralPath $zf -Algorithm SHA256).Hash -ne $v.sha256.ToUpper()) { Diario 'IMPRONTA DEL PACCHETTO DIVERSA: aggiornamento ignorato'; exit 1 }
    $ex = Join-Path $tmp 'x'; if (Test-Path $ex) { Remove-Item $ex -Recurse -Force }
    Expand-Archive -LiteralPath $zf -DestinationPath $ex -Force
    $p = Join-Path $ex 'Eclipse by LollozzOS'
    if (-not ((Test-Path (Join-Path $p 'Eclipse\eclipse.exe')) -or (Test-Path (Join-Path $p 'Eclipse\chrome.exe')))) { throw 'pacchetto incompleto' }
    # ancora chiuso? (puo' essere stato aperto mentre scaricava)
    if (@(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path -like "$dir\*" }).Count) { Diario "Eclipse aperto durante lo scaricamento: riprovo piu' tardi"; exit 0 }
    # il programma: cartelle delle versioni vecchie via, nuova dentro
    $nuova = (Get-ChildItem -LiteralPath (Join-Path $p 'Eclipse') -Directory | Where-Object { $_.Name -match '^\d+\.\d+\.\d+\.\d+$' } | Select-Object -First 1).Name
    & robocopy.exe (Join-Path $p 'Eclipse') $dir /E /NFL /NDL /NJH /NJS /NP /R:2 /W:2 | Out-Null
    if ($LASTEXITCODE -ge 8) { throw 'copia del programma non riuscita' }
    Get-ChildItem -LiteralPath $dir -Directory | Where-Object { $_.Name -match '^\d+\.\d+\.\d+\.\d+$' -and $_.Name -ne $nuova } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    # l'estensione Eclipse (tiene il colore del tema del cliente)
    $core = Join-Path $dir 'Estensioni\core'
    & robocopy.exe (Join-Path $p 'core') $core /MIR /XF colore.js /NFL /NDL /NJH /NJS /NP /R:2 /W:2 | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "copia dell'estensione non riuscita" }
    # gli script (e questo stesso, per la prossima volta)
    Copy-Item -Path (Join-Path $p 'script\*.ps1') -Destination $dir -Force
    Copy-Item -LiteralPath (Join-Path $p 'versione.txt') -Destination $dir -Force
    # i collegamenti (desktop e Start): stesse impostazioni di avvio della versione nuova, la cartella del profilo resta quella
    . (Join-Path $dir 'Eclipse-Comune.ps1')
    Eclipse-NomeNuovo
    $sh = New-Object -ComObject WScript.Shell
    foreach ($lnk in @((Join-Path ([Environment]::GetFolderPath('CommonDesktopDirectory')) 'Eclipse.lnk'), (Join-Path ([Environment]::GetFolderPath('CommonPrograms')) 'Eclipse.lnk'))) {
        if (-not (Test-Path -LiteralPath $lnk)) { continue }
        $l = $sh.CreateShortcut($lnk)
        if ($l.Arguments -match '(--user-data-dir="[^"]+")') {
            $est = (@(Eclipse-Estensioni) -join ',')
            $l.Arguments = (@($Matches[1], '--no-default-browser-check') + $script:ECLIPSE_LEGGERO + @(('--load-extension="{0}"' -f $est))) -join ' '
            $l.TargetPath = $script:ECLIPSE_EXE; $l.IconLocation = "$($script:ECLIPSE_EXE),0"
            $l.Save()
        }
    }
    # le pagine interne nel colore del tema del cliente (la versione nuova arriva col viola di serie)
    try { Diario ('colore delle pagine: ' + (Eclipse-ColorePagine (Eclipse-ColoreAttuale))) } catch { Diario ('colore delle pagine: ' + $_.Exception.Message) }
    # la registrazione come browser, con le impostazioni di avvio della versione nuova
    try { Eclipse-RegistraBrowser } catch { Diario ('registrazione come browser: ' + $_.Exception.Message) }
    $u = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Eclipse by LollozzOS'
    if (Test-Path $u) { Set-ItemProperty -LiteralPath $u -Name DisplayVersion -Value $v.versione; Set-ItemProperty -LiteralPath $u -Name DisplayIcon -Value "$($script:ECLIPSE_EXE),0" }
    Eclipse-TogliNomeVecchio
    Diario "AGGIORNATO a $($v.versione) (Chromium $($v.chromium))"
} catch {
    Diario ('errore: ' + $_.Exception.Message)
} finally {
    Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
