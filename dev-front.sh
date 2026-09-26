#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/app"

[ -d node_modules ] || npm install
RPC_URL="https://devnet.helius-rpc.com/?api-key=$1" VITE_RPC_URL=/rpc VITE_CLUSTER=devnet npm run dev
