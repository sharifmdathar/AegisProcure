#!/usr/bin/env bash
set -euo pipefail

# Aegis Procure — Preprod deployment helper
# Run from repo root: bash scripts/deploy-preprod.sh
# NOTE: You must have your shielded WALLET_ADDRESS exported and faucet tNight funded.

ROOT="/home/ball/repos/midnight"
cd "$ROOT"

echo "==> 1/5 Building Aegis managed artifacts"
npm run compact:build
git add managed
git commit -m "build(contract): compile aegis zk circuits for preprod" || echo "nothing to commit for artifacts"

echo "==> 2/5 Swapping artifacts into example-counter scaffold"
rm -rf example-counter/contract/src/managed/counter
mkdir -p example-counter/contract/src/managed/counter
cp -R managed/* example-counter/contract/src/managed/counter/
git add example-counter/contract/src/managed/counter example-counter/counter-cli/src/config.ts
git commit -m "chore(deploy): swap example scaffold to aegis managed artifacts"

echo "==> 3/5 Installing example-counter dependencies"
cd example-counter
npm install
cd "$ROOT"

echo "==> 4/5 Ready to deploy. Ensure WALLET_ADDRESS is exported:"
echo "    export WALLET_ADDRESS=<your shielded preprod address>"
echo "    Then run: cd example-counter/counter-cli && npm run preprod-ps"
echo "    Initial private state -> lowestBid: 0n  lowestBidder: (64 hex zeros)"

echo "==> 5/5 After you get the deployed contract address, tell the assistant the address"
echo "    so README, docs/USAGE.md, .env.local and the Postman Preprod environment can be updated."
