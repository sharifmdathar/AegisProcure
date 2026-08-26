/**
 * High-level write operations for the Aegis auction contract.
 *
 * Every function takes an {@link AuctionSession} (Lace-connected, contract
 * joined). Circuit arguments mirror managed/contract/index.d.ts:
 *
 *   createAuction(org: Bytes<32>, dl: Uint<64>)
 *   commitBid(commitment: Bytes<32>)
 *   revealBid()                  — bidAmount/bidSalt are private witnesses
 *   finalizeAuction()            — lowestBid/lowestBidder are private witnesses
 */
import {
  CompactTypeBytes,
  CompactTypeVector,
  convertFieldToBytes,
  persistentHash,
} from "@midnight-ntwrk/compact-runtime";
import type { FinalizedTxData } from "@midnight-ntwrk/midnight-js-types";
import { hexToBytes } from "./auction-hex";
export { hexToBytes };
import {
  freshPrivateState,
  openAuctionSession,
  type AegisFoundContract,
  type AegisPrivateState,
  type AegisProviders,
  type LaceSession,
} from "./midnight-setup";
import { ACTIVE_CONTRACT_ADDRESS } from "./contract";

export interface AuctionSession {
  session: LaceSession;
  providers: AegisProviders;
  found: AegisFoundContract;
}

interface LocalBidMeta {
  role?: "organizer" | "bidder";
  deadlineSeconds?: number;
  amount?: string;
  revealedAmount?: string;
  saltHex?: string;
  commitmentHex?: string;
  txId?: string;
  bidderKeyHex?: string;
}

const META_KEY = `aegis:meta:${ACTIVE_CONTRACT_ADDRESS}`;

function persistLocalBidMeta(session: LaceSession, patch: LocalBidMeta): void {
  try {
    const prev = readLocalBidMeta() ?? {};
    const next = { ...prev, ...patch, bidderKeyHex: normalizePk(session.coinPublicKey) };
    window.localStorage.setItem(META_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode) — reveal inputs fall back to manual entry.
  }
}

function readLocalBidMeta(): LocalBidMeta | null {
  try {
    const raw = window.localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as LocalBidMeta) : null;
  } catch {
    return null;
  }
}

function normalizePk(pk: string): string {
  return pk.startsWith("0x") ? pk.slice(2) : pk;
}

/** Connects Lace, builds providers and joins the deployed auction contract. */
export async function openSession(): Promise<AuctionSession> {
  const { session, providers, found } = await openAuctionSession();
  return { session, providers, found };
}

/**
 * Client-side replica of the circuit's commitment derivation so the same hash
 * is committed publicly in commitBid and later verified inside revealBid:
 *
 *   amountBytes = convertFieldToBytes(32, amount)
 *   commitment  = persistentHash<Vector<2, Bytes<32>>>([amountBytes, salt])
 */
export function computeCommitment(amount: bigint, salt: Uint8Array): Uint8Array {
  if (salt.length !== 32) throw new Error("Salt must be exactly 32 bytes");
  const amountBytes = convertFieldToBytes(32, amount, "aegis bid amount");
  return persistentHash(new CompactTypeVector(2, new CompactTypeBytes(32)), [
    amountBytes,
    salt,
  ]);
}

export function randomSalt(): Uint8Array {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Writes a bid amount + salt into this account's encrypted private state so
 * the reveal witnesses can read them — used right after commit and when a
 * bidder restores their bid in a different browser session.
 */
export async function setPendingBidWitness(
  { providers }: AuctionSession,
  amount: bigint,
  saltHex: string,
): Promise<void> {
  const salt = hexToBytes(saltHex.replace(/^0x/, ""));
  if (salt.length !== 32) throw new Error("Salt must be 64 hex characters (32 bytes)");
  const current =
    (await providers.privateStateProvider.get("aegisPrivateState")) ?? freshPrivateState();
  await providers.privateStateProvider.set("aegisPrivateState", {
    ...current,
    pendingBidAmount: amount,
    pendingBidSalt: salt,
  });
}

/** Records the successfully revealed amount locally (used by finalize). */
export function markBidRevealed(amount: bigint): void {
  try {
    const prev = readLocalBidMeta() ?? {};
    window.localStorage.setItem(
      META_KEY,
      JSON.stringify({ ...prev, revealedAmount: amount.toString() }),
    );
  } catch {
    // Non-fatal: finalize will require an explicit winning price instead.
  }
}



export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function requireCoinPublicKey(session: LaceSession): Uint8Array {
  const pk = session.coinPublicKey.startsWith("0x")
    ? session.coinPublicKey.slice(2)
    : session.coinPublicKey;
  if (pk.length !== 64) throw new Error(`Unexpected coin public key length: ${pk.length}`);
  return hexToBytes(pk);
}

/** Organizer: opens the auction with a wall-clock deadline (unix seconds). */
export async function submitCreateAuction(
  { session, found }: AuctionSession,
  deadlineSeconds: number,
): Promise<FinalizedTxData> {
  if (!Number.isFinite(deadlineSeconds) || deadlineSeconds * 1000 <= Date.now()) {
    throw new Error("Deadline must be in the future");
  }
  const organizer = { bytes: requireCoinPublicKey(session) };
  const txData = await found.callTx.createAuction(organizer, BigInt(Math.floor(deadlineSeconds)));
  // Remember the organizer's own key so finalize can restore winner state.
  persistLocalBidMeta(session, {
    role: "organizer",
    deadlineSeconds,
  });
  return txData.public;
}

/** Bidder: publishes only the commitment; amount+salt stay local. */
export async function submitCommitBid(
  { providers, session, found }: AuctionSession,
  amount: bigint,
): Promise<{ txData: FinalizedTxData; saltHex: string; commitmentHex: string }> {
  if (amount <= 0n) throw new Error("Bid amount must be positive");

  const salt = randomSalt();
  const commitment = computeCommitment(amount, salt);

  // Seed the private state the witnesses will read during reveal.
  const current =
    (await providers.privateStateProvider.get("aegisPrivateState")) ?? freshPrivateState();
  const next: AegisPrivateState = {
    ...current,
    pendingBidAmount: amount,
    pendingBidSalt: salt,
  };
  await providers.privateStateProvider.set("aegisPrivateState", next);

  const txData = await found.callTx.commitBid(commitment);

  const saltHex = toHex(salt);
  persistLocalBidMeta(session, {
    role: "bidder",
    amount: amount.toString(),
    saltHex,
    commitmentHex: toHex(commitment),
    txId: txData.public.txId,
  });
  return { txData: txData.public, saltHex, commitmentHex: toHex(commitment) };
}

/**
 * Bidder: reveals after the deadline. The raw amount + salt are supplied as
 * private ZK witnesses — they are never written to the ledger.
 */
export async function submitRevealBid({ found }: AuctionSession): Promise<FinalizedTxData> {
  return (await found.callTx.revealBid()).public;
}

/**
 * Finalizer: discloses winner + winning price. The compiled contract reads
 * them from THIS account's private state (the on-chain accumulator is not
 * implemented by the demo circuit), so we set it from the locally recorded
 * revealed bid before calling. For multi-party auctions the finalizer must
 * independently know the winning pair — a known limitation of the demo
 * contract, not of the wiring.
 */
export async function submitFinalizeAuction(
  { providers, found }: AuctionSession,
  winningPrice?: bigint,
  winnerKeyHex?: string,
): Promise<FinalizedTxData> {
  const meta = readLocalBidMeta();
  const localPrice = meta?.revealedAmount ? BigInt(meta.revealedAmount) : undefined;
  const price = winningPrice ?? localPrice;
  if (price === undefined || price <= 0n) {
    throw new Error(
      "No revealed bid found locally. Enter the winning bid amount explicitly to finalize.",
    );
  }
  const winnerBytes =
    winnerKeyHex !== undefined
      ? hexToBytes(winnerKeyHex.replace(/^0x/, ""))
      : meta?.bidderKeyHex
        ? hexToBytes(meta.bidderKeyHex)
        : new Uint8Array(32);

  const current =
    (await providers.privateStateProvider.get("aegisPrivateState")) ?? freshPrivateState();
  await providers.privateStateProvider.set("aegisPrivateState", {
    ...current,
    lowestBid: price,
    lowestBidder: winnerBytes,
  });

  return (await found.callTx.finalizeAuction()).public;
}

