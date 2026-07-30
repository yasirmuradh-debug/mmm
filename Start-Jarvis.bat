@echo off
setlocal
cd /d "%~dp0"
title Jarvis - Setup and Launch
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

REM --- If Electron is already set up, skip straight to launching ---
if exist "node_modules\electron\dist\electron.exe" goto launch

echo   [1/3] Installing dependencies (first time only - a few minutes)...
echo(
call npm install
if errorlevel 1 (
  echo(
  echo   [X] Install failed. Check your internet connection and try again.
  pause
  exit /b 1
)

echo(
echo   [2/3] Finishing Electron setup...
REM Newer Node/npm blocks package setup scripts; approve and run them directly.
call npm approve-scripts electron  >nul 2>nul
call npm approve-scripts puppeteer >nul 2>nul
node node_modules\electron\install.js
if not exist "node_modules\electron\dist\electron.exe" (
  echo(
  echo   [X] Electron could not be downloaded. Check your internet and re-run.
  pause
  exit /b 1
)

echo(
echo   [optional] Preparing WhatsApp support (safe to skip if it fails)...
if exist "node_modules\puppeteer\install.mjs" node node_modules\puppeteer\install.mjs >nul 2>nul

:launch
echo(
echo   [3/3] Starting Jarvis...  (closing the Jarvis window brings you back here)
echo(
call npm start

echo(
echo   Jarvis has closed. You can close this window.
pause >nul
