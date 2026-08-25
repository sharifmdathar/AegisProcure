import Link from "next/link";
import { fetchAuctionResult, type AuctionResult } from "@/lib/auction-reads";
import { EXPLORER_URL, ACTIVE_CONTRACT_ADDRESS } from "@/lib/contract";

export const dynamic = "force-dynamic";

function shortenKey(hex: string) {
  return `${hex.slice(0, 10)}…${hex.slice(-8)}`;
}

function NoAuctionCard({ id }: { id: string }) {
  return (
    <div className="border border-gray-800 bg-gray-900/20 rounded-2xl p-8 text-center">
      <div className="text-3xl mb-3">🕳️</div>
      <h2 className="text-lg font-bold text-gray-300">No Auction On-Chain</h2>
      <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
        The auction contract is deployed but no auction has been created on the
        network yet, so there is nothing to disclose. Nothing is faked here —
        when an organizer runs{" "}
        <code className="text-purple-300">createAuction()</code>, results will
        appear at this URL.
      </p>
      <a
        href={`${EXPLORER_URL}/contract/${ACTIVE_CONTRACT_ADDRESS}`}
        target="_blank"
        rel="noreferrer"
        className="inline-block mt-4 text-xs font-mono text-purple-400 hover:text-purple-300 break-all"
      >
        inspect contract {shortenKey(ACTIVE_CONTRACT_ADDRESS)} ↗
      </a>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="border border-red-900/50 bg-red-950/20 rounded-2xl p-8 text-center">
      <div className="text-3xl mb-3">⚠️</div>
      <h2 className="text-lg font-bold text-red-300">Chain Read Failed</h2>
      <p className="text-sm text-gray-400 mt-2">{message}</p>
    </div>
  );
}

const ZERO_KEY = "0".repeat(64);

export default async function ResultsPage({
  params,
}: {
  params: { id: string };
}) {
  let result: Awaited<ReturnType<typeof fetchAuctionResult>>;
  try {
    result = await fetchAuctionResult(params.id);
  } catch (e) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-2 text-xs font-mono text-gray-600">
          Auction #{params.id}
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Auction Results</h1>
        <p className="text-gray-400 text-sm mb-10">
          Only the winner and winning price are disclosed. All other bids remain
          permanently private.
        </p>
        <ErrorCard
          message={e instanceof Error ? e.message : "Unknown indexer error"}
        />
        <div className="mt-8">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-2 text-xs font-mono text-gray-600">
        Auction #{params.id}
      </div>
      <h1 className="text-3xl font-black text-white mb-2">Auction Results</h1>
      <p className="text-gray-400 text-sm mb-10">
        Only the winner and winning price are disclosed. All other bids remain
        permanently private.
      </p>

      {!result ? (
        <NoAuctionCard id={params.id} />
      ) : result.auctionActive ? (
        <div className="border border-yellow-800/50 bg-yellow-950/20 rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">⏳</div>
          <h2 className="text-lg font-bold text-yellow-300">
            Auction Still Active
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Results will be available after the organizer calls{" "}
            <code className="text-purple-300">finalizeAuction()</code>.
          </p>
        </div>
      ) : result.winner === ZERO_KEY ? (
        <div className="border border-yellow-800/50 bg-yellow-950/20 rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">🏁</div>
          <h2 className="text-lg font-bold text-yellow-300">
            Deadline Passed — Awaiting Finalize
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {result.totalBidders} commitment
            {result.totalBidders === 1 ? "" : "s"} are on-chain. No winner is
            disclosed yet because{" "}
            <code className="text-purple-300">finalizeAuction()</code> has not
            been called.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Winner card */}
          <div className="border border-purple-700/50 bg-purple-950/20 rounded-2xl p-8 glow-card">
            <div className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-3">
              Winner — Disclosed via disclose()
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">
                  Winning Address
                </div>
                <code className="text-xs text-gray-300 break-all">
                  {result.winner}
                </code>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm text-gray-400 mb-1">Winning Price</div>
                <div className="text-3xl font-black text-white">
                  {result.winningPrice.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">units</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-800 rounded-xl p-4 bg-gray-900/30">
              <div className="text-xs text-gray-500 mb-1">Total Bidders</div>
              <div className="text-2xl font-bold text-white">
                {result.totalBidders}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Individual amounts: private
              </div>
            </div>
            <div className="border border-gray-800 rounded-xl p-4 bg-gray-900/30">
              <div className="text-xs text-gray-500 mb-1">Finalized At</div>
              <div className="text-sm font-mono text-white">
                {result.finalizedAt > 0
                  ? new Date(result.finalizedAt * 1000).toLocaleString()
                  : "—"}
              </div>
              {result.lastBlockHeight > 0 && (
                <a
                  href={`${EXPLORER_URL}/blocks/${result.lastBlockHeight}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 mt-1 inline-block"
                >
                  block {result.lastBlockHeight} ↗
                </a>
              )}
            </div>
          </div>

          {/* Privacy proof */}
          <div className="border border-gray-800 rounded-xl p-5 bg-gray-900/20">
            <h3 className="text-sm font-bold text-gray-300 mb-3">
              🔒 Privacy Proof
            </h3>
            <ul className="space-y-2 text-xs text-gray-500">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                Raw bid amounts were never written to the public ledger
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                All bids flowed through ZK circuit witnesses only
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <code className="text-purple-400">disclose()</code> was called
                only on the winner address and winning price
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                {Math.max(0, result.totalBidders - 1)} losing bids are
                permanently private
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
