#!/usr/bin/env bash
cd "$(dirname "$0")"

echo "======================================================"
echo "  Green Roof AI — Starting Decoupled Frontend & Backend"
echo "======================================================"

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed."
    exit 1
fi

echo "Starting Full-Stack services..."
node start-dev.js
