# Level 6 — What To Do For Each Step

Status guide for completing the Midnight Builder Challenge (Level 6). Docs are written; the remaining work is redeploy, real values, and onboarding.

## Quick status

| Area | Status |
|------|--------|
| Documentation (FEEDBACK, USAGE, README structure, brand, onboarding, demo checklist) | ✅ Done |
| Contract address (Preview) | ✅ Done — `f3f925b30c5ea1ac029f651f6f3738494a5031f1d9fe4d829ab99ab0cff4c871` (Preprod = ⏳ pending network) |
| Preprod Postman environment | ❌ Mislabeled as "Preview", empty address |
| 20 users onboarded (LAUNCH_USERS.md) | ❌ 0 / 20 |
| README placeholders (X profile, CI badge, brand assets) | ❌ Not filled |
| Demo video | ❌ Not recorded |
| 30 commits | ⚠️ Verify |

---

## Step 1 — File structure ✅ (with 2 minor notes)
Structure is in place. Two cosmetic differences from the spec:
- Directory is `contract/` (singular), not `contracts/`. It contains `aegis.compact` — functionally correct.
- No top-level `tests/` dir; tests live at `contract/src/test/aegis.test.ts`.
- Action: Optional. Rename/move only if the challenge grader requires exact paths. Otherwise leave as-is.

## Step 2 — Feedback improvements ✅
`docs/FEEDBACK.md` has the `## Level 6 Improvements` table filled in (3 changes). No action needed unless you make more changes.

## Step 3 — Deployed to PREVIEW ✅ (Preprod redeploy still pending)
Deployed to PREVIEW (Preprod network was down at deploy time). Contract address: `f3f925b30c5ea1ac029f651f6f3738494a5031f1d9fe4d829ab99ab0cff4c871`. Redeploy to Preprod and swap the address in README/USAGE/env/Postman once Preprod is back.

Already updated for Preview:
- `README.md` — Contract Address table now shows the live Preview address; Preprod row marked pending.
- `docs/USAGE.md` — "Getting Started on Preview" section now uses the real address.
- `.env.local` — `NEXT_PUBLIC_CONTRACT_ADDRESS` set; network vars already point at Preview.

Still to do once Preprod is available:
1. Redeploy your updated contract to Preprod using your deploy command (from your Midnight tooling / scripts).
2. Copy the new Preprod contract address it prints.
3. Swap the address into README/USAGE/env and the Postman environment (see Step 3b).
4. Search the repo for stale/dummy addresses and replace them.

## Step 3b — Fix the Preprod Postman environment ❌
`midnight-preprod.postman_environment.json` is actually named "Midnight Preview", points at the Preview indexer (`https://indexer.preview.midnight.network/api/v3`), and has an empty `contractAddress`.
- Rename it to a Preprod environment.
- Point `baseUrl` at the Preprod indexer.
- Set `contractAddress` to the real deployed Preprod address from Step 3.

## Step 4 — docs/USAGE.md ✅ (Preview address filled)
Both required sections exist ("Getting Started on Preview", "Your First Transaction"). The contract address is now filled in with the live **Preview** address `f3f925b30c5ea1ac029f651f6f3738494a5031f1d9fe4d829ab99ab0cff4c871`, and a note explains a Preprod deployment will follow once Preprod is back. Swap in the Preprod address later when redeployed.

## Step 5 — LAUNCH_USERS.md ❌ (0 / 20)
File is created correctly but all 20 wallet rows are placeholders and count is `0 / 20`.
- Onboard real users (use `docs/ONBOARDING_SCRIPT.md`).
- As each user confirms their wallet, add their address + date to the table and bump "Current count".
- Also `USERS.md` still has 5 placeholder Level-5 wallets — fill or confirm those.

## Step 6 — README.md ❌ (placeholders to fill)
All sections exist. Replace these placeholders:
- Contract Address → real Preprod address (from Step 3)
- CI badge → `<<GITHUB_OWNER_REPO>>` → your `owner/repo`
- Product X Profile → `<<X_PROFILE_URL>>` → your X profile link
- Brand Assets → check the boxes and add logo/banner links once created

## Step 7 — Brand brief ✅
`docs/BRAND_BRIEF.md` is complete (tagline, messages, palette, X bio, banner concept). Action: create the actual brand assets (logo/banner) from this brief and link them in README.

## Step 8 — Onboarding script ✅
`docs/ONBOARDING_SCRIPT.md` is complete. Action: send it to your 20 users.

## Step 9 — Demo video checklist ✅
`docs/DEMO_VIDEO_CHECKLIST.md` is complete. Action: record the video following it, showing:
- Preprod contract address visible on screen
- Full flow from wallet connect to on-chain result
- Privacy model working end to end

## Step 10 — Final checklist
- [x] Contract redeployed (to **Preview** — Preprod network was down at deploy time; Preprod redeploy still pending)
- [x] Contract address in README.md — done for **Preview** (`f3f925b30c5ea1ac029f651f6f3738494a5031f1d9fe4d829ab99ab0cff4c871`); Preprod address pending redeploy
- [x] Feedback improvements implemented and documented
- [x] docs/USAGE.md updated for final version (except address value)
- [x] LAUNCH_USERS.md created (0/20 users onboarded)
- [x] Complete README.md with all sections (placeholders remain)
- [x] Brand brief written
- [x] Onboarding script ready
- [x] File structure matches spec (minor naming diffs)

## Reminders before final submission
- Redeploy contract to Preprod and paste the real address everywhere
- Onboard 20 users and fill LAUNCH_USERS.md to 20/20
- Create brand assets (logo/banner) and link them
- Update X profile + link it in README
- Record the demo video
- Make 30 commits
