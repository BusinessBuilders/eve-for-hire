# Eve flow → GitHub review + safe iteration — design proposal

**Status:** DRAFT proposal, pending William's approval. No code written yet.
**Date:** 2026-07-02

## Why

Today the paid flow works (verified in code): chat → Stripe checkout → `paid` → Porkbun
domain register + DNS to Contabo → build (Paperclip swarm or SSH fallback) → deploy to
Contabo behind Caddy → `live`. What's missing is everything *after* the first build:
the generated code never lands in GitHub, there's no human-review gate, no way for a
customer to safely iterate, and no CI to stop a change from breaking the live site.

## Current state (facts, grounded in code)

| Step | Where | Status |
|---|---|---|
| Charge the customer | `app/api/orders/checkout`, `app/api/webhooks/stripe` | ✅ works |
| Register domain + DNS | `lib/porkbun/domain-service.processDomainForOrder` (post-payment `after()`) | ✅ works |
| Build + deploy site | `lib/site/build-service` (SSH→Contabo+Caddy) or Paperclip swarm (`triggerPaperclipBuild` → `build-result` callback) | ✅ works |
| Repo per site + push code | — | ❌ **not built** |
| Human review before live | — | ❌ **not built** |
| Customer iteration loop | chat `DELEGATE_TASK` + `RESET_TO_BUILDING` | ⚠️ partial, no repo tie-in |
| CI so changes don't break | — | ❌ **not built** |
| Rollback a deployment | `lib/github/rollback.ts`, `/api/sites/[id]/rollback` | ⚠️ exists but **orphaned** — nothing populates `order.deploy.githubRepository` |

Key insight: the rollback/`githubRepository` plumbing was designed for a repo-per-site
model that was never wired. This design finishes that intent.

## Recommended decisions (defaults — CONFIRM or override)

1. **Repo model:** one **private repo per site** in your GitHub org, named
   `site-<order.identifier>` (e.g. `BusinessBuilders/site-EVE-1042`). Matches the existing
   `owner/repo` rollback plumbing and gives clean per-customer isolation + handover.
2. **Review model:** a **new site opens a PR that William approves** before it goes live.
   Customers request changes **through Eve chat**; Eve opens a PR; CI must pass; William
   approves; merge → deploy. Quality control stays with you.
3. **CI:** GitHub Actions on each site repo — `build/render check` + link/asset smoke test
   + (later) a visual diff. Merge is blocked unless CI is green.
4. **Deploy trigger:** deploy-on-merge to `main` (a small deploy hook reuses the existing
   `build-service` SSH→Contabo path, pulling from the repo instead of regenerating).
5. **Sequence:** (A) verify money path in Stripe **test mode** → (B) repo-per-site + push +
   review PR → (D) CI gate → (C) customer iteration loop → (E) "open design" integration.

## Open item I cannot default

**E — "open design" integration.** William referenced a GitHub project called "open design"
(analogous to how we used awesome-claude-design for `DESIGN.md`) to give customers better
designs. **I need the exact repo URL** before designing E; there are several "opendesign"
projects and guessing risks integrating the wrong one. E is deferred to its own spec once
the URL is provided. It does not block A–D.

## Proposed architecture (B + D, the core ask)

New module `lib/github/site-repo.ts` (companion to the existing `rollback.ts`):
- `createSiteRepo(order)` — create private repo `site-<identifier>`, seed with the generated
  site files + a standard GitHub Actions CI workflow, set `order.deploy.githubRepository` /
  `githubBranch`. Idempotent (skip if repo already recorded).
- `pushSiteCode(order, files, message)` — commit generated files to a branch.
- `openReviewPR(order, branch, title)` — open a PR `build → main` for human review.

New order lifecycle (extends, doesn't replace, the state machine):
- After a successful build, instead of going straight to `live`, the swarm/build-service
  writes code to the repo on a `build/initial` branch and opens a **review PR**. Order enters
  a new `in_review` state (added to `OrderState` + transitions). William merges → deploy hook
  runs `build-service` deploy phase from the merged code → `live`.
- Iteration: customer asks Eve for a change → Eve (via `delegateChatIntent`) has the swarm
  produce a diff on a new branch → PR → CI → William approves → merge → redeploy.

CI (`.github/workflows/site-ci.yml`, seeded into each site repo):
- Install + build/validate the static site, run a link/asset smoke test, fail the check on
  broken output. Optional visual-regression later. Branch protection on `main` requires the
  check to pass before merge.

Deploy-on-merge:
- A `repository_dispatch`/webhook (or a scheduled pull) triggers
  `POST /api/orders/[orderId]/build` in "deploy from repo" mode → existing SSH→Contabo+Caddy
  path uploads the merged code → `live`.

## Interfaces / isolation

Each unit is independently testable:
- `site-repo.ts`: given an order + files, produces a repo/branch/PR. Depends only on Octokit
  + `GITHUB_TOKEN`. No coupling to build-service internals.
- CI workflow: pure GitHub Actions, no app dependency.
- Deploy hook: reuses `build-service` deploy phase; the only new surface is "source = repo".

## Error handling

- Repo create/push failures → order to `build_failed` with a clear note (retryable), site is
  never left half-published (deploy only fires on merge).
- CI red → PR cannot merge; customer/Eve sees the failing check; no deploy.
- Deploy-from-merge failure → existing `deploy_failed` + retry path; last-good commit stays
  live; `rollback.ts` can revert.

## Non-goals (YAGNI for now)

- Transferring repos to customers' own GitHub accounts (revisit at handover if wanted).
- Monorepo model (rejected — weaker isolation/handover).
- Auto-merge without human review (rejected for v1 — you wanted human review).

## Verification plan

- A: one Stripe **test-mode** checkout end-to-end (test card), confirming `paid` →
  domain step → build, without spending real domain money (use the existing-domain path or a
  throwaway TLD, or stub Porkbun in test mode).
- B/D: create a repo for a test order, push, open PR, confirm CI runs and blocks on failure,
  merge, confirm deploy-on-merge brings the test site live, then tear down.

---

## Live test findings (2026-07-02) — customer purchase flow on prod

Drove the real customer flow on eve.center (logged in), Stripe confirmed in **test mode**.
Goal: register hireeve.com the customer way. Two blocking issues found:

1. **Checkout handoff is broken (revenue-blocking).** Chat → domain search → select
   hireeve.com → requirements all work. But the **freemium "10 free messages" wall triggers
   during qualifying, before Eve emits the checkout card**, and the paywall's
   "Build your site — $89 + $29/mo" button links to `https://eve.center/#hire` (the homepage),
   **not** to a Stripe checkout that creates the pending order (with `desiredDomain=hireeve.com`).
   Net: a customer who configures a site+domain then hits the wall has **no path to pay** for it,
   and the domain never registers.
   - Fix: paywall CTA (and a real "Checkout" affordance) must `POST /api/orders/checkout` to
     create the Stripe session for the in-progress order; and the free-message gate should let a
     ready-to-buy customer reach checkout.

2. **Porkbun account cannot register (no payment method).** Direct `POST /domain/create` for
   hireeve.com returns **HTTP 500 (empty body)** — Porkbun's failure mode when the account has no
   card/funds on file (matches William's "not sure I have a card there"). hireeve.com confirmed
   **still available, no charge, nothing registered.** Blocked until William adds a payment method
   to Porkbun. (Claude cannot add card details — hard rule.)

**Status:** hireeve.com NOT registered. Flow proven to work up to checkout; checkout + payment-
method are the two gaps to close before a customer (or a test) can complete a purchase.

**UPDATE (later 2026-07-02):** gap #1 is **FIXED and prod-verified** (commit `3685a74`) — the
paywall now recovers the pending domain from chat history and renders the real checkout card;
a live run created Stripe test session `cs_test_b1cFQWTs…` and order `b42ac8c2` in
`payment_pending` with `desiredDomain: hireeve.com`. Only gap #2 (Porkbun payment method,
William) remains before the purchase can complete and the domain registers.
