"use client";

import { useState } from "react";
import { createHash, randomBytes } from "crypto";

type Phase = "commit" | "reveal" | "done";

function computeCommitment(bidAmount: bigint, salt: string): string {
  const amountBuf = Buffer.alloc(8);
  amountBuf.writeBigUInt64BE(bidAmount);
  const saltBuf = Buffer.from(salt, "hex");
  return createHash("sha256")
    .update(Buffer.concat([amountBuf, saltBuf]))
    .digest("hex");
}

export default function BidPage({ params }: { params: { id: string } }) {
  const [phase, setPhase] = useState<Phase>("commit");
  const [bidAmount, setBidAmount] = useState("");
  const [salt, setSalt] = useState<string>("");
  const [commitment, setCommitment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  function generateSalt(): string {
    return randomBytes(32).toString("hex");
  }

  async function handleCommit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const amount = BigInt(bidAmount);
      if (amount <= 0n) throw new Error("Bid amount must be positive");

      // Generate a cryptographic salt
      const newSalt = generateSalt();
      setSalt(newSalt);

      // Compute commitment hash client-side
      const hash = computeCommitment(amount, newSalt);
      setCommitment(hash);

      // In production: call midnight-js SDK → commitBid(hash)
      await new Promise((r) => setTimeout(r, 1000));
      setTxHash("0x" + randomBytes(32).toString("hex"));
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
      // In production: call midnight-js SDK → revealBid()
      // bidAmount and salt are passed as PRIVATE WITNESSES to the ZK circuit
      // They are NEVER sent to the public ledger
      await new Promise((r) => setTimeout(r, 1200));
      setPhase("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reveal failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <div className="mb-2 text-xs font-mono text-gray-600">
        Auction #{params.id}
      </div>
      <h1 className="text-3xl font-black text-white mb-2">Submit Your Bid</h1>
      <p className="text-gray-400 text-sm mb-8">
        Your bid amount is{" "}
        <strong className="text-white">never revealed</strong> to the public
        ledger. It flows through ZK circuit witnesses only.
      </p>

      {/* Phase indicator */}
      <div className="flex gap-2 mb-8">
        {(["commit", "reveal", "done"] as Phase[]).map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                phase === p
                  ? "bg-purple-600 border-purple-500 text-white"
                  : i < ["commit", "reveal", "done"].indexOf(phase)
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

      {/* Commit phase */}
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
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">
              A cryptographic salt will be generated automatically and combined
              with your bid to create the commitment hash.
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
            {loading ? "Generating ZK commitment…" : "Submit Commitment →"}
          </button>
        </form>
      )}

      {/* Reveal phase */}
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
              <div>
                <span className="text-gray-500">Tx: </span>
                <span className="text-gray-300 break-all">{txHash}</span>
              </div>
            </div>
          </div>

          <div className="border border-yellow-800/40 bg-yellow-950/10 rounded-xl p-4 text-xs text-yellow-300">
            ⚠️ Save your salt securely:{" "}
            <code className="break-all text-yellow-200">{salt}</code>
            <br />
            You will need it to reveal your bid after the deadline.
          </div>

          <form
            onSubmit={handleReveal}
            className="border border-gray-800 rounded-2xl p-6 bg-gray-900/40"
          >
            <p className="text-sm text-gray-400 mb-4">
              The auction deadline has passed. Submit your reveal. Your bid
              amount and salt will be sent as{" "}
              <strong className="text-white">private ZK witnesses</strong> —
              they never appear on the public ledger.
            </p>

            {error && (
              <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300 mb-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? "Submitting ZK proof…" : "Reveal Bid (Private Witness) →"}
            </button>
          </form>
        </div>
      )}

      {/* Done */}
      {phase === "done" && (
        <div className="border border-green-800/50 bg-green-950/20 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Bid Revealed Successfully
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Your bid has been verified by the ZK circuit. The result will be
            available after the organizer calls{" "}
            <code className="text-purple-300">finalizeAuction()</code>.
          </p>
          <a
            href={`/results/${params.id}`}
            className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            View Results →
          </a>
        </div>
      )}
    </div>
  );
}
