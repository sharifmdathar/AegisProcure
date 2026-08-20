# Level 5 Feedback & Improvements

## Feedback Received

### Issue 1 — Salt storage UX
**Problem:** Users had no clear guidance on where to store their salt after the commit phase. If the salt is lost, the bid cannot be revealed.
**Fix:** Added a prominent warning banner in `/bid/[id]/page.tsx` with a copy-to-clipboard button and a reminder to save the salt before proceeding.

### Issue 2 — Deadline display
**Problem:** The auction deadline was stored as a raw Unix timestamp (Uint<64>) with no human-readable display in the frontend.
**Fix:** Added `formatDeadline()` utility in `src/lib/utils.ts` that converts the on-chain timestamp to a locale-aware date string.

### Issue 3 — Missing error boundary on revealBid
**Problem:** If the ZK proof generation failed (e.g. proof server timeout), the UI showed a blank screen.
**Fix:** Added a try/catch with a user-facing error message and a "Retry" button in the reveal phase of `/bid/[id]/page.tsx`.

### Issue 4 — No loading state on finalizeAuction
**Problem:** The organizer had no feedback while `finalizeAuction()` was being processed on-chain.
**Fix:** Added a spinner and "Finalizing on Midnight…" status message to the results page.

### Issue 5 — commitBid allowed duplicate submissions
**Problem:** A bidder could overwrite their commitment by calling `commitBid` twice, potentially gaming the system.
**Fix:** Added an assertion in `contract/aegis.compact`: `assert !ledger.commitments.contains(caller) "Commitment already submitted"`.

---

## Improvements Implemented

| # | Area | Change | File |
|---|------|--------|------|
| 1 | UX | Salt copy-to-clipboard + save warning | `src/app/bid/[id]/page.tsx` |
| 2 | UX | Human-readable deadline display | `src/lib/utils.ts` |
| 3 | Reliability | Error boundary on revealBid ZK proof failure | `src/app/bid/[id]/page.tsx` |
| 4 | UX | Loading state on finalizeAuction | `src/app/results/[id]/page.tsx` |
| 5 | Security | Prevent duplicate commitments | `contract/aegis.compact` |

---

## Privacy Model — Unchanged

The core privacy invariants were not affected by any of the above changes:
- Raw bid amounts are still never written to the public ledger
- `disclose()` is still called only on the winner and winning price
- All bid data still flows through ZK circuit witnesses only

---

## Level 6 Improvements

| Change | User Feedback That Triggered It | Status |
|--------|--------------------------------|--------|
| Redeployed contract to Preprod for a stable public testnet | Users on Level 5 reported the Preview endpoint was unstable | Done |
| Clarified privacy model (PUBLIC / PRIVATE / PROVES) in README & USAGE | Testers were unsure what data was on-chain vs private | Done |
| Added CI pipeline running the contract test suite on every push | Contributors wanted confidence tests pass before merge | Done |
