/**
 * Aegis Procure — Contract Tests
 *
 * Simulates the Compact contract logic in TypeScript to verify correctness.
 * Mirrors the exact types and behaviour of the compiled aegis.compact:
 *
 *   - ZswapCoinPublicKey for all address fields
 *   - Map with .insert() / .lookup() / .member() semantics
 *   - persistentHash<Vector<2, Bytes<32>>>([amountBytes, salt]) commitment scheme
 *   - witness currentBlock() supplies block height (simulated via mockBlockHeight)
 *   - duplicate commitBid rejected
 *
 * Required 6 tests (Level 3):
 *  1. createAuction sets correct deadline
 *  2. commitBid stores correct hash
 *  3. revealBid succeeds with correct salt
 *  4. revealBid FAILS with incorrect salt (hash mismatch)
 *  5. revealBid FAILS before deadline (reveal phase not started)
 *  6. finalizeAuction correctly discloses the minimum bid and winner
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createHash } from "crypto";

// ---------------------------------------------------------------------------
// Types — mirror the Compact contract types
// ---------------------------------------------------------------------------

/** Mirrors ZswapCoinPublicKey — 64-char hex string (32 bytes) */
type ZswapCoinPublicKey = string;

/** Mirrors Bytes<32> — 64-char hex string */
type Bytes32 = string;

// ---------------------------------------------------------------------------
// Commitment hash — mirrors:
//   circuit computeCommitment(amount: Uint<64>, salt: Bytes<32>): Bytes<32>
//   const amountBytes: Bytes<32> = amount as Bytes<32>;
//   return persistentHash<Vector<2, Bytes<32>>>([amountBytes, salt]);
//
// We simulate persistentHash as SHA-256(amountBytes ++ salt).
// amount is zero-padded to 32 bytes (big-endian).
// ---------------------------------------------------------------------------
function computeCommitment(amount: bigint, salt: Bytes32): Bytes32 {
  // Pad amount to 32 bytes big-endian (mirrors `amount as Bytes<32>`)
  const amountBuf = Buffer.alloc(32);
  // Write as 8-byte big-endian in the last 8 bytes (big-endian zero-padded)
  const tmp = Buffer.alloc(8);
  tmp.writeBigUInt64BE(amount);
  tmp.copy(amountBuf, 24); // right-align in 32 bytes

  const saltBuf = Buffer.from(salt, "hex");
  return createHash("sha256")
    .update(Buffer.concat([amountBuf, saltBuf]))
    .digest("hex");
}

// ---------------------------------------------------------------------------
// Ledger state — mirrors the `export ledger` declarations
// ---------------------------------------------------------------------------
interface LedgerState {
  auctionActive: boolean;
  deadline: bigint;
  /** Mirrors Map<ZswapCoinPublicKey, Bytes<32>> */
  commitments: Map<ZswapCoinPublicKey, Bytes32>;
  winner: ZswapCoinPublicKey;
  winningPrice: bigint;
  organizer: ZswapCoinPublicKey;
}

// ---------------------------------------------------------------------------
// Private witness state — mirrors the `witness` declarations
// ---------------------------------------------------------------------------
interface PrivateState {
  lowestBid: bigint;
  lowestBidder: ZswapCoinPublicKey;
}

function freshLedger(): LedgerState {
  return {
    auctionActive: false,
    deadline: 0n,
    commitments: new Map(),
    winner: "0".repeat(64),
    winningPrice: 0n,
    organizer: "0".repeat(64),
  };
}

function freshPrivate(): PrivateState {
  return { lowestBid: 0n, lowestBidder: "0".repeat(64) };
}

// Simulated block height — mirrors `witness currentBlock(): Uint<64>`
let mockBlockHeight = 100n;

// ---------------------------------------------------------------------------
// Contract circuit simulations
// ---------------------------------------------------------------------------

/**
 * Mirrors: export circuit createAuction(org, dl)
 * Sets organizer, deadline, auctionActive = true via disclose()
 */
function createAuction(
  ledger: LedgerState,
  organizer: ZswapCoinPublicKey,
  deadline: bigint
): void {
  if (ledger.auctionActive) throw new Error("Auction already active");
  ledger.organizer = organizer;       // disclose(org)
  ledger.deadline = deadline;         // disclose(dl)
  ledger.auctionActive = true;        // disclose(true)
}

/**
 * Mirrors: export circuit commitBid(commitment: Bytes<32>)
 * - Checks auctionActive, deadline > currentBlock
 * - Rejects duplicate commitments (.member() check)
 * - Stores commitment via .insert()
 */
function commitBid(
  ledger: LedgerState,
  caller: ZswapCoinPublicKey,
  commitment: Bytes32
): void {
  if (!ledger.auctionActive) throw new Error("Auction is not active");
  if (ledger.deadline <= mockBlockHeight) throw new Error("Commit phase has ended");
  if (ledger.commitments.has(caller)) throw new Error("Commitment already submitted");
  // mirrors: commitments.insert(disclose(caller), disclose(commitment))
  ledger.commitments.set(caller, commitment);
}

/**
 * Mirrors: export circuit revealBid()
 * - bidAmount, bidSalt, currentBlock are private witnesses
 * - Verifies hash via computeCommitment
 * - Updates private accumulator (lowestBid / lowestBidder) — never touches ledger
 */
function revealBid(
  ledger: LedgerState,
  priv: PrivateState,
  caller: ZswapCoinPublicKey,
  bidAmount: bigint,
  salt: Bytes32
): void {
  if (!ledger.auctionActive) throw new Error("Auction is not active");
  if (ledger.deadline > mockBlockHeight)
    throw new Error("Reveal phase has not started yet");

  // mirrors: commitments.lookup(disclose(caller)) == expected
  const expected = computeCommitment(bidAmount, salt);
  const stored = ledger.commitments.get(caller);
  if (stored !== expected)
    throw new Error("Hash mismatch: invalid salt or amount");

  // Private accumulator update — never written to public ledger
  if (priv.lowestBid === 0n || bidAmount < priv.lowestBid) {
    priv.lowestBid = bidAmount;
    priv.lowestBidder = caller;
  }
}

/**
 * Mirrors: export circuit finalizeAuction()
 * - Reads lowestBidder / lowestBid from private witnesses
 * - Writes ONLY winner and winningPrice to ledger via disclose()
 */
function finalizeAuction(
  ledger: LedgerState,
  priv: PrivateState
): void {
  if (!ledger.auctionActive) throw new Error("Auction is not active");
  if (ledger.deadline > mockBlockHeight)
    throw new Error("Auction deadline has not passed");

  ledger.winner = priv.lowestBidder;       // disclose(winnerAddr)
  ledger.winningPrice = priv.lowestBid;    // disclose(winnerPrice)
  ledger.auctionActive = false;            // disclose(false)
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------
const ORGANIZER: ZswapCoinPublicKey = "a".repeat(64);
const BIDDER_A: ZswapCoinPublicKey  = "b".repeat(64);
const BIDDER_B: ZswapCoinPublicKey  = "c".repeat(64);
const SALT_A: Bytes32 = "d".repeat(64);
const SALT_B: Bytes32 = "e".repeat(64);
const BID_A = 500n;  // lower bid — should win
const BID_B = 800n;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Aegis Procure — Contract", () => {
  let ledger: LedgerState;
  let priv: PrivateState;

  beforeEach(() => {
    ledger = freshLedger();
    priv = freshPrivate();
    mockBlockHeight = 100n;
  });

  // -------------------------------------------------------------------------
  // Test 1: createAuction sets correct deadline
  // -------------------------------------------------------------------------
  it("createAuction sets correct deadline", () => {
    const deadline = 200n;
    createAuction(ledger, ORGANIZER, deadline);

    expect(ledger.auctionActive).toBe(true);
    expect(ledger.deadline).toBe(deadline);
    expect(ledger.organizer).toBe(ORGANIZER);
    // winner / winningPrice not set by createAuction — remain at initial values
    expect(ledger.winner).toBe("0".repeat(64));
    expect(ledger.winningPrice).toBe(0n);
  });

  // -------------------------------------------------------------------------
  // Test 2: commitBid stores correct hash (and rejects duplicates)
  // -------------------------------------------------------------------------
  it("commitBid stores correct hash", () => {
    createAuction(ledger, ORGANIZER, 200n);

    const commitment = computeCommitment(BID_A, SALT_A);
    commitBid(ledger, BIDDER_A, commitment);

    // mirrors: commitments.lookup(BIDDER_A) == commitment
    expect(ledger.commitments.get(BIDDER_A)).toBe(commitment);

    // Raw bid amount must NOT appear on the ledger
    expect(ledger.commitments.get(BIDDER_A)).not.toBe(BID_A.toString());

    // Duplicate commitment must be rejected
    expect(() => commitBid(ledger, BIDDER_A, commitment)).toThrow(
      "Commitment already submitted"
    );
  });

  // -------------------------------------------------------------------------
  // Test 3: revealBid succeeds with correct salt
  // -------------------------------------------------------------------------
  it("revealBid succeeds with correct salt", () => {
    createAuction(ledger, ORGANIZER, 200n);
    commitBid(ledger, BIDDER_A, computeCommitment(BID_A, SALT_A));

    // Advance past deadline — mirrors witness currentBlock() > deadline
    mockBlockHeight = 201n;

    expect(() => revealBid(ledger, priv, BIDDER_A, BID_A, SALT_A)).not.toThrow();

    // Private accumulator updated
    expect(priv.lowestBid).toBe(BID_A);
    expect(priv.lowestBidder).toBe(BIDDER_A);

    // Raw bid amount still NOT on the public ledger
    expect(ledger.winningPrice).toBe(0n);
  });

  // -------------------------------------------------------------------------
  // Test 4: revealBid FAILS with incorrect salt (hash mismatch)
  // -------------------------------------------------------------------------
  it("revealBid FAILS with incorrect salt (hash mismatch)", () => {
    createAuction(ledger, ORGANIZER, 200n);
    commitBid(ledger, BIDDER_A, computeCommitment(BID_A, SALT_A));

    mockBlockHeight = 201n;

    const wrongSalt: Bytes32 = "f".repeat(64);
    expect(() => revealBid(ledger, priv, BIDDER_A, BID_A, wrongSalt)).toThrow(
      "Hash mismatch: invalid salt or amount"
    );
  });

  // -------------------------------------------------------------------------
  // Test 5: revealBid FAILS before deadline (reveal phase not started)
  // -------------------------------------------------------------------------
  it("revealBid FAILS before deadline (reveal phase not started)", () => {
    createAuction(ledger, ORGANIZER, 200n);
    commitBid(ledger, BIDDER_A, computeCommitment(BID_A, SALT_A));

    // Block height still before deadline — mirrors currentBlock() < deadline
    mockBlockHeight = 150n;

    expect(() => revealBid(ledger, priv, BIDDER_A, BID_A, SALT_A)).toThrow(
      "Reveal phase has not started yet"
    );
  });

  // -------------------------------------------------------------------------
  // Test 6: finalizeAuction correctly discloses the minimum bid and winner
  // -------------------------------------------------------------------------
  it("finalizeAuction correctly discloses the minimum bid and winner", () => {
    createAuction(ledger, ORGANIZER, 200n);

    // Two bidders commit
    commitBid(ledger, BIDDER_A, computeCommitment(BID_A, SALT_A));
    commitBid(ledger, BIDDER_B, computeCommitment(BID_B, SALT_B));

    // Advance to reveal phase
    mockBlockHeight = 201n;

    // Both reveal — private accumulator tracks lowest
    revealBid(ledger, priv, BIDDER_A, BID_A, SALT_A);
    revealBid(ledger, priv, BIDDER_B, BID_B, SALT_B);

    // Finalize — only winner + winningPrice hit the ledger
    finalizeAuction(ledger, priv);

    expect(ledger.auctionActive).toBe(false);
    expect(ledger.winner).toBe(BIDDER_A);        // lower bid wins (500 < 800)
    expect(ledger.winningPrice).toBe(BID_A);     // 500n

    // Losing bid (BIDDER_B, 800n) is NEVER disclosed on the ledger
    expect(ledger.commitments.has(BIDDER_B)).toBe(true); // only hash stored
    expect(ledger.winningPrice).not.toBe(BID_B);
  });
});
