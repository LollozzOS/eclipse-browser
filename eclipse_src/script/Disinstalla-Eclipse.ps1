# Eclipse by LollozzOS - disinstallazione. I tuoi dati di Eclipse (preferiti, password) restano in
# %LOCALAPPDATA%\Eclipse finche' non li cancelli tu; Chrome non viene toccato.
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) { Start-Process powershell.exe -Verb RunAs -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"{0}"' -f $PSCommandPath)); exit }
$dir = Join-Path $env:ProgramFiles 'Eclipse'
Get-Process -Name chrome -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$dir\*" } | Stop-Process -Force -ErrorAction SilentlyContinue
foreach ($lnk in @((Join-Path ([Environment]::GetFolderPath('CommonDesktopDirectory')) 'Eclipse.lnk'), (Join-Path ([Environment]::GetFolderPath('CommonPrograms')) 'Eclipse.lnk'))) { Remove-Item -LiteralPath $lnk -Force -ErrorAction SilentlyContinue }
Remove-Item -LiteralPath 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Eclipse by LollozzOS' -Recurse -Force -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName 'Eclipse Aggiornamenti' -TaskPath '\LollozzOS\' -Confirm:$false -ErrorAction SilentlyContinue
# la regola di Google come ricerca (e con lei "Gestito dalla tua organizzazione")
$com = Join-Path $dir 'Eclipse-Comune.ps1'
if (Test-Path -LiteralPath $com) { . $com; Eclipse-TogliRicercaGoogle }
Set-Location $env:SystemRoot
Remove-Item -LiteralPath $dir -Recurse -Force -ErrorAction SilentlyContinue
if (Test-Path -LiteralPath $dir) { Start-Process cmd.exe -ArgumentList ('/c ping 127.0.0.1 -n 4 >nul & rmdir /s /q "{0}"' -f $dir) -WindowStyle Hidden }
Write-Host 'Eclipse disinstallato. I tuoi dati restano in' (Join-Path $env:LOCALAPPDATA 'Eclipse')
