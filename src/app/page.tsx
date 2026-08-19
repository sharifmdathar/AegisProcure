import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      {/* Hero */}
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-purple-950/50 border border-purple-800/50 rounded-full px-4 py-1.5 text-sm text-purple-300 mb-8">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          Live on Midnight Preprod Network
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
          <span className="gradient-text">Trustless Procurement.</span>
          <br />
          <span className="text-white">Zero Bid Leakage.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Aegis Procure brings mathematical certainty to sealed-bid auctions.
          Governments and enterprises lose billions to bid-shading and corrupted
          procurement databases. We fix that with ZK proofs.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/create"
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
          >
            Create Auction →
          </Link>
          <Link
            href="/results/demo"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
          >
            View Results
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-24 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-200 mb-10">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              phase: "Phase 1",
              title: "Commit",
              icon: "🔐",
              description:
                "Bidders submit hash(bidAmount, salt) to the public ledger. Raw amounts stay private.",
              color: "border-blue-800/50 bg-blue-950/20",
            },
            {
              phase: "Phase 2",
              title: "Reveal",
              icon: "🧮",
              description:
                "Bidders submit amount + salt as ZK private witnesses. The circuit verifies the hash. No amounts hit the ledger.",
              color: "border-purple-800/50 bg-purple-950/20",
            },
            {
              phase: "Phase 3",
              title: "Finalize",
              icon: "🏆",
              description:
                "Only the winner and winning price are disclosed. Losing bids remain private forever.",
              color: "border-green-800/50 bg-green-950/20",
            },
          ].map((step) => (
            <div
              key={step.phase}
              className={`border rounded-2xl p-6 text-left glow-card ${step.color}`}
            >
              <div className="text-3xl mb-3">{step.icon}</div>
              <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">
                {step.phase}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy guarantee */}
      <div className="mt-16 max-w-2xl mx-auto border border-red-900/40 bg-red-950/10 rounded-2xl p-6 text-left">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h3 className="font-bold text-red-300 mb-1">
              Privacy Guarantee
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Raw bid amounts are{" "}
              <strong className="text-white">never</strong> written to the
              public ledger. They flow exclusively through ZK circuit witnesses.{" "}
              <code className="text-purple-300 text-xs bg-gray-900 px-1 py-0.5 rounded">
                disclose()
              </code>{" "}
              is called only on the winning address and price. Losing bids are
              permanently private.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
