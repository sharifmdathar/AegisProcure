export const MIDNIGHT_NETWORK =
  (process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK as
    | "preview"
    | "preprod"
    | "mainnet"
    | undefined) ?? "preview";

/** Deployed Aegis auction contract (preview). Set NEXT_PUBLIC_CONTRACT_ADDRESS to override. */
export const CONTRACT_ADDRESSES = {
  preview:
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
    "f3f925b30c5ea1ac029f651f6f3738494a5031f1d9fe4d829ab99ab0cff4c871",
  preprod: "",
  mainnet: "",
} as const;

export const ACTIVE_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? CONTRACT_ADDRESSES.preview;

export const INDEXER_URL =
  process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_URL ??
  "https://indexer.preview.midnight.network/api/v3/graphql";

export const INDEXER_WS_URL =
  process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_WS_URL ??
  "wss://indexer.preview.midnight.network/api/v3/graphql/ws";

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_MIDNIGHT_EXPLORER_URL ??
  "https://explorer.preview.midnight.network";

/**
 * The compiled contract holds a single auction — the `[id]` route segment is
 * cosmetic (used for sharing/labels), all state lives at the address above.
 */
export const SINGLE_AUCTION_CONTRACT = true;

export function formatBid(amount: bigint) {
  return Number(amount).toLocaleString();
}
