# Aegis Procure — Launch Checklist

> Final checklist for Level 6 submission and public launch on Midnight Preprod.

---

## ✅ Smart Contract

- [x] `contract/aegis.compact` — Compact contract written
- [x] All 4 exported circuits implemented: `createAuction`, `commitBid`, `revealBid`, `finalizeAuction`
- [x] Privacy model enforced: raw bid amounts never in `ledger {}`, `disclose()` only on winner
- [x] Duplicate commitment prevention added (`assert !commitments.contains(caller)`)
- [x] Contract compiled with `compactc` — ZK circuits in `/managed`
- [x] Contract deployed to Midnight Preprod
- [x] Contract address recorded in `README.md`

---

## ✅ Tests (Level 3 — 6 required)

- [x] Test 1: `createAuction` sets correct deadline
- [x] Test 2: `commitBid` stores correct hash
- [x] Test 3: `revealBid` succeeds with correct salt
- [x] Test 4: `revealBid` FAILS with incorrect salt
- [x] Test 5: `revealBid` FAILS before deadline
- [x] Test 6: `finalizeAuction` correctly discloses minimum bid and winner
- [x] All tests passing: `npm test`

---

## ✅ Frontend

- [x] `/` — Landing page with hero, 3-phase explainer, privacy guarantee
- [x] `/create` — Organizer auction creation form
- [x] `/bid/[id]` — Bidder commit → reveal flow with ZK witnesses
- [x] `/results/[id]` — Public winner dashboard (winner + price only)
- [x] Salt copy-to-clipboard + save warning (Level 5 feedback fix)
- [x] Human-readable deadline display (`src/lib/utils.ts`)
- [x] Error boundary on revealBid ZK proof failure
- [x] Loading state on finalizeAuction

---

## ✅ Documentation

- [x] `README.md` — Final version with contract address, live demo, Level 6 table
- [x] `docs/USAGE.md` — Full organizer + bidder walkthrough
- [x] `docs/FEEDBACK.md` — Level 5 feedback + improvements implemented
- [x] `docs/BRAND_BRIEF.md` — Visual identity, voice, positioning
- [x] `docs/ONBOARDING_SCRIPT.md` — 15-min call script for launch cohort
- [x] `docs/DEMO_VIDEO_CHECKLIST.md` — Demo video script + production guide

---

## ✅ Launch Users

- [x] `LAUNCH_USERS.md` created with 20 Preprod wallet addresses
- [x] Onboarding script prepared (`docs/ONBOARDING_SCRIPT.md`)
- [ ] All 20 users contacted
- [ ] ≥ 10 users completed commit phase
- [ ] ≥ 5 users completed reveal phase
- [ ] First live auction finalized on Preprod

---

## ✅ Brand & Social

- [ ] X/Twitter profile updated with Aegis Procure bio + link
- [ ] Demo video recorded and uploaded (see `docs/DEMO_VIDEO_CHECKLIST.md`)
- [ ] Demo video posted on X/Twitter with @MidnightNtwrk tag
- [ ] Posted in Midnight Discord #builders channel
- [ ] Open Graph image added to Next.js app

---

## ✅ Git History

- [x] ≥ 30 commits with conventional commit messages
- [x] Commits are atomic and logically grouped
- [x] No secrets committed (`.env.local` in `.gitignore`)
- [x] `managed/` (ZK circuit output) in `.gitignore`

---

## ✅ Postman

- [x] Collection covers full auction lifecycle (6 requests)
- [x] All 6 test scripts written and passing
- [x] Environment file with all required variables
- [x] Collection importable from `postman/` directory

---

## Final Submission

- [ ] GitHub repo URL submitted to Rise In
- [ ] Demo video URL submitted to Rise In
- [ ] Contract address submitted to Rise In
- [ ] `LAUNCH_USERS.md` submitted to Rise In

---

_Last updated: Level 6 submission_
