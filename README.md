# 🔒 Aegis Procure

> **Trustless Procurement. Zero Bid Leakage.**

A decentralized, trustless sealed-bid reverse auction protocol for B2B and GovTech procurement, built on the [Midnight blockchain](https://midnight.network) using Compact smart contracts and ZK proofs.

[![CI](https://github.com/<<GITHUB_OWNER_REPO>>/actions/workflows/ci.yml/badge.svg)](https://github.com/<<GITHUB_OWNER_REPO>>/actions/workflows/ci.yml)
[![Built on Midnight](https://img.shields.io/badge/Built%20on-Midnight%20Blockchain-7c3aed)](https://midnight.network)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-6%20passing-brightgreen)](contract/src/test/aegis.test.ts)
[![Network](https://img.shields.io/badge/Network-Preprod-orange)](https://explorer.preprod.midnight.network)

---

## 🏗️ Contract Address

| Network | Address |
|---------|---------|
| **Midnight Preprod** (primary) | `<<PREPROD_CONTRACT_ADDRESS>>` |
| Preview | `mn1contract0aegisprocure000000000000000000000000000000000000preview` |
| Mainnet | _Not yet deployed_ |

> To interact with the contract directly, import the address into your Lace wallet (Preprod network) or use the Postman collection in `postman/`.

---

## What This Product Does

Aegis Procure is a trustless sealed-bid reverse auction protocol built for B2B and GovTech procurement. Suppliers submit sealed bids so that no one — not competitors, not even the auction organizer — can see or front-run competing bids while the auction is open. This removes the bid-shading and collusion that plague traditional procurement.

Only the winning bid is revealed on-chain when the auction is finalized. Every losing bid stays permanently private, protected by zero-knowledge proofs on the Midnight blockchain, so participants get mathematically guaranteed fairness without exposing their commercial secrets.

---

## Live Demo

🌐 **[aegis-procure.vercel.app](https://aegis-procure.vercel.app)** _(Preprod network)_

---

## Privacy Model

Aegis Procure implements a **commit-reveal auction with ZK private witnesses**:

| Phase | What happens | What hits the ledger |
|-------|-------------|----------------------|
| **1 — Commit** | Bidder submits `hash(bidAmount, salt)` | Commitment hash only |
| **2 — Reveal** | Bidder submits `bidAmount` + `salt` as **private ZK witnesses** | Nothing — circuit verifies internally |
| **3 — Finalize** | `disclose()` called on winner only | Winner address + winning price |

**What is exposed vs. protected:**

- **PUBLIC (on-chain):** auction status, deadline, commitment hashes, winner address, winning price.
- **PRIVATE (never on-chain):** raw bid amounts, salts, losing bidders' amounts.
- **PROVES (ZK circuit):** that the revealed winner truly submitted the lowest valid sealed bid — without exposing any losing bid.

**Losing bids are permanently private.** Raw bid amounts never touch the public ledger.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contracts | [Compact](https://docs.midnight.network/develop/reference/compact) (`.compact`) |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Blockchain SDK | `@midnight-ntwrk/midnight-js` |
| Wallet | [Lace](https://www.lace.io/) via DApp Connector API |
| ZK proofs | Compact compiler → circuits in `/managed` |
| Node | ≥ 22 |

---

## Project Structure

```
aegis-procure/
├── contract/
│   ├── aegis.compact              # Compact smart contract
│   ├── package.json
│   └── src/test/
│       └── aegis.test.ts          # 6 contract tests (Level 3)
├── src/
│   └── app/
│       ├── layout.tsx             # Root layout + nav
│       ├── globals.css
│       ├── page.tsx               # / — Landing page
│       ├── create/
│       │   └── page.tsx           # /create — Organizer creates auction
│       ├── bid/[id]/
│       │   └── page.tsx           # /bid/[id] — Bidder commit + reveal
│       └── results/[id]/
│           └── page.tsx           # /results/[id] — Public winner dashboard
├── managed/                       # Compact compiler output (gitignored)
├── postman/                       # Postman collection, environment, globals
│   ├── collections/
│   │   └── aegis-procure.postman_collection.json
│   └── environments/
│       └── midnight-preprod.postman_environment.json
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
└── .env.local                     # Network URLs (gitignored)
```

---

## Getting Started

### Prerequisites

- Node.js v22
- Lace wallet (Preprod network) browser extension — [Lace](https://www.lace.io/)
- Midnight Compact compiler (`compactc`) — see [Midnight docs](https://docs.midnight.network)

### Install

```bash
npm install
```

### Compile the contract

```bash
npm run compact:build
# Outputs ZK circuits to /managed
```

### Run the dev server

```bash
npm run dev
# http://localhost:3000
```

### Run tests

```bash
npm test
# Runs all 6 contract tests via vitest
```

---

## Contract Functions

### `createAuction(organizer, deadline)`
Opens a new auction. Sets `auctionActive = true` and records the deadline on the public ledger.

### `commitBid(commitment: Bytes<32>)`
Bidder submits `hash(bidAmount, salt)`. Only the hash is stored on-chain.

### `revealBid()` ← private witnesses: `bidAmount`, `salt`
The ZK circuit verifies `hash(bidAmount, salt) == commitments[caller]` and updates a **private accumulator** for the lowest bid. Nothing is written to the public ledger.

### `finalizeAuction()`
After the deadline, writes only `winner` and `winningPrice` to the ledger via `disclose()`. All other bids remain private.

---

## Tests (Level 3 — 6 required)

| # | Test | Status |
|---|------|--------|
| 1 | `createAuction` sets correct deadline | ✅ |
| 2 | `commitBid` stores correct hash | ✅ |
| 3 | `revealBid` succeeds with correct salt | ✅ |
| 4 | `revealBid` FAILS with incorrect salt (hash mismatch) | ✅ |
| 5 | `revealBid` FAILS before deadline | ✅ |
| 6 | `finalizeAuction` correctly discloses minimum bid and winner | ✅ |

---

## Postman Collection

The `postman/` directory contains a ready-to-use collection for testing the contract API:

1. Import `postman/collections/aegis-procure.postman_collection.json` into Postman
2. Import `postman/environments/midnight-preprod.postman_environment.json`
3. Set `organizerKey`, `auctionDeadline`, `bidCommitment`, `bidAmount`, `bidSalt` in the environment
4. Run the **Auction Lifecycle** folder in order

---

## CI/CD

Continuous integration runs via GitHub Actions, defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). The workflow triggers on every push and pull request to `main`, installs dependencies deterministically with `npm ci`, and runs the contract test suite with `npm test` on Node 22.

---

## Product X Profile

[Follow @AegisProcure on X](<<X_PROFILE_URL>>)

> Trustless procurement on @MidnightNtwrk. Sealed-bid reverse auctions with zero bid leakage, powered by ZK proofs. 🔒

---

## Brand Assets

Brand direction and guidelines live in [`docs/BRAND_BRIEF.md`](docs/BRAND_BRIEF.md). Asset checklist:

- [ ] Logo
- [ ] Favicon
- [ ] OG image (1200×630)
- [ ] X banner (1500×500)
- [ ] Demo thumbnail

---

## Hard Constraints

1. ❌ **Never** store raw bid amounts in the public `ledger {}` state
2. ❌ **Never** call `disclose()` on `revealBid` inputs
3. ✅ **Always** use a cryptographic salt with the bid amount for the commitment
4. ✅ **All** private data flows through ZK circuit witnesses only
5. ✅ ZK minimum-finding logic must not leak side-channel data about losing bids

---

## Level 6 Deliverables

| Deliverable | Status | File |
|-------------|--------|------|
| Docs (USAGE, FEEDBACK, PROPOSAL, USERS, LAUNCH_USERS) | ✅ Done | `docs/USAGE.md`, `FEEDBACK.md`, `PROPOSAL.md`, `USERS.md`, `LAUNCH_USERS.md` |
| CI workflow | ✅ Done | `.github/workflows/ci.yml` |
| README sections | ✅ Done | This file |
| Brand brief | ✅ Done | `docs/BRAND_BRIEF.md` |
| Onboarding script | ✅ Done | `docs/ONBOARDING_SCRIPT.md` |
| Demo checklist | ✅ Done | `docs/DEMO_VIDEO_CHECKLIST.md` |
| Contract redeployed to Preprod | ⏳ Pending | Needs real value — see `<<PREPROD_CONTRACT_ADDRESS>>` |
| Preprod contract address in README | ⏳ Pending | Needs real value — see `<<PREPROD_CONTRACT_ADDRESS>>` |
| 20 users onboarded | ⏳ Pending | Needs real values — see `LAUNCH_USERS.md` |

---

## Narrative

> *"Governments and enterprises lose billions to bid-shading and corrupted procurement databases. Aegis Procure brings mathematical certainty to sealed-bid auctions. Start in the dark (commitments). Ship in the light (selective disclosure of the winner)."*

---

## License

MIT
