@echo off
title Delizukar - Reiniciar Servidores
echo ======================================================
echo   Deteniendo todos los procesos de Node.js...
echo ======================================================
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak >nul

echo.
echo ======================================================
echo   Iniciando Servidores Delizukar...
echo ======================================================
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:3000
echo ======================================================
echo.

start "Delizukar - Backend (5000)" cmd /k "cd /d %~dp0 && node server.js"
timeout /t 2 /nobreak >nul
start "Delizukar - Frontend (3000)" cmd /k "cd /d %~dp0 && npm start"

echo Servidores reiniciados correctamente en ventanas independientes.
