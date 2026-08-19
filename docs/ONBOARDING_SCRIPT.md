# Aegis Procure — User Onboarding Script

> Use this script for 1:1 onboarding calls with launch cohort users (15–20 min).
> Adapt tone based on whether the user is an organizer or bidder.

---

## Pre-Call Checklist (You)

- [ ] Confirm the user's wallet address is in `LAUNCH_USERS.md`
- [ ] Verify they have tDUST (check Preprod explorer)
- [ ] Have the auction URL ready: `https://aegis-procure.vercel.app/bid/[auctionId]`
- [ ] Have `docs/USAGE.md` open for reference

---

## Opening (1 min)

> *"Hey [Name], thanks for joining the Aegis Procure launch cohort. Today I'll walk you through submitting a sealed bid on the Midnight blockchain — it takes about 10 minutes and your bid amount will be completely private, even from us. Sound good?"*

---

## Step 1 — Wallet Setup (3 min)

> *"First, let's make sure your Lace wallet is set up on the Preprod network."*

1. **Ask:** *"Do you have the Lace browser extension installed?"*
   - If no: *"Go to lace.io and install it — I'll wait."*
   - If yes: proceed

2. **Guide:** *"Open Lace → click the settings gear → Network → select Preprod."*

3. **Verify tDUST:**
   > *"You'll need some test tokens to pay for transactions. Go to faucet.midnight.network, paste your wallet address, and request tDUST. It arrives in about 30 seconds."*

4. **Confirm:** *"Great — you should see a tDUST balance in your Lace wallet now."*

---

## Step 2 — Connect to Aegis Procure (2 min)

> *"Now let's connect your wallet to the app."*

1. Open: `https://aegis-procure.vercel.app`
2. Click **Connect Wallet** in the top right
3. Lace will show a DApp Connector prompt — click **Authorize**

> *"You're now connected. The app can read your public key but cannot move your funds without your explicit approval for each transaction."*

---

## Step 3 — Commit Your Bid (4 min)

> *"This is the core of the protocol. You're going to submit a cryptographic commitment — a hash of your bid — without revealing the actual amount."*

1. Navigate to the auction URL: `https://aegis-procure.vercel.app/bid/[auctionId]`
2. Enter a bid amount in the field
   > *"Pick any number — this is a test auction. Your amount will be completely private."*
3. Click **Submit Commitment →**
4. The app generates a random salt and computes `hash(bidAmount, salt)`

> **⚠️ CRITICAL STEP:**
> *"A yellow box will appear with your salt — a long random string. You MUST save this. Copy it to a notes app, a password manager, anywhere safe. If you lose it, you cannot reveal your bid. Ready? Copy it now."*

5. Wait for them to confirm they've saved the salt
6. Click **Approve** in Lace to sign the transaction

> *"Perfect. Your commitment hash is now on the Midnight Preprod blockchain. Nobody — not even us — can see your bid amount from that hash."*

---

## Step 4 — Reveal Your Bid (3 min)

> *"After the auction deadline passes, you'll come back to reveal your bid. The reveal sends your amount and salt as private ZK witnesses — they go into the ZK circuit but never appear on the public ledger."*

1. Return to the same auction URL after the deadline
2. The page will show the **Reveal** phase
3. Click **Reveal Bid (Private Witness) →**
4. Approve in Lace

> *"The ZK circuit has now verified your commitment without exposing your amount. You're done."*

---

## Step 5 — Check Results (1 min)

> *"Once the organizer finalizes the auction, you can see the results."*

1. Navigate to `https://aegis-procure.vercel.app/results/[auctionId]`
2. Show: winner address + winning price
3. Point out: *"Notice there's no list of all bids — only the winner. Everyone else's amount is gone forever."*

---

## Closing (1 min)

> *"That's the full flow. Any questions?"*

**Common questions:**

**Q: What if I lose my salt?**
> *"Unfortunately the bid can't be revealed. That's by design — the salt is what makes the commitment binding. Always save it."*

**Q: Can the organizer see my bid?**
> *"No. The organizer only sees the commitment hash, same as everyone else. The ZK circuit is the only thing that ever processes your raw bid amount."*

**Q: Is this mainnet?**
> *"Not yet — this is Preprod (testnet). Mainnet deployment is planned after the audit."*

**Q: How do I know the winner is correct?**
> *"The ZK circuit enforces the minimum-bid logic. The organizer can't pick a different winner — it's determined by the math."*

---

## Post-Call Actions

- [ ] Confirm their commitment tx hash in the Preprod explorer
- [ ] Add them to the `LAUNCH_USERS.md` table with status "Onboarded"
- [ ] Send follow-up: link to `docs/USAGE.md` and the results page URL
- [ ] Ask for feedback to add to `docs/FEEDBACK.md`
