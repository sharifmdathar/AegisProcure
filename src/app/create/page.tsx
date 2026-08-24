"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initContract, createAuction } from "@/lib/contract";

export default function CreateAuctionPage() {
  const router = useRouter();
  const [deadline, setDeadline] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auctionId, setAuctionId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Convert deadline datetime-local to Unix timestamp (seconds)
      const deadlineTs = Math.floor(new Date(deadline).getTime() / 1000);

      
      const contract = await initContract("preview");
      const organizerKey = "placeholder-organizer-key";
      const auction = await createAuction(organizerKey, deadlineTs);
      setAuctionId(auction);
      router.push(`/bid/${auction}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create auction");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">
          Create Auction
        </h1>
        <p className="text-gray-400 text-sm">
          Deploy a new sealed-bid reverse auction to the Midnight blockchain.
          Connect your Lace wallet to sign the transaction.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="space-y-6 border border-gray-800 rounded-2xl p-6 bg-gray-900/40"
      >
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Auction Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Office Supplies Q3 2025"
            required
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Commit Deadline
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-600 transition-colors text-sm"
          />
          <p className="text-xs text-gray-600 mt-1">
            Bidders must submit their commitment hash before this time.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Eligibility Requirements{" "}
            <span className="text-gray-600">(optional)</span>
          </label>
          <textarea
            value={eligibility}
            onChange={(e) => setEligibility(e.target.value)}
            placeholder="e.g. ISO 9001 certified suppliers only"
            rows={3}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {loading ? "Deploying to Midnight…" : "Deploy Auction Contract →"}
        </button>
      </form>

      <div className="mt-6 border border-gray-800 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p>
          <strong className="text-gray-400">What happens on-chain:</strong>
        </p>
        <p>
          1. Your Lace wallet signs a transaction calling{" "}
          <code className="text-purple-400">createAuction(organizer, deadline)</code>
        </p>
        <p>
          2. The contract sets <code className="text-purple-400">auctionActive = true</code>{" "}
          and records the deadline on the public ledger.
        </p>
        <p>
          3. Bidders can now submit commitment hashes until the deadline.
        </p>
      </div>
    </div>
  );
}
