@echo off
title VinTrace - React Dashboard
echo ==============================================
echo       INICIANDO DASHBOARD VINTRACE (Porta 5173)
echo ==============================================
cd /d "%~dp0\dashboard\frontend"

echo.
echo Dashboard abrindo no navegador...
echo http://localhost:5173
echo.
npm.cmd run dev
pause
