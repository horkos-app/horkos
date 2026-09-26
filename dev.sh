#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

mkdir -p .anchor
[ -f ~/.config/solana/id.json ] || solana-keygen new --no-bip39-passphrase --silent -o ~/.config/solana/id.json

solana-test-validator --reset --quiet --ledger .anchor/test-ledger &
VALIDATOR=$!
trap 'kill $VALIDATOR 2>/dev/null' EXIT

until solana cluster-version -u localhost >/dev/null 2>&1; do sleep 0.5; done

anchor build
anchor deploy --provider.cluster localnet

cd app
[ -d node_modules ] || npm install
npm run dev
