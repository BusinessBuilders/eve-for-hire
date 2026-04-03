# Phase 1 Product Hardening Design

**Date:** 2026-04-03  
**Author:** CTO Agent (BUS-99)  
**Status:** Approved for implementation

## Overview

Four features to harden the Phase 1 product: multi-page sites, working contact forms, re-engagement session persistence, and a smoke test script. All changes are additive — the existing single-page pipeline remains intact and these features layer on top.

---

## Feature 1: Multi-page Site Support

### Problem
`lib/site/template.ts` renders a single `index.html`. Customers get one page with hero, features, about, and a CTA banner — no dedicated Services, About, or Contact pages.

### Design

**Content schema extension** (`lib/site/content-generator.ts`):
Add optional page-specific fields to `SiteContent`:
```typescript
servicesPage?: {
  intro: string;
  items: Array<{ icon: string; title: string; description: string; price?: string }>;
};
aboutPage?: {
  story: string;
  mission: string;
};
contactPage?: {
  address?: string;
  phone?: string;
  hours?: string;
};
```
These are optional so existing orders continue to build correctly.

**Template changes** (`lib/site/template.ts`):
- Replace `renderSiteHtml(content, domain): string` with `renderSitePages(content, domain): Record<string, string>` returning `{ 'index.html', 'about.html', 'services.html', 'contact.html' }`.
- All pages share a common nav: `Home | About | Services | Contact` with relative links (`href="about.html"` etc.).
- **index.html** — existing hero + features + about-teaser + CTA.
- **about.html** — full about story + mission + blob visual.
- **services.html** — services grid with icon/title/description/optional price per item.
- **contact.html** — contact details (address/phone/hours) + embedded contact form (see Feature 2).
- All pages share the same CSS (inlined per-file for zero-dependency static hosting).

**Build service changes** (`lib/site/build-service.ts`):
- Call `renderSitePages()` instead of `renderSiteHtml()`.
- Upload each file: `${siteRoot}/index.html`, `.../about.html`, `.../services.html`, `.../contact.html`.
- All other build/deploy logic unchanged.

**Content generation changes**:
- Extend the AI prompt to elicit services list and about details.
- Eve's qualifying conversation should gather: list of services offered (with rough prices if available), business story/mission, contact details.
- Fallbacks populate placeholder content so the build never fails.

### Trade-offs considered
- **SPA with JS router** — rejected: unnecessary complexity for static business sites, worse SEO.
- **Server-side pages** — rejected: overkill, requires VPS to run Node.js.
- **Multi-file static HTML** (chosen) — simplest, works with Caddy static serving, no JS required, best SEO.

---

## Feature 2: Contact Form Backend

### Problem
Generated sites use `mailto:` links only. Clicking "Contact Us" opens the user's mail client, which many mobile users don't have configured. No reliable way for site visitors to reach businesses.

### Design

**API route**: `app/api/contact/[domain]/route.ts`
- Accepts `POST` with JSON body: `{ name: string, email: string, message: string }`
- Rate limited: 5 submissions per IP per hour (stricter than chat, prevents spam)
- CORS: allow `*` (form is on a customer domain, not eve.center)
- Looks up customer email: `orderStore.findByDomain(domain)` → `order.customerEmail`
- Sends email via Nodemailer (SMTP): forwards the visitor's message to the business owner
- Returns `{ ok: true }` or `{ error: string }`

**Order store extension** (`lib/order/store.ts`):
Add `findByDomain(domain: string): Promise<Order | null>` to the interface and SQLite implementation.
Uses JSON extraction: `WHERE json_extract(data, '$.domain.domain') = ?`

**Email library**: Add `nodemailer` + `@types/nodemailer` to `package.json`.

**New env vars**:
- `SMTP_HOST` — e.g., `smtp.sendgrid.net`
- `SMTP_PORT` — e.g., `587`
- `SMTP_USER` — SMTP username
- `SMTP_PASS` — SMTP password/API key
- `SMTP_FROM` — sender address, e.g., `"Eve <hello@eve.center>"`

**Contact form HTML** (rendered inside `contact.html`):
- Static HTML form with name/email/message fields
- Inline JS that intercepts submit, POSTs to `https://eve.center/api/contact/{domain}`, shows success/error message in-page
- No external dependencies — pure fetch() call
- Domain is embedded at build time in the generated HTML

**Email body**:
```
Subject: New contact from {visitorName} via {domain}

You received a new message on your website {domain}:

From: {visitorName} <{visitorEmail}>
Message:
{visitorMessage}

---
Sent via Eve for Business (eve.center)
```

### Trade-offs considered
- **Third-party form service (Formspree)** — rejected: introduces external dependency in customer HTML, adds cost, limits customization.
- **Server on VPS** — rejected: requires deploying a Node.js process per site, complex and fragile.
- **Eve.center API route** (chosen) — reuses existing infrastructure, centralizes email credentials, consistent with how domain search and checkout work.

---

## Feature 3: Re-engagement / Session Persistence

### Problem
`app/chat/page.tsx` uses `sessionStorage` for the Eve session ID. Closing or refreshing the tab generates a new UUID, losing the OpenClaw conversation context. Users who start the qualifying flow then drop off cannot resume.

### Design

**Change** (`app/chat/page.tsx`):
- Replace `sessionStorage` with `localStorage` for storing `eve-session` ID.
- On mount: check if session ID already existed in `localStorage` (vs. being newly created this mount).
- Expose `isReturningUser: boolean` state.
- If `isReturningUser && messages.length === 0`: render a "Welcome back!" prompt above the suggestions, with a "Start fresh" button that generates a new UUID and clears `localStorage`.

**Session resume behavior**:
- The `x-eve-session` header sent to `/api/chat` is the same UUID → OpenClaw resumes the same conversation thread.
- No server-side changes needed — session state lives in OpenClaw, keyed by session UUID.

**UI addition**:
```
┌─────────────────────────────────────────────┐
│ 👋 Welcome back! Your conversation is saved. │
│ [Continue] or [Start fresh →]               │
└─────────────────────────────────────────────┘
```
Shown only when empty messages + returning session. Clicking "Continue" dismisses the banner and the user types normally. Clicking "Start fresh" generates a new UUID.

### Trade-offs considered
- **Database-backed sessions** — rejected for Phase 1: requires server-side conversation replay, complex. Plan for Phase 2.
- **Cookie-based sessions** — rejected: same as localStorage for our use case, more complexity.
- **localStorage** (chosen) — 1-line change in session ID storage, immediate UX win, works with existing OpenClaw session keying.

---

## Feature 4: Smoke Test Script

### Problem
No automated or documented way to verify the Phase 1 E2E pipeline. The full path (chat → qualify → domain search → checkout → payment → domain → build → deploy → live) must be verifiable.

### Design

**Automated script** (`scripts/smoke-test.sh`):
Tests all API endpoints with curl. Can run in CI or locally.

Tests:
1. `GET /` — expect 200 (landing page loads)
2. `POST /api/chat` — expect 200 with SSE stream (Eve responds)
3. `GET /api/domains/search?q=test` — expect 200 with results array
4. `POST /api/orders/checkout` — expect 400 (missing fields, validates request parsing works)
5. `GET /api/orders` — expect 200 with orders array
6. `GET /api/orders/:id` — expect 404 for fake ID (validates route is live)

Script accepts `BASE_URL` env var (default: `http://localhost:3000`).
Outputs PASS/FAIL per test with colored output.
Exits 0 if all pass, 1 if any fail.

**Manual E2E runbook** (`docs/smoke-test-runbook.md`):
Step-by-step instructions for testing the full payment + domain + build pipeline with:
- Stripe test card numbers
- Expected state transitions at each step
- How to verify the live site is up

---

## Files Changed

| File | Change |
|------|--------|
| `lib/site/content-generator.ts` | Extend `SiteContent` schema with optional page fields; extend AI prompt |
| `lib/site/template.ts` | Replace `renderSiteHtml()` with `renderSitePages()` returning multi-file map |
| `lib/site/build-service.ts` | Upload all 4 files; call `renderSitePages()` |
| `lib/order/store.ts` | Add `findByDomain()` to interface + SQLite impl |
| `lib/order/types.ts` | No change needed |
| `app/api/contact/[domain]/route.ts` | **New** — contact form handler |
| `app/chat/page.tsx` | `sessionStorage` → `localStorage` + returning user banner |
| `scripts/smoke-test.sh` | **New** — automated API smoke tests |
| `docs/smoke-test-runbook.md` | **New** — manual E2E runbook |
| `package.json` | Add `nodemailer`, `@types/nodemailer` |

## Environment Variables Added

| Var | Purpose | Required |
|-----|---------|----------|
| `SMTP_HOST` | SMTP server hostname | Yes (for contact form) |
| `SMTP_PORT` | SMTP port (usually 587) | Yes |
| `SMTP_USER` | SMTP username | Yes |
| `SMTP_PASS` | SMTP password or API key | Yes |
| `SMTP_FROM` | Sender display + address | Yes |

## Success Criteria

- [ ] Generated sites have 4 pages with working inter-page navigation
- [ ] Contact form on generated sites submits successfully and customer receives email
- [ ] Users who close and reopen Eve chat can resume the same qualifying session
- [ ] `scripts/smoke-test.sh` passes all 6 automated checks against local dev server
- [ ] `npm run build` passes with no TypeScript errors
