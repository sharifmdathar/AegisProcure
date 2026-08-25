"use client";

import { use, useCallback, useEffect, useState } from "react";
import { ACTIVE_CONTRACT_ADDRESS } from "@/lib/contract";
import type { AuctionSession } from "@/lib/auction-writes";

type Phase = "commit" | "reveal" | "done";

export default function BidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [phase, setPhase] = useState<Phase>("commit");
  const [bidAmount, setBidAmount] = useState("");
  const [salt, setSalt] = useState<string>("");
  const [commitment, setCommitment] = useState<string>("");
  const [txId, setTxId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AuctionSession | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreAmount, setRestoreAmount] = useState("");
  const [restoreSalt, setRestoreSalt] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`aegis:meta:${ACTIVE_CONTRACT_ADDRESS}`);
      if (!raw) return;
      const meta = JSON.parse(raw) as {
        saltHex?: string;
        commitmentHex?: string;
        txId?: string;
        revealedAmount?: string;
        amount?: string;
      };
      if (meta.saltHex) setSalt(meta.saltHex);
      if (meta.commitmentHex) setCommitment(meta.commitmentHex);
      if (meta.txId) setTxId(meta.txId);
      if (meta.amount && !meta.revealedAmount) setBidAmount(meta.amount);
      if (meta.revealedAmount) setPhase("done");
      else if (meta.commitmentHex) setPhase("reveal");
    } catch {
      // Ignore malformed local metadata.
    }
  }, []);

  const connect = useCallback(async (): Promise<AuctionSession | null> => {
    setError(null);
    setConnecting(true);
    try {
      const writes = await import("@/lib/auction-writes");
      let s = session;
      if (!s) {
        const connected = await connect();
        if (!connected) return null;
        s = connected;
      }

      // Reveal needs pending witnesses present; restore them when known.
      const amountBig = BigInt(bidAmount || restoreAmount || "0");
      const saltHex = salt || restoreSalt;
      if (phase === "reveal" && amountBig > 0n && /^[0-9a-fA-F]{64}$/.test(saltHex)) {
        await writes.setPendingBidWitness(s, amountBig, saltHex);
      }
      return s;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not connect Lace wallet");
      return null;
    } finally {
      setConnecting(false);
    }
  }, [phase, bidAmount, restoreAmount, salt, restoreSalt]);

  async function handleCommit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const writes = await import("@/lib/auction-writes");
      let s = session;
      if (!s) {
        const connected = await connect();
        if (!connected) return;
        s = connected;
      }

      const amount = BigInt(bidAmount);
      if (amount <= 0n) throw new Error("Bid amount must be positive");

      const result = await writes.submitCommitBid(s, amount);
      setSalt(result.saltHex);
      setCommitment(result.commitmentHex);
      setTxId(result.txData.txId);
      setPhase("reveal");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Commit failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleReveal(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const writes = await import("@/lib/auction-writes");
      let s = session;
      if (!s) {
        const connected = await connect();
        if (!connected) return;
        s = connected;
      }

      // Manual restore path — bidder may be on a fresh browser.
      const amountBig = BigInt(restoreAmount || bidAmount || "0");
      const saltHex = restoreSalt || salt;
      if (amountBig > 0n && /^[0-9a-fA-F]{64}$/.test(saltHex)) {
        setRestoring(true);
        await writes.setPendingBidWitness(s, amountBig, saltHex);
        setRestoring(false);
      }

      await writes.submitRevealBid(s);
      if (amountBig > 0n) writes.markBidRevealed(amountBig);
      setPhase("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reveal failed");
    } finally {
      setLoading(false);
      setRestoring(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <div className="mb-2 text-xs font-mono text-gray-600">Auction #{id}</div>
      <h1 className="text-3xl font-black text-white mb-2">Submit Your Bid</h1>
      <p className="text-gray-400 text-sm mb-8">
        Your bid amount is{" "}
        <strong className="text-white">never revealed</strong> to the public
        ledger. It flows through ZK circuit witnesses only.
      </p>

      <PhaseIndicator phase={phase} />

      {phase === "commit" && (
        <form
          onSubmit={handleCommit}
          className="space-y-5 border border-gray-800 rounded-2xl p-6 bg-gray-900/40"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Your Bid Amount (units)
            </label>
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="e.g. 45000"
              min="1"
              required
              disabled={loading}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm disabled:opacity-50"
            />
            <p className="text-xs text-gray-600 mt-1">
              A random salt is generated locally and combined with your bid via
              the same persistent hash the circuit verifies.
            </p>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading
              ? "Proving + submitting commitment…"
              : connecting
                ? "Connecting Lace…"
                : "Submit Commitment →"}
          </button>
        </form>
      )}

      {phase === "reveal" && (
        <div className="space-y-5">
          <div className="border border-green-800/50 bg-green-950/20 rounded-2xl p-5">
            <h3 className="font-bold text-green-300 mb-3 text-sm">
              ✅ Commitment Submitted
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div>
                <span className="text-gray-500">Commitment hash: </span>
                <span className="text-gray-300 break-all">{commitment}</span>
              </div>
              {txId && (
                <div>
                  <span className="text-gray-500">Tx: </span>
                  <span className="text-gray-300 break-all">{txId}</span>
                </div>
              )}
            </div>
          </div>

          {salt && (
            <div className="border border-yellow-800/40 bg-yellow-950/10 rounded-xl p-4 text-xs text-yellow-300">
              ⚠️ Salt (stored in this browser):{" "}
              <code className="break-all text-yellow-200">{salt}</code>
              <br />
              Needed to reveal after the deadline — back it up.
            </div>
          )}

          <form
            onSubmit={handleReveal}
            className="border border-gray-800 rounded-2xl p-6 bg-gray-900/40 space-y-4"
          >
            <p className="text-sm text-gray-400">
              After the deadline, reveal your bid. Amount and salt are sent as{" "}
              <strong className="text-white">private ZK witnesses</strong> —
              they never appear on the public ledger.
            </p>

            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-400">
                Different browser? Re-enter your bid + salt
              </summary>
              <div className="mt-3 space-y-2">
                <input
                  type="number"
                  value={restoreAmount}
                  onChange={(e) => setRestoreAmount(e.target.value)}
                  placeholder="Original bid amount"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
                />
                <input
                  value={restoreSalt}
                  onChange={(e) => setRestoreSalt(e.target.value)}
                  placeholder="64-char salt hex"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 font-mono"
                />
              </div>
            </details>

            {error && (
              <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || restoring}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {loading
                ? restoring
                  ? "Restoring private witnesses…"
                  : "Generating ZK proof…"
                : connecting
                  ? "Connecting Lace…"
                  : "Reveal Bid (Private Witness) →"}
            </button>
          </form>
        </div>
      )}

      {phase === "done" && (
        <div className="border border-green-800/50 bg-green-950/20 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Bid Revealed Successfully
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            The ZK circuit verified your commitment on-chain. Results appear
            once the organizer calls{" "}
            <code className="text-purple-300">finalizeAuction()</code>.
          </p>
          <a
            href={`/results/${id}`}
            className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            View Results →
          </a>
        </div>
      )}
    </div>
  );
}

function PhaseIndicator({ phase }: { phase: Phase }) {
  const order: Phase[] = ["commit", "reveal", "done"];
  return (
    <div className="flex gap-2 mb-8">
      {order.map((p, i) => (
        <div key={p} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
              phase === p
                ? "bg-purple-600 border-purple-500 text-white"
                : i < order.indexOf(phase)
                  ? "bg-green-900 border-green-700 text-green-300"
                  : "bg-gray-900 border-gray-700 text-gray-600"
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-xs capitalize ${
              phase === p ? "text-white" : "text-gray-600"
            }`}
          >
            {p}
          </span>
          {i < 2 && <span className="text-gray-700 mx-1">→</span>}
        </div>
      ))}
    </div>
  );
}
