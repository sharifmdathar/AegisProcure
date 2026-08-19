/**
 * Aegis Procure — Preprod Deployment Guide
 *
 * This script documents the deployment steps for Midnight Preprod.
 * Full programmatic deployment requires the complete Midnight wallet SDK
 * which must be set up separately (see README below).
 *
 * Quick reference — Preprod endpoints (from midnight-sdk compatibility matrix):
 *   Node RPC:      https://rpc.preprod.midnight.network
 *   Indexer:       https://indexer.preprod.midnight.network/api/v1/graphql
 *   Proof Server:  https://lace-proof-pub.preprod.midnight.network
 *   Faucet:        https://faucet.preprod.midnight.network
 *   Explorer:      https://explorer.preprod.midnight.network
 *
 * Compatible SDK versions (midnight-sdk COMPATIBILITY.md, updated 2026-04-07):
 *   @midnight-ntwrk/midnight-js-*  4.0.4
 *   @midnight-ntwrk/ledger-v8      8.0.3
 *   Proof Server                   8.0.3
 *   Indexer                        4.0.0
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEPLOYMENT STEPS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. COMPILE THE CONTRACT
 *    npm run compact:build
 *    → ZK circuits output to /managed
 *
 * 2. FUND YOUR WALLET
 *    Get tDUST from the Preprod faucet:
 *    https://faucet.preprod.midnight.network
 *
 * 3. FOLLOW THE OFFICIAL EXAMPLE
 *    The Midnight team maintains a reference deployment example:
 *    https://github.com/midnightntwrk/example-counter
 *
 *    Clone it, study the deployment pattern, then adapt it for aegis.compact:
 *      git clone https://github.com/midnightntwrk/example-counter
 *      cd example-counter && npm install && npm run deploy
 *
 * 4. ADAPT FOR AEGIS PROCURE
 *    Replace the counter contract with the aegis contract artifacts from /managed.
 *    The initial private state for Aegis Procure is:
 *      { lowestBid: 0n, lowestBidder: "0".repeat(64) }
 *
 * 5. UPDATE CONFIG AFTER DEPLOYMENT
 *    Once you have the contract address, update:
 *      - README.md  → Contract Address table
 *      - .env.local → NEXT_PUBLIC_CONTRACT_ADDRESS=<address>
 */

import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

// Preprod network configuration
export const PREPROD_CONFIG = {
  networkId: "testnet" as const,
  nodeRpc: "https://rpc.preprod.midnight.network",
  indexerUrl: "https://indexer.preprod.midnight.network/api/v1/graphql",
  indexerWsUrl: "wss://indexer.preprod.midnight.network/api/v1/graphql",
  proofServerUrl: "https://lace-proof-pub.preprod.midnight.network",
  faucetUrl: "https://faucet.preprod.midnight.network",
  explorerUrl: "https://explorer.preprod.midnight.network",
} as const;

// Initial private state for the Aegis Procure contract
export const INITIAL_PRIVATE_STATE = {
  lowestBid: 0n,
  lowestBidder: "0".repeat(64),
} as const;

async function main() {
  setNetworkId(PREPROD_CONFIG.networkId);

  console.log("🔒 Aegis Procure — Preprod Deployment");
  console.log("======================================");
  console.log("");
  console.log("Preprod endpoints:");
  console.log(`  Node RPC:     ${PREPROD_CONFIG.nodeRpc}`);
  console.log(`  Indexer:      ${PREPROD_CONFIG.indexerUrl}`);
  console.log(`  Proof Server: ${PREPROD_CONFIG.proofServerUrl}`);
  console.log(`  Faucet:       ${PREPROD_CONFIG.faucetUrl}`);
  console.log(`  Explorer:     ${PREPROD_CONFIG.explorerUrl}`);
  console.log("");
  console.log("SDK versions (midnight-sdk compatibility matrix 2026-04-07):");
  console.log("  @midnight-ntwrk/midnight-js-*  4.0.4");
  console.log("  @midnight-ntwrk/ledger-v8      8.0.3");
  console.log("");
  console.log("To deploy:");
  console.log("  1. npm run compact:build");
  console.log("  2. Fund wallet at: https://faucet.preprod.midnight.network");
  console.log("  3. Follow: https://github.com/midnightntwrk/example-counter");
  console.log("  4. Adapt with /managed artifacts and INITIAL_PRIVATE_STATE above");
}

main().catch(console.error);
