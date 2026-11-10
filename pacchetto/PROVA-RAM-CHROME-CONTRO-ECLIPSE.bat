@echo off
rem Eclipse by LollozzOS - prova RAM e CPU, Chrome contro Eclipse (installa prima Eclipse)
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "script\Misura-RAM.ps1" -Rapida
echo.
pause
