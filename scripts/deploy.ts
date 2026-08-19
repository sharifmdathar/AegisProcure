/**
 * Aegis Procure — Preprod Deployment Reference
 *
 * Run:  npx tsx scripts/deploy.ts
 *
 * This prints all config needed to deploy via the Midnight example-counter
 * pattern: https://github.com/midnightntwrk/example-counter
 *
 * Compatible SDK versions (midnight-sdk COMPATIBILITY.md, 2026-04-07):
 *   @midnight-ntwrk/midnight-js-*  4.0.4
 *   @midnight-ntwrk/ledger-v8      8.0.3
 */

// No SDK imports — midnight-js-network-id and friends require
// @midnight-ntwrk/ledger as a peer dep which must be installed
// as part of the full wallet SDK setup (see example-counter).

const PREPROD_CONFIG = {
  networkId: "testnet",
  nodeRpc: "https://rpc.preprod.midnight.network",
  indexerUrl: "https://indexer.preprod.midnight.network/api/v1/graphql",
  indexerWsUrl: "wss://indexer.preprod.midnight.network/api/v1/graphql",
  proofServerUrl: "https://lace-proof-pub.preprod.midnight.network",
  faucetUrl: "https://faucet.preprod.midnight.network",
  explorerUrl: "https://explorer.preprod.midnight.network",
} as const;

const WALLET_ADDRESS = process.env.WALLET_ADDRESS ?? "(set WALLET_ADDRESS env var)";

const INITIAL_PRIVATE_STATE = {
  lowestBid: "0n",
  lowestBidder: "0".repeat(64),
};

function main() {
  console.log("");
  console.log("🔒 Aegis Procure — Preprod Deployment Config");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
  console.log("📡 Preprod endpoints:");
  console.log(`   Node RPC:     ${PREPROD_CONFIG.nodeRpc}`);
  console.log(`   Indexer:      ${PREPROD_CONFIG.indexerUrl}`);
  console.log(`   Indexer WS:   ${PREPROD_CONFIG.indexerWsUrl}`);
  console.log(`   Proof Server: ${PREPROD_CONFIG.proofServerUrl}`);
  console.log(`   Explorer:     ${PREPROD_CONFIG.explorerUrl}`);
  console.log(`   Faucet:       ${PREPROD_CONFIG.faucetUrl}`);
  console.log("");
  console.log("💼 Wallet:");
  console.log(`   Address: ${WALLET_ADDRESS}`);
  console.log("");
  console.log("🧩 Initial private state:");
  console.log(`   lowestBid:    ${INITIAL_PRIVATE_STATE.lowestBid}`);
  console.log(`   lowestBidder: ${INITIAL_PRIVATE_STATE.lowestBidder}`);
  console.log("");
  console.log("📦 Compatible SDK versions:");
  console.log("   @midnight-ntwrk/midnight-js-*  4.0.4");
  console.log("   @midnight-ntwrk/ledger-v8      8.0.3");
  console.log("   Compact toolchain              0.31.1");
  console.log("");
  console.log("🚀 Deployment steps:");
  console.log("   1. npm run compact:build");
  console.log("      → ZK circuits compiled to /managed");
  console.log("");
  console.log("   2. Get tDUST:");
  console.log(`      ${PREPROD_CONFIG.faucetUrl}`);
  console.log("");
  console.log("   3. Clone the official deployment example:");
  console.log("      git clone https://github.com/midnightntwrk/example-counter");
  console.log("      cd example-counter && npm install");
  console.log("");
  console.log("   4. Swap in the Aegis contract artifacts from /managed");
  console.log("      and use the initial private state shown above.");
  console.log("");
  console.log("   5. After deployment, update:");
  console.log("      README.md  → Contract Address table");
  console.log("      .env.local → NEXT_PUBLIC_CONTRACT_ADDRESS=<address>");
  console.log("");
  console.log("🔍 After deployment, verify at:");
  console.log(`   ${PREPROD_CONFIG.explorerUrl}`);
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
}

main();
