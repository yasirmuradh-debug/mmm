#!/bin/bash
# Jarvis setup + launch for macOS / Linux. Double-click (Mac) or run: ./start-jarvis.command
cd "$(dirname "$0")" || exit 1

echo ""
echo "  ==========================================="
echo "     J A R V I S  -  Desktop Assistant"
echo "  ==========================================="
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "  [X] Node.js is not installed."
  echo "      Install it from https://nodejs.org (the LTS button), then run again."
  read -n 1 -s -r -p "  Press any key to close..."
  exit 1
fi

if [ ! -d "node_modules/electron/dist" ]; then
  echo "  [1/3] Installing dependencies (first time only - a few minutes)..."
  npm install || { echo "  [X] Install failed."; read -n 1 -s -r -p "  Press any key..."; exit 1; }

  echo "  [2/3] Finishing Electron setup..."
  npm approve-scripts electron  >/dev/null 2>&1
  npm approve-scripts puppeteer >/dev/null 2>&1
  node node_modules/electron/install.js

  echo "  [optional] Preparing WhatsApp support..."
  [ -f node_modules/puppeteer/install.mjs ] && node node_modules/puppeteer/install.mjs >/dev/null 2>&1
fi

echo "  [3/3] Starting Jarvis..."
npm start
