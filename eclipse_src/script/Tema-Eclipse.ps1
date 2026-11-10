# Eclipse by LollozzOS - rimette il tema nel colore di LollozzOS (lo usa anche il Toolbox quando cambia colore)
param([string]$Hex)
$qui = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $qui 'Eclipse-Comune.ps1')
$h = Eclipse-ScriviTema $Hex
Write-Host "Tema di Eclipse nel colore #$h (si vede alla prossima apertura di Eclipse)"
