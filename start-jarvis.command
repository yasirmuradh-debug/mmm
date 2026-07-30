#!/bin/bash
# Jarvis launcher for macOS / Linux. Double-click (Mac) or run: ./start-jarvis.command
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

if [ ! -d "node_modules/express" ]; then
  echo "  Installing dependencies (first time only - a couple of minutes)..."
  npm install || { echo "  [X] Install failed."; read -n 1 -s -r -p "  Press any key..."; exit 1; }
fi

echo "  Starting Jarvis... a browser tab will open at http://localhost:4321"
echo "  (Keep this window open. Close it to stop Jarvis.)"
echo ""
node server.js
