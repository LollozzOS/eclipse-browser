@echo off
rem Eclipse by LollozzOS - installa, controlla tutto e fa la prova RAM; scrive Verifica-Eclipse.txt sul desktop
net session >nul 2>&1 || (powershell -NoProfile -Command "Start-Process -Verb RunAs -FilePath '%~f0'" & exit /b)
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "script\Verifica-Eclipse.ps1"
echo.
pause
