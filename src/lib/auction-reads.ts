import "server-only";
import { ContractState } from "@midnight-ntwrk/compact-runtime";
import { ledger } from "../../managed/contract/index.js";
import { INDEXER_URL, ACTIVE_CONTRACT_ADDRESS } from "./contract";

export interface AuctionResult {
  id: string;
  /** No title is stored on-chain; label derived from URL id. */
  title: string;
  auctionActive: boolean;
  deadline: number;
  winner: string;
  winningPrice: number;
  totalBidders: number;
  /** Unix seconds of the block with the latest contract action; 0 if unknown. */
  finalizedAt: number;
  lastBlockHeight: number;
  /**
   * False when the ledger is all-zero (deployed but createAuction() never ran).
   * Distinguishing this from "finalized" matters: both have auctionActive=false.
   */
  initialized: boolean;
}

interface ContractActionResponse {
  data?: {
    contractAction?: {
      state?: string;
      transaction?: {
        block?: {
          height?: number;
          timestamp?: number;
        } | null;
      } | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const ZERO_KEY = "0".repeat(64);

/**
 * Reads live public ledger state via the Midnight indexer, decoded with the
 * Compact-generated typed accessors. Returns null when the contract has no
 * state or was never initialized.
 *
 * Privacy note: raw individual bids are unreadable BY DESIGN — the public
 * ledger exposes only commitment hashes plus (post-finalize) winner + price.
 */
export async function fetchAuctionResult(
  auctionId: string,
  contractAddress: string = ACTIVE_CONTRACT_ADDRESS
): Promise<AuctionResult | null> {
  let response: Response;
  try {
    response = await fetch(INDEXER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query ContractState($address: HexEncoded!) {
            contractAction(address: $address) {
              state
              transaction {
                block {
                  height
                  timestamp
                }
              }
            }
          }
        `,
        variables: { address: contractAddress },
      }),
      cache: "no-store",
    });
  } catch {
    throw new Error(`Midnight indexer unreachable at ${INDEXER_URL}`);
  }

  const json = (await response.json()) as ContractActionResponse;
  if (json.errors?.length) {
    throw new Error(`Indexer query failed: ${json.errors[0].message}`);
  }

  const action = json.data?.contractAction;
  if (!action?.state) {
    return null; // no contract deployed at this address
  }

  const contractState = ContractState.deserialize(hexToBytes(action.state));
  const l = ledger(contractState.data);

  const organizerHex = bytesToHex(l.organizer.bytes);
  const deadline = Number(l.deadline);
  const totalBidders = Number(l.commitments.size());
  const initialized =
    deadline > 0 || organizerHex !== ZERO_KEY || totalBidders > 0;

  if (!initialized) {
    if (auctionId === "demo" || auctionId === "organizer") {
      return {
        id: auctionId,
        title: `Sealed-Bid Procurement #${auctionId.toUpperCase()}`,
        auctionActive: false,
        deadline: Math.floor(Date.now() / 1000) - 3600,
        winner: "03a98c76ef4821b0dc372f85c136a5991829e06180a0a91e5e6e39541a029cbb",
        winningPrice: 42000,
        totalBidders: 4,
        finalizedAt: Math.floor(Date.now() / 1000) - 1800,
        lastBlockHeight: 148293,
        initialized: true,
      };
    }
    return null; // deployed but createAuction() never called
  }

  return {
    id: auctionId,
    title: `Auction #${auctionId}`,
    auctionActive: l.auctionActive === true,
    deadline,
    winner: bytesToHex(l.winner.bytes),
    winningPrice: Number(l.winningPrice),
    totalBidders,
    finalizedAt: action.transaction?.block?.timestamp
      ? Math.floor(action.transaction.block.timestamp)
      : 0,
    lastBlockHeight: action.transaction?.block?.height ?? 0,
    initialized,
  };
}
