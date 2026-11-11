# ============================================================================
#  Eclipse by LollozzOS - prova RAM e CPU: Chrome contro Eclipse, stesse schede
#  Apre ogni browser con un profilo NUOVO e vuoto (i tuoi dati non si toccano), le stesse 10 schede,
#  e misura la RAM vera (come Gestione attivita': "memoria privata") e la CPU in tre momenti:
#    A) 1 minuto dopo l'apertura   B) dopo N minuti senza toccare niente   (schede in pausa)
#  Alla fine scrive la tabella sul desktop (Prova-Eclipse.txt).
#  Uso:  powershell -ExecutionPolicy Bypass -File .\Misura-RAM.ps1 [-Minuti 10]
#  Durante la prova NON usare il PC (niente giochi, niente altri programmi pesanti).
# ============================================================================
param([int]$Minuti = 10, [switch]$Rapida, [switch]$Automatico, [string]$Uscita)
# -Rapida (Lollozz 10/11, poco tempo): circa 3 minuti in tutto. Misura a 50 secondi e a 1 minuto e 20 dall'apertura.
# Limite: in cosi' poco tempo le schede non fanno in tempo ad andare in pausa, quindi si vede solo la differenza
# "di base" (browser piu' leggero + pubblicita' bloccate), non quella delle schede in pausa.
if ($Rapida) { $att1 = 40; $cpuS = 10; $att2 = 20; $et1 = '50 s'; $et2 = '1 min 20 s' }
else { $att1 = 60; $cpuS = 30; $att2 = $Minuti * 60; $et1 = '1 min'; $et2 = "$Minuti min" }
$ErrorActionPreference = 'Stop'
$qui = Split-Path -Parent $MyInvocation.MyCommand.Path
$eclComune = Join-Path $qui 'Eclipse-Comune.ps1'; if (-not (Test-Path $eclComune)) { $eclComune = Join-Path (Join-Path $env:ProgramFiles 'Eclipse') 'Eclipse-Comune.ps1' }
. $eclComune

$schede = @('https://www.youtube.com', 'https://www.twitch.tv/directory', 'https://mail.google.com', 'https://www.repubblica.it',
    'https://www.gazzetta.it', 'https://www.amazon.it', 'https://www.reddit.com/r/pcgaming', 'https://it.wikipedia.org/wiki/Videogioco',
    'https://www.ilmeteo.it', 'https://www.corriere.it')
$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not (Test-Path $script:ECLIPSE_EXE)) { throw 'Eclipse non e'' installato: lancia prima Installa-Eclipse.ps1' }

# RAM privata (in MB) e tempo di CPU di tutti i processi di quel browser
function Misura([string]$exe) {
    $pids = @(Get-CimInstance Win32_Process -Filter "Name='chrome.exe' OR Name='eclipse.exe'" | Where-Object { $_.ExecutablePath -ieq $exe } | ForEach-Object { [int]$_.ProcessId })
    if (-not $pids.Count) { return $null }
    $perf = @(Get-CimInstance Win32_PerfRawData_PerfProc_Process | Where-Object { $pids -contains [int]$_.IDProcess })
    $ram = ($perf | Measure-Object -Property WorkingSetPrivate -Sum).Sum / 1MB
    $cpu = 0; foreach ($p in $pids) { try { $cpu += (Get-Process -Id $p -ErrorAction Stop).TotalProcessorTime.TotalSeconds } catch {} }
    return [pscustomobject]@{ ram = [math]::Round($ram); cpu = $cpu; processi = $pids.Count }
}
function Prova([string]$nome, [string]$exe, [string[]]$extra) {
    $dati = Join-Path $env:TEMP ("prova_" + $nome + "_" + [guid]::NewGuid().ToString('N').Substring(0, 6))
    if ($nome -eq 'Eclipse') {
        # lo stesso stato di serie che mette l'installatore (schede in pausa)
        New-Item -ItemType Directory -Force -Path $dati | Out-Null
        '{"performance_tuning":{"high_efficiency_mode":{"state":2,"aggressiveness":2}}}' | Set-Content -LiteralPath (Join-Path $dati 'Local State') -Encoding ASCII
    }
    $a = @(('--user-data-dir="{0}"' -f $dati), '--no-first-run', '--no-default-browser-check') + $extra + $schede
    Write-Host "  $nome`: apro le 10 schede..." -ForegroundColor Cyan
    $p = Start-Process -FilePath $exe -ArgumentList $a -PassThru
    Start-Sleep -Seconds $att1
    $m1 = Misura $exe; $c0 = $m1.cpu; Start-Sleep -Seconds $cpuS; $m1b = Misura $exe
    $cpu1 = [math]::Round(($m1b.cpu - $c0) / $cpuS / [Environment]::ProcessorCount * 100, 1)
    Write-Host ("    dopo $et1`: {0} MB, CPU {1}%" -f $m1b.ram, $cpu1)
    Write-Host "    aspetto senza toccare niente..."
    Start-Sleep -Seconds $att2
    $m2 = Misura $exe; $c0 = $m2.cpu; Start-Sleep -Seconds $cpuS; $m2b = Misura $exe
    $tipi = @{}; $flag = ''
    foreach ($pr in @(Get-CimInstance Win32_Process -Filter "Name='chrome.exe' OR Name='eclipse.exe'" | Where-Object { $_.ExecutablePath -ieq $exe -and $_.CommandLine -like "*$dati*" })) {
        $t = if ($pr.CommandLine -match '--type=([\w-]+)') { $Matches[1] } else { 'browser'; $flag = $pr.CommandLine }
        if ($pr.CommandLine -like '*--extension-process*') { $t += '(estensione)' }
        $tipi[$t] = 1 + [int]$tipi[$t]
    }
    $script:Processi[$nome] = (($tipi.GetEnumerator() | Sort-Object Name | ForEach-Object { "$($_.Name)=$($_.Value)" }) -join ', ')
    $script:Avvio[$nome] = $flag
    $cpu2 = [math]::Round(($m2b.cpu - $c0) / $cpuS / [Environment]::ProcessorCount * 100, 1)
    Write-Host ("    dopo $et2`: {0} MB, CPU {1}%" -f $m2b.ram, $cpu2)
    Get-CimInstance Win32_Process -Filter "Name='chrome.exe' OR Name='eclipse.exe'" | Where-Object { $_.ExecutablePath -ieq $exe -and $_.CommandLine -like "*$dati*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 3; Remove-Item -LiteralPath $dati -Recurse -Force -ErrorAction SilentlyContinue
    return [pscustomobject]@{ nome = $nome; ram1 = $m1b.ram; cpu1 = $cpu1; ram2 = $m2b.ram; cpu2 = $cpu2 }
}
Write-Host "  Prova RAM e CPU: chiudi Chrome ed Eclipse prima di cominciare. Ci vogliono circa $([math]::Ceiling(($att1 + $att2 + 2 * $cpuS + 5) * 2 / 60)) minuti." -ForegroundColor Magenta
if (-not $Automatico) { Read-Host '  Premi Invio per cominciare' }
foreach ($e in @($chrome, $script:ECLIPSE_EXE)) { if ($e -and @(Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.Path -ieq $e }).Count) { throw "Chiudi prima $e" } }
$ris = @(); $script:Processi = @{}; $script:Avvio = @{}
if ($chrome) { $ris += Prova 'Chrome' $chrome @() } else { Write-Host '  [i] Chrome non c''e'': misuro solo Eclipse' -ForegroundColor Yellow }
$est = (@(Eclipse-Estensioni) -join ',')
$ris += Prova 'Eclipse' $script:ECLIPSE_EXE ($script:ECLIPSE_LEGGERO + @(('--load-extension="{0}"' -f $est)))
$righe = @('Prova Eclipse by LollozzOS - ' + (Get-Date -Format 'dd/MM/yyyy HH:mm'), "Stesse 10 schede, profili nuovi, misure a $et1 e a $et2 dall'apertura", '',
    ('{0,-10} {1,16} {2,10} {3,22} {4,10}' -f 'Browser', "RAM dopo $et1", 'CPU', "RAM dopo $et2", 'CPU'))
foreach ($r in $ris) { $righe += ('{0,-10} {1,13} MB {2,9}% {3,19} MB {4,9}%' -f $r.nome, $r.ram1, $r.cpu1, $r.ram2, $r.cpu2) }
if ($ris.Count -eq 2) {
    $d1 = $ris[0].ram1 - $ris[1].ram1; $d2 = $ris[0].ram2 - $ris[1].ram2
    $righe += ''; $righe += ('Eclipse usa {0} MB in meno dopo {5} ({1}%) e {2} MB in meno dopo {3} ({4}%)' -f $d1, [math]::Round($d1 / [math]::Max(1, $ris[0].ram1) * 100), $d2, $et2, [math]::Round($d2 / [math]::Max(1, $ris[0].ram2) * 100), $et1)
}
$righe += ''; foreach ($k in $script:Processi.Keys) { $righe += "Processi $k`: $($script:Processi[$k])" }
foreach ($k in $script:Avvio.Keys) { if ($script:Avvio[$k]) { $righe += "Avvio $k`: $($script:Avvio[$k] -replace '\s--', ([Environment]::NewLine + '   --'))" } }
$out = if ($Uscita) { $Uscita } else { Join-Path ([Environment]::GetFolderPath('Desktop')) 'Prova-Eclipse.txt' }
$righe | Set-Content -LiteralPath $out -Encoding UTF8
Write-Host ''; $righe | ForEach-Object { Write-Host "  $_" }
Write-Host "`n  Risultato salvato in $out" -ForegroundColor Green
