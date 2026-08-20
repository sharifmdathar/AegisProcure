# Aegis Procure — Usage Guide

> Final version for Level 6 launch.

---

## Overview

Aegis Procure is a ZK sealed-bid reverse auction protocol on the Midnight blockchain. This guide covers the full lifecycle for both **organizers** (procurement officers) and **bidders** (suppliers).

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Browser | Chrome or Brave (Lace extension supported) |
| Wallet | [Lace](https://www.lace.io/) — switch to **Preview** network |
| tDUST | Get test tokens from the [Midnight faucet](https://faucet.midnight.network) |
| Node.js | ≥ 22 (for local development only) |

---

## For Organizers

### Step 1 — Connect your Lace wallet
1. Install the [Lace browser extension](https://www.lace.io/)
2. Open Lace → Settings → Network → select **Preview**
3. Navigate to `https://aegis-procure.vercel.app`
4. Click **Connect Wallet** — approve the DApp Connector prompt

### Step 2 — Create an auction
1. Click **Create Auction** in the nav
2. Fill in:
   - **Auction Title** — e.g. "Office Supplies Q3 2025"
   - **Commit Deadline** — date/time by which all bids must be committed
   - **Eligibility Requirements** (optional) — free text
3. Click **Deploy Auction Contract →**
4. Approve the transaction in Lace
5. Copy the **Auction ID** from the confirmation screen — share it with your bidders

### Step 3 — Wait for the commit phase to end
- Bidders submit their commitment hashes before the deadline
- You can monitor the number of commitments via **getAuctionState**

### Step 4 — Finalize the auction
1. After the deadline passes, navigate to `/results/[auctionId]`
2. Click **Finalize Auction**
3. Approve the transaction in Lace
4. The winner and winning price are now publicly disclosed on-chain

---

## For Bidders

### Step 1 — Connect your Lace wallet
Same as organizer Step 1.

### Step 2 — Commit your bid
1. Open the auction link: `https://aegis-procure.vercel.app/bid/[auctionId]`
2. Enter your **bid amount** (integer, in procurement units)
3. Click **Submit Commitment →**
4. The frontend automatically:
   - Generates a cryptographic 32-byte salt
   - Computes `hash(bidAmount, salt)` client-side
   - Submits only the hash to the blockchain
5. **⚠️ CRITICAL: Copy and save your salt.** You cannot reveal your bid without it.
6. Approve the transaction in Lace

### Step 3 — Reveal your bid (after deadline)
1. Return to the same auction URL after the commit deadline
2. The page will show the **Reveal** phase
3. Your saved bid amount and salt are pre-filled (if you used the same browser session)
4. Click **Reveal Bid (Private Witness) →**
5. Your bid amount and salt are sent as **ZK private witnesses** — they never appear on the public ledger
6. Approve the transaction in Lace

### Step 4 — Check results
- Navigate to `/results/[auctionId]` after the organizer finalizes
- Only the **winner address** and **winning price** are shown
- Your bid amount remains permanently private

---

## Privacy Guarantees

```
Commit phase:   hash(bidAmount, salt)  →  public ledger  ✅
Reveal phase:   bidAmount, salt        →  ZK circuit only ✅ (never ledger)
Finalize:       winner, winningPrice   →  public ledger  ✅
                all other bids         →  permanently private ✅
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Wallet not connected" | Ensure Lace is installed and set to Preprod network |
| "Commit phase has ended" | The deadline passed — you can no longer commit |
| "Hash mismatch: invalid salt or amount" | You entered the wrong salt or bid amount during reveal |
| "Reveal phase has not started yet" | The commit deadline has not passed yet |
| Transaction stuck | Check the [Midnight Preview explorer](https://explorer.preview.midnight.network) for tx status |
| Lost your salt | Unfortunately the bid cannot be revealed — always save your salt |

---

## Local Development

```bash
git clone https://github.com/your-org/aegis-procure
cd aegis-procure
npm install
cp .env.local.example .env.local   # fill in your network URLs
npm run compact:build               # compile the Compact contract
npm run dev                         # http://localhost:3000
npm test                            # run all 6 contract tests
```

---

## Postman API Testing

Import the collection and environment from the `postman/` directory:

```
postman/collections/aegis-procure.postman_collection.json
postman/environments/midnight-preprod.postman_environment.json
```

Set these environment variables before running:
- `organizerKey` — your wallet public key (Bytes<32> hex)
- `auctionDeadline` — Unix timestamp (seconds)
- `bidCommitment` — `hash(bidAmount, salt)` hex string
- `bidAmount` — integer (keep secret)
- `bidSalt` — 32-byte hex string (keep secret)

Run the **Auction Lifecycle** folder in order to test the full flow.
