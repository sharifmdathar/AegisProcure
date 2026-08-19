/**
 * Utility functions for Aegis Procure frontend
 */

/**
 * Convert an on-chain Unix timestamp (seconds) to a human-readable string.
 */
export function formatDeadline(unixSeconds: number | bigint): string {
  const ms = typeof unixSeconds === "bigint"
    ? Number(unixSeconds) * 1000
    : unixSeconds * 1000;
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Truncate a hex address for display: first 8 + last 6 chars.
 */
export function truncateAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

/**
 * Copy text to clipboard. Returns true on success.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format a bid amount with thousands separators.
 */
export function formatBidAmount(amount: number | bigint): string {
  return Number(amount).toLocaleString();
}
