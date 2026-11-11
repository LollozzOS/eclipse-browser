# ============================================================================
#  Eclipse by LollozzOS - installazione (prototipo)
#  Copia Eclipse in Programmi, mette il tema nel colore di LollozzOS, mette Eclipse Scudo (il nostro blocco
#  pubblicita'), Google come ricerca, scarica il pezzo per lo store di Chrome dal sito ufficiale (GitHub), crea i
#  collegamenti e la voce in App installate. Non tocca Chrome ne' i tuoi dati di Chrome.
#  Uso (amministratore):  powershell -ExecutionPolicy Bypass -File .\Installa-Eclipse.ps1 [-Hex 6A00FF]
# ============================================================================
#requires -RunAsAdministrator
param([string]$Hex)
$ErrorActionPreference = 'Stop'
$qui = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $qui 'Eclipse-Comune.ps1')
$sorg = Join-Path (Split-Path -Parent $qui) 'Eclipse'
if (-not (Test-Path -LiteralPath (Join-Path $sorg 'chrome.exe'))) { throw "Manca la cartella Eclipse accanto a script\ ($sorg)" }
$avvisi = @()

Write-Host '  Eclipse by LollozzOS - installazione' -ForegroundColor Magenta
Get-Process -Name chrome -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$script:ECLIPSE_DIR\*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# 1) il programma
New-Item -ItemType Directory -Force -Path $script:ECLIPSE_DIR | Out-Null
& robocopy.exe $sorg $script:ECLIPSE_DIR /E /NFL /NDL /NJH /NJS /NP /R:1 /W:1 | Out-Null
if ($LASTEXITCODE -ge 8) { throw 'Copia di Eclipse non riuscita' }
New-Item -ItemType Directory -Force -Path $script:ECLIPSE_EST | Out-Null
foreach ($e in @('core')) {
    & robocopy.exe (Join-Path (Split-Path -Parent $qui) $e) (Join-Path $script:ECLIPSE_EST $e) /MIR /NFL /NDL /NJH /NJS /NP /R:1 /W:1 | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Copia di $e non riuscita" }
}
# pezzi delle prove precedenti: uBlock Origin Lite (ora c'e' Scudo) e Scudo separato (ora e' dentro Eclipse)
foreach ($v in @('ubol', 'scudo')) {
    $vecchio = Join-Path $script:ECLIPSE_EST $v
    if (Test-Path -LiteralPath $vecchio) { Remove-Item -LiteralPath $vecchio -Recurse -Force -ErrorAction SilentlyContinue }
}
# file del programma che non servono (anche se c'erano da un'installazione precedente)
foreach ($f in $script:ECLIPSE_FILE_INUTILI) {
    Get-ChildItem -LiteralPath $script:ECLIPSE_DIR -Recurse -Filter $f -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
}
Copy-Item -LiteralPath (Join-Path $qui 'Eclipse-Comune.ps1'), (Join-Path $qui 'Tema-Eclipse.ps1'), (Join-Path $qui 'Disinstalla-Eclipse.ps1'), (Join-Path $qui 'Aggiorna-Eclipse.ps1') -Destination $script:ECLIPSE_DIR -Force
$vt = Join-Path (Split-Path -Parent $qui) 'versione.txt'
if (Test-Path -LiteralPath $vt) { Copy-Item -LiteralPath $vt -Destination $script:ECLIPSE_DIR -Force }
Write-Host '  [ok] programma in' $script:ECLIPSE_DIR

# 2) il tema nel colore di LollozzOS
$h = Eclipse-ScriviTema $Hex
Write-Host "  [ok] tema nel colore #$h"

# 3) store di Chrome: dal sito ufficiale, se non riesce si va avanti senza
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
function Scarica-Ultima([string]$repo, [string]$filtro) {
    $r = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/latest" -Headers @{ 'User-Agent' = 'Eclipse-LollozzOS' } -TimeoutSec 30
    $a = @($r.assets | Where-Object { $_.name -match $filtro }) | Select-Object -First 1
    if (-not $a) { throw "nessun file '$filtro' nell'ultima versione di $repo" }
    $f = Join-Path $env:TEMP ('eclipse_' + $a.name)
    Invoke-WebRequest -Uri $a.browser_download_url -OutFile $f -UseBasicParsing -TimeoutSec 120
    return @($f, $r.tag_name)
}
# un .crx e' uno zip con un'intestazione davanti: si toglie e si apre
function Apri-Pacchetto([string]$f, [string]$dest) {
    if (Test-Path -LiteralPath $dest) { Remove-Item -LiteralPath $dest -Recurse -Force }
    $b = [IO.File]::ReadAllBytes($f); $i = 0
    for ($k = 0; $k -lt [Math]::Min($b.Length - 4, 65536); $k++) { if ($b[$k] -eq 0x50 -and $b[$k + 1] -eq 0x4B -and $b[$k + 2] -eq 3 -and $b[$k + 3] -eq 4) { $i = $k; break } }
    $z = "$f.zip"; [IO.File]::WriteAllBytes($z, $b[$i..($b.Length - 1)])
    Expand-Archive -LiteralPath $z -DestinationPath $dest -Force
    # a volte dentro c'e' una cartella sola: il manifest deve stare in cima
    if (-not (Test-Path (Join-Path $dest 'manifest.json'))) {
        $m = Get-ChildItem -LiteralPath $dest -Recurse -Filter manifest.json | Select-Object -First 1
        if ($m) { Get-ChildItem -LiteralPath $m.DirectoryName -Force | Move-Item -Destination $dest -Force }
    }
    Remove-Item -LiteralPath $z, $f -Force -ErrorAction SilentlyContinue
}
Write-Host '  [ok] Eclipse Scudo (blocco pubblicita'' e traccianti, YouTube e Twitch)'
try {
    $x = Scarica-Ultima 'NeverDecaf/chromium-web-store' '\.crx$'
    Apri-Pacchetto $x[0] (Join-Path $script:ECLIPSE_EST 'webstore'); Write-Host "  [ok] store di Chrome ($($x[1]))"
} catch { $avvisi += "pezzo per lo store di Chrome non scaricato: $($_.Exception.Message)" }

# 4) le impostazioni leggere di serie (solo la prima volta: dopo comanda il cliente)
New-Item -ItemType Directory -Force -Path $script:ECLIPSE_DATI | Out-Null
$ls = Join-Path $script:ECLIPSE_DATI 'Local State'
if (-not (Test-Path -LiteralPath $ls)) {
    # schede in pausa (risparmio memoria) accese, nella misura "massima"
    $stato = [ordered]@{ performance_tuning = [ordered]@{ high_efficiency_mode = [ordered]@{ state = 2; aggressiveness = 2 } } }
    [IO.File]::WriteAllText($ls, ($stato | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))
}

# Google come ricerca: lo sceglie il cliente con un clic nel benvenuto (Windows non permette di imporlo sui PC
# non aziendali). Si toglie la regola della prova precedente, se c'e'.
try { Eclipse-TogliRicercaGoogle } catch {}

# video protetti (Netflix, Spotify, Prime Video): il componente Widevine dal server di Google
try { Write-Host ('  [ok] video protetti: ' + (Eclipse-Widevine)) } catch { $avvisi += "video protetti (Netflix/Spotify) non attivati: $($_.Exception.Message)" }

# i preferiti dal browser che il cliente usava (anche quelli salvati sull'account Google di Chrome)
try { Write-Host ('  [ok] preferiti: ' + (Eclipse-PortaPreferiti)) } catch { $avvisi += "preferiti non portati: $($_.Exception.Message)" }

# 5) collegamenti (desktop e Start) e voce in App installate
$arg = Eclipse-Argomenti
$sh = New-Object -ComObject WScript.Shell
foreach ($lnk in @((Join-Path ([Environment]::GetFolderPath('CommonDesktopDirectory')) 'Eclipse.lnk'), (Join-Path ([Environment]::GetFolderPath('CommonPrograms')) 'Eclipse.lnk'))) {
    $l = $sh.CreateShortcut($lnk); $l.TargetPath = $script:ECLIPSE_EXE; $l.Arguments = $arg; $l.WorkingDirectory = $script:ECLIPSE_DIR
    $l.IconLocation = "$script:ECLIPSE_EXE,0"; $l.Description = 'Eclipse by LollozzOS'; $l.Save()
}
$u = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Eclipse by LollozzOS'
New-Item -Path $u -Force | Out-Null
$ver = (Get-Item -LiteralPath $script:ECLIPSE_EXE).VersionInfo.ProductVersion
foreach ($v in @(@('DisplayName', 'Eclipse by LollozzOS'), @('DisplayVersion', $ver), @('Publisher', 'LollozzOS'), @('DisplayIcon', "$script:ECLIPSE_EXE,0"),
        @('InstallLocation', $script:ECLIPSE_DIR), @('UninstallString', ('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "{0}"' -f (Join-Path $script:ECLIPSE_DIR 'Disinstalla-Eclipse.ps1'))))) {
    New-ItemProperty -LiteralPath $u -Name $v[0] -Value $v[1] -PropertyType String -Force | Out-Null
}
New-ItemProperty -LiteralPath $u -Name 'NoModify' -Value 1 -PropertyType DWord -Force | Out-Null
Write-Host '  [ok] collegamenti sul desktop e in Start, voce in App installate'
# Eclipse tra i browser di Windows (App predefinite). Il predefinito lo sceglie il cliente o il Playbook.
try { Eclipse-RegistraBrowser; Write-Host '  [ok] registrato in Windows come browser' } catch { $avvisi += "registrazione come browser non riuscita: $($_.Exception.Message)" }

# 6) aggiornamenti automatici: un controllo al giorno (e 10 minuti dopo l'accensione), come SYSTEM, in silenzio
try {
    $az = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}"' -f (Join-Path $script:ECLIPSE_DIR 'Aggiorna-Eclipse.ps1'))
    $t1 = New-ScheduledTaskTrigger -Daily -At ([datetime]::Today.AddHours(13).AddMinutes((Get-Random -Maximum 120)))
    $t2 = New-ScheduledTaskTrigger -AtStartup; $t2.Delay = 'PT10M'
    $im = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 1) -RunOnlyIfNetworkAvailable
    Register-ScheduledTask -TaskName 'Eclipse Aggiornamenti' -TaskPath '\LollozzOS\' -Action $az -Trigger @($t1, $t2) -Settings $im -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
    Write-Host '  [ok] aggiornamenti automatici (un controllo al giorno)'
} catch { $avvisi += "aggiornamenti automatici non attivati: $($_.Exception.Message)" }
foreach ($a in $avvisi) { Write-Host "  [!] $a" -ForegroundColor Yellow }
Write-Host ''
Write-Host '  Fatto. Apri Eclipse dal collegamento sul desktop.' -ForegroundColor Green
