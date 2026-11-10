@echo off
rem Eclipse by LollozzOS - installa il prototipo (chiede l'amministratore)
net session >nul 2>&1 || (powershell -NoProfile -Command "Start-Process -Verb RunAs -FilePath '%~f0'" & exit /b)
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "script\Installa-Eclipse.ps1"
echo.
pause
