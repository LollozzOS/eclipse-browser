# Eclipse by LollozzOS - porta in Eclipse i preferiti dell'altro browser (chiude solo Eclipse, gli altri browser li legge e basta)
$qui = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $qui 'Eclipse-Comune.ps1')
Get-Process -Name chrome -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$script:ECLIPSE_DIR\*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
try { Write-Host ('  [ok] ' + (Eclipse-PortaPreferiti)) -ForegroundColor Green } catch { Write-Host ('  [!] ' + $_.Exception.Message) -ForegroundColor Yellow }
