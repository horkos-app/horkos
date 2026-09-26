#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

[ -f ~/.config/solana/id.json ] || solana-keygen new --no-bip39-passphrase --silent -o ~/.config/solana/id.json

BALANCE=$(solana balance -u devnet | cut -d' ' -f1)
if awk "BEGIN{exit !($BALANCE < 3)}"; then
  solana airdrop 2 -u devnet || echo "airdrop failed, fund $(solana address) at https://faucet.solana.com"
  exit
fi

anchor build
solana program deploy -u devnet --program-id target/deploy/horkos-keypair.json target/deploy/horkos.so

cd app
[ -d node_modules ] || npm install
VITE_RPC_URL=https://api.devnet.solana.com VITE_CLUSTER=devnet npm run dev
