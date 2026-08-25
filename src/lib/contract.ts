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

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_MIDNIGHT_EXPLORER_URL ??
  "https://explorer.preview.midnight.network";

// Legacy client-side stubs — wallet flows are not wired yet; do NOT mistake these for chain calls.
export function initContract(network: "preview" | "preprod" | "mainnet" = "preview") {}

export function createAuction(organizerKey: string, deadline: number) {
  return Math.random().toString(36).slice(2, 12);
}

export function commitBid(auctionId: string, bidAmount: bigint, salt: string) {
  return require("crypto").createHash("sha256").update(`${bidAmount}${salt}`).digest("hex");
}

export function revealBid(auctionId: string, bidAmount: bigint, salt: string) {
  return { success: true, message: "placeholder" };
}

export function finalizeAuction(auctionId: string) {
  return { winner: "0".repeat(64), winningPrice: 45000n };
}

export function formatBid(amount: bigint) {
  return Number(amount).toLocaleString();
}
