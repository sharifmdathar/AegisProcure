/**
 * Client-side wiring between the browser, the Lace wallet extension and the
 * deployed Aegis auction contract on Midnight.
 *
 * Everything in this module runs in the browser only — pages import it from
 * "use client" components. Server-side reads live in auction-reads.ts.
 *
 * Flow overview:
 *   1. detectConnector()   — find window.midnight.* (Lace) with API v1.x
 *   2. connectLace()       — enable() → wallet API + service URIs + keys
 *   3. buildProviders()    — midnight-js providers bridged to Lace:
 *        · proofProvider      → Lace's local proof server (serviceUriConfig)
 *        · walletProvider     → Lace balanceAndProveTransaction (signing)
 *        · midnightProvider   → Lace submitTransaction
 *        · publicDataProvider → Midnight indexer (GraphQL + WS)
 *        · privateStateProvider → encrypted IndexedDB (per account)
 *   4. joinAuctionContract() — findDeployedContract against the deployed addr
 */
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import {
  findDeployedContract,
  type FoundContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import {
  asContractAddress,
  type MidnightProviders,
  type PrivateStateId,
} from "@midnight-ntwrk/midnight-js-types";
import type {
  DAppConnectorAPI,
  DAppConnectorWalletAPI,
  ServiceUriConfig,
} from "@midnight-ntwrk/dapp-connector-api";
import {
  NetworkId as ZswapNetworkId,
  Transaction as ZswapTransaction,
} from "@midnight-ntwrk/zswap";
import { Transaction as LedgerTransaction } from "@midnight-ntwrk/ledger-v8";
import { whenLedgerReady } from "../shims/ledger-v8.browser.mjs";
import { ACTIVE_CONTRACT_ADDRESS, INDEXER_URL, INDEXER_WS_URL, MIDNIGHT_NETWORK } from "./contract";
import { Contract, type Ledger } from "../../managed/contract/index.js";

/** Private state stored per bidder, encrypted in IndexedDB. */
export interface AegisPrivateState {
  /** Lowest bid this user has revealed (0 = none). */
  lowestBid: bigint;
  /** Winner key accumulated so far (32 zero bytes = none). */
  lowestBidder: Uint8Array;
  /** Bid amount awaiting reveal. */
  pendingBidAmount: bigint;
  /** Salt for the pending bid. */
  pendingBidSalt: Uint8Array;
}

export const AEGIS_PRIVATE_STATE_ID: PrivateStateId = "aegisPrivateState";

export function freshPrivateState(): AegisPrivateState {
  return {
    lowestBid: 0n,
    lowestBidder: new Uint8Array(32),
    pendingBidAmount: 0n,
    pendingBidSalt: new Uint8Array(32),
  };
}

/**
 * Circuit witnesses. Values marked private in the Compact source are supplied
 * here at proof-generation time and never appear on the ledger.
 *
 * currentBlock(): the contract compares its deadline against block height, but
 * the UI stores deadlines as unix seconds; this witness reports wall-clock
 * seconds so both sides share units. NOTE: a prover can claim any time here —
 * acceptable for this demo, not for production auctions.
 */
const witnesses = {
  bidAmount: (
    context: WitnessContext<Ledger, AegisPrivateState>,
  ): [AegisPrivateState, bigint] => [context.privateState, context.privateState.pendingBidAmount],
  bidSalt: (
    context: WitnessContext<Ledger, AegisPrivateState>,
  ): [AegisPrivateState, Uint8Array] => [context.privateState, context.privateState.pendingBidSalt],
  lowestBid: (
    context: WitnessContext<Ledger, AegisPrivateState>,
  ): [AegisPrivateState, bigint] => [context.privateState, context.privateState.lowestBid],
  lowestBidder: (
    context: WitnessContext<Ledger, AegisPrivateState>,
  ): [AegisPrivateState, { bytes: Uint8Array }] => [
    context.privateState,
    { bytes: context.privateState.lowestBidder },
  ],
  currentBlock: (
    context: WitnessContext<Ledger, AegisPrivateState>,
  ): [AegisPrivateState, bigint] => [
    context.privateState,
    BigInt(Math.floor(Date.now() / 1000)),
  ],
};

/** Binding of the compiled Compact contract used to execute circuits locally. */
export const aegisCompiledContract = CompiledContract.make("aegis", Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets("/managed"),
);

export type AegisProviders = MidnightProviders<
  "createAuction" | "commitBid" | "revealBid" | "finalizeAuction",
  typeof AEGIS_PRIVATE_STATE_ID,
  AegisPrivateState
>;

export interface LaceSession {
  connectorName: string;
  wallet: DAppConnectorWalletAPI;
  uris: ServiceUriConfig;
  /** bech32 wallet address for display. */
  address: string;
  /** Hex coin public key — the bidder identity used on-chain. */
  coinPublicKey: string;
  encryptionPublicKey: string;
}

// Connector spec versions the app supports. The dapp-connector-api has moved
// past 1.x (current Lace ships 4.x); gate by major version with semver-style
// semantics rather than a brittle string prefix so wallet upgrades don't
// silently fail detection.
const SUPPORTED_CONNECTOR_MAJORS = new Set([1, 2, 3, 4, 5]);

function connectorMajor(apiVersion: string): number | null {
  const major = Number.parseInt(String(apiVersion).split(".")[0], 10);
  return Number.isFinite(major) ? major : null;
}

function pickConnector(): DAppConnectorAPI | undefined {
  if (typeof window === "undefined") return undefined;
  const win = window as any;
  const registry = win.midnight;
  if (!registry || typeof registry !== "object") return undefined;

  for (const key of Object.keys(registry)) {
    const candidate = registry[key];
    if (candidate && typeof candidate === "object") {
      // Lace uses enable(), 1AM uses connect()
      if (typeof candidate.enable === "function") {
        return candidate as DAppConnectorAPI;
      }
      if (typeof candidate.connect === "function") {
        return new Proxy(candidate, {
          get(target, prop, receiver) {
            if (prop === "enable") return target.connect.bind(target);
            return Reflect.get(target, prop, receiver);
          }
        }) as DAppConnectorAPI;
      }
    }
  }

  if (typeof registry.enable === "function" || typeof registry.connect === "function") {
    return registry as DAppConnectorAPI;
  }

  return undefined;
}

async function waitForConnector(timeoutMs = 10000): Promise<DAppConnectorAPI> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const found = pickConnector();
    if (found) return found;
    if (Date.now() >= deadline) {
      throw new Error(
        `Could not find Midnight wallet (Lace / 1AM). Make sure the extension is enabled in this window and refresh.`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

import { bech32m } from "bech32";

/** Detects a Midnight wallet (Lace/1AM) and requests account access. */
export async function connectLace(): Promise<LaceSession> {
  const connector = await waitForConnector();
  const rawWallet = await connector.enable();
  
  // Wrap 1AM to look like Lace if 'state' is missing
  let wallet = rawWallet;
  let uris;
  
  if (typeof wallet.state !== "function") {
    // 1AM Wallet logic
    const shield = await (wallet as any).getShieldedAddresses();
    const unshield = await (wallet as any).getUnshieldedAddress();
    const conf = await (wallet as any).getConfiguration();
    
    uris = {
      proverServerUri: conf.proverServerUri,
      indexerWsUri: conf.indexerWsUri,
      indexerUri: conf.indexerUri ?? "",
      substrateNodeUri: conf.substrateNodeUri ?? "",
    };
    
    // Normalize Bech32m keys to hex for compatibility with the Midnight SDK
    const decodeHex = (str: string) => {
      if (str.startsWith("mn_shield")) {
        const decoded = bech32m.decode(str, 150);
        const buf = Buffer.from(bech32m.fromWords(decoded.words));
        return buf.toString("hex");
      }
      return str; // If already hex
    };

    wallet = {
      state: async () => ({
        address: unshield.unshieldedAddress,
        coinPublicKey: decodeHex(shield.shieldedCoinPublicKey),
        encryptionPublicKey: decodeHex(shield.shieldedEncryptionPublicKey),
      }),
      // The tx coming in from compact-js is already proved (UnboundTransaction = Transaction<Sig,Proof,PreBinding>)
      // Use balanceSealedTransaction (proved+sealed) not balanceUnsealedTransaction (unproved)
      balanceAndProveTransaction: async (tx: any, newCoins: any) => {
        try {
          return await (rawWallet as any).balanceSealedTransaction(tx);
        } catch {
          // fallback for wallets that don't distinguish sealed/unsealed
          return await (rawWallet as any).balanceUnsealedTransaction(tx);
        }
      },
      submitTransaction: (tx: any) => (rawWallet as any).submitTransaction(tx),
    } as any;
  } else {
    uris = typeof connector.serviceUriConfig === "function"
      ? await connector.serviceUriConfig()
      : {
          proverServerUri: "http://127.0.0.1:6300",
          indexerUri: "",
          indexerWsUri: "",
          substrateNodeUri: "",
        };
  }

  const state = await wallet.state();

  setNetworkId(MIDNIGHT_NETWORK);
  return {
    connectorName: connector.name || "Midnight Wallet",
    wallet,
    uris,
    address: state.address,
    coinPublicKey: state.coinPublicKey,
    encryptionPublicKey: state.encryptionPublicKey,
  };
}

function zswapNetworkId(network: string): ZswapNetworkId {
  switch (network) {
    case "mainnet":
      return ZswapNetworkId.MainNet;
    case "preview":
    case "preprod":
      return ZswapNetworkId.TestNet;
    default:
      return ZswapNetworkId.Undeployed;
  }
}

/**
 * Builds the midnight-js provider set for a connected Lace session.
 *
 * The private-state password only obfuscates browser-local IndexedDB data
 * (bid amounts/salts between commit and reveal); the wallet remains the sole
 * guardian of funds.
 */
export async function buildProviders(session: LaceSession): Promise<AegisProviders> {
  setNetworkId(MIDNIGHT_NETWORK);

  // Ensure the ledger WASM is fully instantiated before any Transaction calls.
  await whenLedgerReady();

  // Imported lazily: the level package probes for a native build at require
  // time, which must never happen while Next.js SSR-evaluates this module.
  const { levelPrivateStateProvider } = await import(
    "@midnight-ntwrk/midnight-js-level-private-state-provider"
  );

  const privateStateProvider = levelPrivateStateProvider<
    typeof AEGIS_PRIVATE_STATE_ID,
    AegisPrivateState
  >({
    privateStoragePasswordProvider: () => "aegis-local-PrivateState#2026",
    accountId: session.coinPublicKey,
  });
  privateStateProvider.setContractAddress(asContractAddress(ACTIVE_CONTRACT_ADDRESS));

  // ZK artifacts are served statically from /managed (see scripts/sync-zk-assets.mjs).
  const zkBase = new URL("/managed", window.location.origin).toString();
  const zkConfigProvider = new FetchZkConfigProvider<
    "createAuction" | "commitBid" | "revealBid" | "finalizeAuction"
  >(zkBase, window.fetch.bind(window));

  const proofProvider = httpClientProofProvider(session.uris.proverServerUri, zkConfigProvider);
  const publicDataProvider = indexerPublicDataProvider(INDEXER_URL, session.uris.indexerWsUri ?? INDEXER_WS_URL);

  const netId = zswapNetworkId(MIDNIGHT_NETWORK);

  const providers: AegisProviders = {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider,
    proofProvider,
    walletProvider: {
      getCoinPublicKey: () => session.coinPublicKey,
      getEncryptionPublicKey: () => session.encryptionPublicKey,
      balanceTx: async (tx) => {
        let forWallet: any = tx;
        try {
          // For Lace: expects ZswapTransaction
          const rawUnbound = tx.serialize();
          forWallet = ZswapTransaction.deserialize(rawUnbound, netId);
        } catch {
          // Keep raw tx if conversion not needed
        }

        const balanced = await session.wallet.balanceAndProveTransaction(forWallet, []);
        
        // Handle both Uint8Array / serialized return and object return
        if (balanced instanceof Uint8Array) {
          return LedgerTransaction.deserialize("signature", "proof", "binding", balanced);
        }
        if (typeof balanced?.serialize === "function") {
          try {
            const bytes = balanced.serialize(netId);
            return LedgerTransaction.deserialize("signature", "proof", "binding", bytes);
          } catch {
            const bytes = (balanced as any).serialize(netId as any);
            return LedgerTransaction.deserialize("signature", "proof", "binding", bytes);
          }
        }
        return balanced as any;
      },
    },
    midnightProvider: {
      submitTx: async (tx) => {
        // Try both formats for Lace / 1AM
        let submissionTarget: any = tx;
        try {
          submissionTarget = ZswapTransaction.deserialize(tx.serialize(), netId);
        } catch {
          submissionTarget = tx;
        }

        try {
          await session.wallet.submitTransaction(submissionTarget);
        } catch (e: any) {
          // Fallback to submitting raw tx if zswap wrapper was rejected
          if (submissionTarget !== tx) {
            await session.wallet.submitTransaction(tx as any);
          } else {
            throw e;
          }
        }

        const identifiers = tx.identifiers();
        if (identifiers.length === 0) throw new Error("Transaction produced no identifiers");
        return identifiers[0];
      },
    },
  };

  return providers;
}

export type AegisFoundContract = FoundContract<InstanceType<typeof Contract>>;

/**
 * Joins the already-deployed auction contract, restoring this account's
 * private state if we have seen it before (needed across reloads so bids can
 * be revealed after the deadline without re-entering the salt).
 */
export async function joinAuctionContract(
  providers: AegisProviders,
): Promise<AegisFoundContract> {
  const hasStoredState =
    (await providers.privateStateProvider.get(AEGIS_PRIVATE_STATE_ID)) !== null;

  return findDeployedContract(providers, {
    compiledContract: aegisCompiledContract,
    contractAddress: asContractAddress(ACTIVE_CONTRACT_ADDRESS),
    ...(hasStoredState
      ? { privateStateId: AEGIS_PRIVATE_STATE_ID }
      : {
          privateStateId: AEGIS_PRIVATE_STATE_ID,
          initialPrivateState: freshPrivateState(),
        }),
  });
}

/** Convenience: connect → providers → deployed contract handle. */
export async function openAuctionSession(): Promise<{
  session: LaceSession;
  providers: AegisProviders;
  found: AegisFoundContract;
}> {
  const session = await connectLace();
  const providers = await buildProviders(session);
  const found = await joinAuctionContract(providers);
  return { session, providers, found };
}
