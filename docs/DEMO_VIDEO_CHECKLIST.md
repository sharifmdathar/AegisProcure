# Aegis Procure — Demo Video Checklist

> Target length: 3–5 minutes. Screen recording + voiceover. No face cam required.

---

## Pre-Production

- [ ] Set browser to 1920×1080, zoom 100%
- [ ] Use a clean browser profile (no personal bookmarks visible)
- [ ] Lace wallet connected to Preprod with tDUST balance visible
- [ ] Have two browser windows ready: organizer + bidder
- [ ] Disable notifications (macOS: Do Not Disturb / Linux: notification pause)
- [ ] Record audio in a quiet room — no background noise
- [ ] Use OBS Studio or Loom for screen + audio capture

---

## Script Outline

### 0:00 — Hook (15 sec)
> *"Every year, governments lose billions to bid-rigging. What if the auction system itself made cheating mathematically impossible?"*

- Show the Aegis Procure landing page
- Highlight the tagline: *"Trustless Procurement. Zero Bid Leakage."*

---

### 0:15 — Problem Statement (30 sec)
> *"Traditional sealed-bid auctions rely on trust: trust that the procurement officer won't leak bids, trust that the database isn't compromised. Aegis Procure removes trust from the equation entirely."*

- Show a simple diagram: Traditional (bids visible to admin) vs Aegis (bids in ZK circuit only)

---

### 0:45 — Tech Overview (30 sec)
> *"Built on the Midnight blockchain using Compact smart contracts and ZK proofs. Three phases: Commit, Reveal, Finalize."*

- Show the "How It Works" section on the landing page
- Point to each phase card briefly

---

### 1:15 — Live Demo: Create Auction (45 sec)
1. Navigate to `/create`
2. Fill in auction title and deadline
3. Click **Deploy Auction Contract →**
4. Show Lace wallet approval prompt
5. Show confirmation with auction ID

> *"The organizer deploys the contract to Midnight Preprod. The deadline is now locked on-chain."*

---

### 2:00 — Live Demo: Commit Bid (60 sec)
1. Switch to bidder window
2. Navigate to `/bid/[auctionId]`
3. Enter a bid amount
4. Click **Submit Commitment →**
5. Show the salt warning banner — copy the salt
6. Show Lace approval
7. Show the commitment hash on-chain

> *"The bidder's amount never leaves the browser as plaintext. Only the hash goes on-chain."*

---

### 3:00 — Live Demo: Reveal + Finalize (45 sec)
1. Advance past deadline (use a test auction with a past deadline)
2. Click **Reveal Bid (Private Witness) →**
3. Show Lace approval
4. Switch to organizer — click **Finalize Auction**
5. Navigate to `/results/[auctionId]`
6. Show: winner address + winning price only

> *"Only the winner is disclosed. The other 6 bids? Gone forever. That's the ZK guarantee."*

---

### 3:45 — Privacy Proof Callout (30 sec)
- Zoom in on the Privacy Proof checklist on the results page
- Read each checkmark aloud

> *"Raw bid amounts: never on the ledger. disclose() called only on the winner. Losing bids: permanently private."*

---

### 4:15 — Closing (15 sec)
> *"Aegis Procure. Trustless procurement on Midnight. The code is open source — link in the description."*

- Show GitHub repo URL
- Show contract address on Preprod explorer

---

## Post-Production

- [ ] Trim silence at start/end
- [ ] Add captions (auto-generate + review)
- [ ] Add chapter markers matching the script outline above
- [ ] Export: MP4, H.264, 1080p, ≤ 500MB
- [ ] Upload to YouTube (unlisted first for review, then public)
- [ ] Add to README.md as a demo link

---

## Upload Checklist

- [ ] Title: *"Aegis Procure — ZK Sealed-Bid Auctions on Midnight Blockchain"*
- [ ] Description includes: contract address, GitHub link, Midnight network link
- [ ] Tags: midnight blockchain, ZK proofs, sealed bid auction, compact, govtech, web3
- [ ] Thumbnail: dark background, purple accent, tagline text
- [ ] Post link in Midnight Discord #builders channel
- [ ] Post link on X/Twitter with @MidnightNtwrk tag
