#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/app"

[ -d node_modules ] || npm install
VITE_RPC_URL=https://api.devnet.solana.com VITE_CLUSTER=devnet npm run dev
