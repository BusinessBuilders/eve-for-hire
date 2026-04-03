# Eve for Hire — E2E Smoke Test Runbook

Full pipeline: chat → qualify → domain search → checkout → payment → domain registration → site build → deploy → live HTTPS.

## Prerequisites

- Dev server running: `npm run dev` (or production at `https://eve.center`)
- Stripe test mode enabled (Stripe dashboard)
- Porkbun API keys set: `PORKBUN_API_KEY`, `PORKBUN_SECRET_KEY`
- VPS accessible: `CONTABO_VPS_IP`, `CONTABO_SSH_PRIVATE_KEY`
- SMTP configured or check server logs to confirm email would send

## Step 1 — Automated API Tests

Run first to catch regressions before manual testing:

```bash
./scripts/smoke-test.sh
# or against production:
BASE_URL=https://eve.center ./scripts/smoke-test.sh
```

All 8 checks must PASS before continuing.

## Step 2 — Chat & Qualify

1. Open `/chat`
2. Type: *"I run a plumbing business in Austin, TX and need a website"*
3. **Expected:** Eve asks qualifying questions (business name, services, style)
4. Complete the flow — provide: business name, services, style preferences
5. **Expected:** Eve suggests domain names and shows the domain results card

## Step 3 — Domain Selection

6. Domain availability card appears
7. Click **Select →** on an available domain
8. **Expected:** Eve shows the checkout card with pricing ($89 first month)

## Step 4 — Checkout

9. Enter a test email address
10. Click **Proceed to Checkout →**
11. **Expected:** Stripe Checkout opens in a new tab

## Step 5 — Stripe Payment (Test Mode)

12. Use test card: `4242 4242 4242 4242`, exp `12/29`, CVC `123`, ZIP `10001`
13. Click **Pay**
14. **Expected:** Redirected to `/support/success` with order confirmation

## Step 6 — Verify Order State

```bash
curl http://localhost:3000/api/orders | jq '.[0] | {state, identifier, domain}'
```

**Expected:** `state: "building"` or later (pipeline running).

## Step 7 — Site Build & Deploy (5–10 min)

Monitor VPS for the 4 HTML files:

```bash
ssh root@$CONTABO_VPS_IP "ls /var/www/sites/{domain}/"
# Expected: index.html  about.html  services.html  contact.html
```

## Step 8 — DNS Propagation

```bash
dig +short {domain} @8.8.8.8
# Expected: resolves to $CONTABO_VPS_IP (can take up to 5 minutes)
```

## Step 9 — Live Site Checklist

Visit `https://{domain}` and verify:

- [ ] `index.html` — hero, features, about section, nav links all work
- [ ] `about.html` — story and mission content visible
- [ ] `services.html` — services grid with icons and descriptions
- [ ] `contact.html` — contact details + form renders
- [ ] Contact form submits → "Message sent!" → check server logs for `[contact]` line
- [ ] HTTPS certificate valid (green padlock — Caddy auto-provisions via Let's Encrypt)
- [ ] Returning user: close tab, reopen `/chat` → "Welcome back!" banner appears

## Step 10 — Verify Order is Live

```bash
curl http://localhost:3000/api/orders | jq '.[0] | {state, "url": .deploy.siteUrl}'
# Expected: state: "live", url: "https://{domain}"
```

## Stripe Test Cards

| Scenario | Card Number |
|----------|-------------|
| Payment succeeds | `4242 4242 4242 4242` |
| Card declined | `4000 0000 0000 0002` |
| Insufficient funds | `4000 0000 0000 9995` |
| 3D Secure required | `4000 0025 0000 3155` |

All cards: expiry `12/29`, any 3-digit CVC, any 5-digit ZIP.

## Failure Recovery

| Symptom | Check | Fix |
|---------|-------|-----|
| Domain card never appears | `GET /api/domains/search?q=test` | Verify `PORKBUN_API_KEY` |
| Checkout fails | Browser console + server logs | Verify `STRIPE_SECRET_KEY` |
| Order stuck in `building` | Server logs for SSH errors | Verify `CONTABO_VPS_IP`, `CONTABO_SSH_PRIVATE_KEY` |
| Site not live after 10 min | DNS check + Caddy logs on VPS | Manual `caddy reload` on VPS |
| Contact form no email | Server logs for `[contact]` | Verify `SMTP_HOST/USER/PASS` env vars |
| Returning user banner missing | Browser localStorage tab | Check `eve-session` key exists in localStorage |
