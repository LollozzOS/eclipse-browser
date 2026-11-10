@echo off
rem Eclipse by LollozzOS - porta in Eclipse i preferiti del vecchio browser (Chrome anche con account Google, Edge, Brave, Opera, Vivaldi)
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "script\Porta-Preferiti.ps1"
echo.
pause
