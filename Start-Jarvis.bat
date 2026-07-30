@echo off
setlocal
cd /d "%~dp0"
title Jarvis
color 0b

echo(
echo   ===========================================
echo      J A R V I S  -  Desktop Assistant
echo   ===========================================
echo(

REM --- Make sure Node.js is installed ---
where node >nul 2>nul
if errorlevel 1 (
  echo   [X] Node.js is not installed on this PC.
  echo(
  echo   1^) Go to https://nodejs.org
  echo   2^) Click the big "LTS" button, install it, then restart the PC
  echo   3^) Double-click this file again
  echo(
  pause
  exit /b 1
)

REM --- Install dependencies the first time (no Electron needed anymore) ---
if not exist "node_modules\express" (
  echo   Installing dependencies (first time only - a couple of minutes)...
  echo(
  call npm install
  echo(
)

echo   Starting Jarvis...  a browser tab will open at http://localhost:4321
echo   ^(Keep this window open. Close it to stop Jarvis.^)
echo(
node server.js

echo(
echo   Jarvis has stopped. You can close this window.
pause >nul
