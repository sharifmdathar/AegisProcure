# Aegis Procure — Proposal

## Problem

Sealed-bid procurement is supposed to be confidential, yet in practice bids leak. Whoever controls the procurement database — an insider, a compromised server, or a colluding official — can peek at competing bids before the deadline. This enables bid-shading, favoritism, and outright collusion, costing B2B enterprises and government agencies billions each year and eroding trust in public spending. Traditional systems ask participants to *trust* the auctioneer not to look. That trust cannot be verified.

## Solution

Aegis Procure is a **commit-reveal sealed-bid reverse auction** built on the Midnight blockchain. In the commit phase, each bidder publishes only `hash(bidAmount, salt)` — a cryptographic commitment that hides the bid. In the reveal phase, the bid amount and salt are supplied as **ZK private witnesses**: a zero-knowledge circuit verifies the commitment and updates a private lowest-bid accumulator without ever writing the raw amounts on-chain. At finalization, only the winner and winning price are selectively disclosed. Losing bids stay private forever.

## Why Midnight

Midnight is purpose-built for **selective disclosure**: applications keep sensitive data private by default and prove facts about it with zero-knowledge proofs, revealing only what must be public. Aegis Procure leans directly on this. The ledger holds commitments and the final outcome; everything else — bid amounts, salts, the loser set — is proven correct in-circuit and never exposed. No trusted auctioneer, no leaky database, just math.

## Target Users

- **B2B procurement teams** running competitive sourcing events who need verifiable fairness.
- **GovTech agencies** subject to public-integrity requirements for tenders and RFPs.
- **Suppliers / bidders** who want assurance their pricing cannot be leaked or front-run.

## How It Works

- **Commit** — Bidders submit `hash(bidAmount, salt)`; only the hash reaches the ledger.
- **Reveal** — Bidders submit `bidAmount` + `salt` as ZK private witnesses; the circuit verifies and tracks the minimum privately.
- **Finalize** — After the deadline, `disclose()` publishes only the winner address and winning price.

## Privacy Model

- **PUBLIC** — commitment hashes, auction deadline, and the final winner + winning price.
- **PRIVATE** — every raw bid amount, every salt, and all losing bids (never written to the ledger).
- **PROVES** — the ZK circuit proves each revealed bid matches its commitment and that the disclosed winner is genuinely the lowest valid bid, with no side-channel leakage about losers.

## Roadmap

- **Preview** — initial deployment, contract tests, and end-to-end demo.
- **Preprod** — stable public testnet deployment, launch cohort onboarding, CI pipeline.
- **Mainnet** — production launch with audited contracts and real procurement pilots.
