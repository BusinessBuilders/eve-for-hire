# eve.center — Technical Documentation & Replication Guide

**Generated:** 2026-04-02  
**Version:** Current as of commit `99ecfc7`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [What Was Built](#2-what-was-built)
3. [Infrastructure Setup](#3-infrastructure-setup)
4. [Environment Variables](#4-environment-variables)
5. [Replication Guide](#5-replication-guide)
6. [Known Issues & Workarounds](#6-known-issues--workarounds)

---

## 1. Architecture Overview

eve.center is a full-stack AI sales agent that qualifies customers, takes payment, registers a domain, generates a website, and deploys it — end-to-end without human involvement.

```
                         ┌─────────────────────────────────┐
                         │         Visitor Browser          │
                         └────────────┬────────────────────┘
                                      │ HTTPS
                         ┌────────────▼────────────────────┐
                         │   nginx (Contabo VPS :443)       │
                         │   SSL via Let's Encrypt          │
                         │   proxy_read_timeout 120s        │
                         └────────────┬────────────────────┘
                                      │ HTTP :3000
                         ┌────────────▼────────────────────┐
                         │   Next.js App (PM2)              │
                         │   /app/                          │
                         │   Landing page, Chat UI          │
                         │   Order pages, API routes        │
                         └──┬───────────┬──────────────────┘
                            │           │
          ┌─────────────────▼──┐   ┌────▼──────────────────────┐
          │  OpenClaw Gateway  │   │  SQLite (better-sqlite3)   │
          │  (Nova, Jetson     │   │  /var/data/orders.db       │
          │   Orin + 8xRTX     │   │  Order state machine       │
          │   3090)            │   └───────────────────────────┘
          │  via reverse SSH   │
          │  tunnel :8097      │
          └────────────────────┘

                    ┌──────────────────────────────┐
                    │      External Services        │
                    │                              │
                    │  Stripe — payments           │
                    │  Porkbun — domain registry   │
                    │  Anthropic — site content gen│
                    │  Contabo VPS SSH — site      │
                    │    deploy target             │
                    └──────────────────────────────┘

                    ┌──────────────────────────────┐
                    │    GitHub Actions CI/CD       │
                    │    .github/workflows/         │
                    │    deploy-vps.yml             │
                    │    On push to main:           │
                    │    SSH pull + npm build       │
                    │    + pm2 reload               │
                    └──────────────────────────────┘

                    ┌──────────────────────────────┐
                    │  Customer Site Hosting        │
                    │  (same Contabo VPS)           │
                    │  Caddy — auto HTTPS           │
                    │  /var/www/sites/{domain}/     │
                    │  /etc/caddy/sites/*.caddy     │
                    └──────────────────────────────┘
```

### Component Summary

| Component | Technology | Role |
|-----------|-----------|------|
| Frontend | Next.js 15 (App Router) | Landing page, chat UI, order tracking |
| Chat AI | OpenClaw HTTP Proxy -> Nova | Eve's sales/qualifying conversation |
| Payments | Stripe Checkout (subscription) | $89 first month + $29/mo |
| Domain registry | Porkbun API | Domain availability search + registration |
| Order store | SQLite (better-sqlite3) | Persistent order state machine |
| AI content gen | AI SDK + Anthropic Claude | Generates customer website copy |
| Site hosting | Caddy (same VPS) | Per-customer static site + auto HTTPS |
| Site deployment | SSH2 (Node.js) | Pushes HTML + Caddy config over SSH |
| Process manager | PM2 | Keeps Next.js running across reboots |
| Reverse proxy | nginx | TLS termination for eve.center |
| CI/CD | GitHub Actions | Auto-deploys app on push to main |

---

## 2. What Was Built

### 2.1 Landing Page

**Files:** `app/page.tsx`, `index.html`, `globals.css`

A client-rendered Next.js page with GSAP scroll animations introducing Eve, her mission (earning $43,000 for a Unitree G1 humanoid body), and her services. Includes:

- Mission counter (live fund progress)
- Service cards (chat, domain, build, deploy)
- Tip jar with Stripe checkout ($5 / $20 / $50 tips)
- Chat widget

The `index.html` in root is an older static version kept as a fallback reference; the canonical frontend is the Next.js app.

### 2.2 AI Chat Interface (Eve Sales Agent)

**Files:** `app/api/chat/route.ts`, `app/chat/`

Eve talks to customers via the `/api/chat` endpoint. The flow:

1. Browser sends a message in AI SDK v6 `UIMessage` format (via `DefaultChatTransport`).
2. The API route validates the message, rate-limits by IP (20 req/min), and screens for prompt injection.
3. The message is forwarded to the **OpenClaw HTTP proxy** running on the VPS at `http://127.0.0.1:8097`, which bridges to Nova (Eve's AI brain on the Jetson Orin hardware) via a reverse SSH tunnel.
4. Eve's response is parsed for **action signals** embedded as structured tokens.
5. The response is streamed back to the browser in AI SDK v6 SSE format.

**Action Signals** Eve can embed in responses:
- `[DOMAIN_SEARCH: keyword]` — triggers a Porkbun availability check; result rendered as a domain picker card.
- `[CHECKOUT_READY: {...json...}]` — triggers a checkout card with the customer's requirements embedded.

**Security layers:**
- Prompt injection detection (regex patterns for common jailbreak phrases)
- Per-IP rate limiting (in-memory, resets each minute)
- 8,000 character message limit
- Session isolation: each browser tab gets its own UUID (`x-eve-session` header) so OpenClaw maintains separate conversation state per tab
- Server-side action resolution (Porkbun API keys never exposed to browser)

### 2.3 Domain Search & Registration

**Files:** `lib/porkbun/`, `app/api/domains/`

When Eve detects a `[DOMAIN_SEARCH]` signal, the system:

1. Normalizes the keyword to a URL-safe slug.
2. Checks `.com`, `.co`, `.io` variants against Porkbun's availability API.
3. Returns only available domains to the chat UI as an action card.

Three domain acquisition paths are supported:
- **suggested** — customer picks from Eve-suggested domains -> Porkbun purchases it
- **new** — customer specifies their own domain -> Porkbun purchases it
- **existing** — customer already owns it -> Eve provides DNS A-record instructions; order waits for propagation verification

After purchase, a DNS A record is automatically set on the domain pointing to the Contabo VPS IP.

### 2.4 Stripe Payment Flow

**Files:** `app/api/checkout/route.ts` (tip jar), `app/api/webhooks/stripe/route.ts`, `lib/order/`

**Tip jar** (`POST /api/checkout`): Creates a one-time Stripe Checkout session for $5/$20/$50 tips.

**Full service checkout** (triggered by `[CHECKOUT_READY]` action card):
1. A Stripe Checkout Session is created in **subscription** mode.
2. The first month is $89 (setup + first month); recurring is $29/mo.
3. `orderId` is stored in `session.metadata`.
4. On `checkout.session.completed` webhook: order advances to `paid` state.
5. After payment, the domain acquisition and site build pipeline fires automatically.

**Webhook handler** verifies Stripe signatures, processes `checkout.session.completed` and `payment_intent.succeeded` (idempotent fallback), and drives the order state machine.

### 2.5 Order State Machine

**Files:** `lib/order/types.ts`, `lib/order/state-machine.ts`, `lib/order/store.ts`

Every customer order flows through a strict state machine persisted in SQLite:

```
new -> qualifying -> payment_pending -> paid
    -> domain_purchasing -> building -> deploying -> live
```

Failure states (with retry paths):
- `payment_failed` -> retry -> `payment_pending`
- `domain_failed` -> retry -> `domain_purchasing`
- `build_failed` -> retry -> `building`
- `deploy_failed` -> retry -> `deploying`

Each transition is append-only in the audit trail. The store is idempotent: calling the same transition twice is a no-op (`IDEMPOTENT_SKIP`). SQLite is used for simplicity on a single-VPS deployment. The database lives at `/var/data/orders.db` (configurable via `ORDER_DB_PATH`).

### 2.6 AI Site Content Generator

**Files:** `lib/site/content-generator.ts`

After payment, the system calls Anthropic Claude Sonnet 4.6 via the AI SDK to generate structured website copy from the customer's qualifying requirements:

- Business name, tagline, headline, subheadline, CTA text
- 3-6 feature cards (icon, title, description)
- About section copy
- Primary and accent brand colors (hex codes)
- Contact email (if inferable)

The output is validated against a Zod schema before being passed to the HTML template renderer.

### 2.7 Site Build & Deployment Pipeline

**Files:** `lib/site/build-service.ts`, `lib/site/template.ts`, `lib/site/ssh.ts`, `lib/site/caddy.ts`, `lib/site/verify.ts`

After content generation:

1. **Render HTML** — AI-generated content is injected into a static HTML template.
2. **SSH deploy** — the HTML is uploaded to `/var/www/sites/{domain}/index.html` on the Contabo VPS using SSH2.
3. **Caddy config** — a per-site Caddyfile snippet is written to `/etc/caddy/sites/{domain}.caddy` and Caddy is reloaded. Caddy handles automatic Let's Encrypt HTTPS for each customer domain.
4. **DNS verification** — the system polls for DNS propagation (A record resolving to Contabo VPS IP).
5. **HTTP smoke test** — confirms the site is reachable over HTTPS.
6. **Order marked live** — state transitions to `live`.

All remote commands use SSH2's protocol-level `exec()` (not local shell). Domain names are validated against a strict RFC 1123 regex before use in any remote command.

### 2.8 Order Tracking Pages

**Files:** `app/order/[orderId]/page.tsx`

Customers can track their order status at `/order/{orderId}`. Shows current state, domain, and site URL when live.

---

## 3. Infrastructure Setup

### 3.1 Contabo VPS

- **IP:** 167.86.70.138
- **App root:** `/var/www/eve-for-hire-app`
- **Customer sites:** `/var/www/sites/`
- **Order database:** `/var/data/orders.db`
- **Caddy site configs:** `/etc/caddy/sites/`

### 3.2 nginx (reverse proxy for eve.center)

nginx terminates TLS for eve.center and proxies to Next.js on port 3000.

Config: `deploy/nginx/eve.center.conf`

Key settings:
- HTTP -> HTTPS redirect on port 80
- SSL certificates at `/etc/letsencrypt/eve-center/`
- `/api/chat` has `proxy_read_timeout 120s` (Eve's responses can take time)
- Proxies to `http://172.17.0.1:3000` (Docker bridge gateway IP — adjust if not using Docker)

### 3.3 PM2 (process manager)

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # generates systemd unit for auto-start
```

The ecosystem.config.js self-loads `.env.production` at startup so PM2 sees all secrets without shell exports.

### 3.4 OpenClaw / Nova Connection

Eve's AI brain runs on Nova (Jetson Orin + 8x RTX 3090). Nova maintains a **reverse SSH tunnel** to the VPS:

```bash
# Run on Nova (use autossh or systemd to keep alive)
ssh -N -R 127.0.0.1:8097:127.0.0.1:8097 root@167.86.70.138
```

This exposes Nova's OpenClaw HTTP proxy on VPS localhost port 8097. The Next.js app connects to `http://127.0.0.1:8097/api/chat`. If the tunnel drops, chat returns 503.

### 3.5 Caddy (customer site hosting)

Caddy serves all customer static sites. Each site gets:
- Files at `/var/www/sites/{domain}/`
- Config at `/etc/caddy/sites/{domain}.caddy`

The main Caddyfile must include:
```
import /etc/caddy/sites/*.caddy
```

Caddy handles automatic HTTPS (Let's Encrypt) for all customer domains.

### 3.6 SSL for eve.center

Managed via Certbot (Let's Encrypt), not Caddy:
```bash
certbot certonly --nginx -d eve.center -d www.eve.center
```
Certs live at `/etc/letsencrypt/eve-center/`.

### 3.7 GitHub Actions CI/CD

**File:** `.github/workflows/deploy-vps.yml`

On every push to `main`:
1. SSH into VPS using `VPS_SSH_KEY` secret
2. `git pull origin main`
3. `npm ci`
4. `NODE_ENV=production npm run build`
5. `pm2 reload ecosystem.config.js --env production`

---

## 4. Environment Variables

Set in `.env.production` on the VPS (loaded automatically by ecosystem.config.js).

| Variable | Required | Description | Where to get it |
|----------|----------|-------------|-----------------|
| `OPENCLAW_TOKEN` | Yes | Auth token for OpenClaw gateway | Generated by OpenClaw; in Nova's agent config |
| `OPENCLAW_URL` | Yes | OpenClaw HTTP proxy URL | `http://127.0.0.1:8097` (via Nova's reverse SSH tunnel) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret API key | Stripe Dashboard -> Developers -> API keys |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret | Stripe Dashboard -> Webhooks -> endpoint -> Signing secret |
| `PORKBUN_API_KEY` | Yes | Porkbun API key | Porkbun Dashboard -> Account -> API Access |
| `PORKBUN_SECRET_KEY` | Yes | Porkbun API secret key | Same as above |
| `CONTABO_VPS_IP` | Yes | IP of the Contabo VPS | Contabo control panel (167.86.70.138) |
| `CONTABO_SSH_USER` | No | SSH username (default: `root`) | Usually `root` on Contabo |
| `CONTABO_SSH_PORT` | No | SSH port (default: `22`) | Usually `22` |
| `CONTABO_SSH_PRIVATE_KEY` | Yes | PEM or base64-encoded SSH private key | Generate a dedicated deploy keypair |
| `NEXT_PUBLIC_BASE_URL` | Yes | Public URL of the app | `https://eve.center` |
| `ORDER_DB_PATH` | No | Path to SQLite DB (default: `./data/orders.db`) | Set to `/var/data/orders.db` in production |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for AI content generation | console.anthropic.com -> API Keys |

**GitHub Actions secrets** (repo Settings -> Secrets -> Actions):

| Secret | Description |
|--------|-------------|
| `VPS_SSH_KEY` | Private SSH key for CI -> VPS deploy. Generate a separate keypair for CI. |

---

## 5. Replication Guide

Step-by-step to stand up this system from scratch on a new server.

### Step 1: Provision a VPS

Get a VPS with at least 2 vCPU / 4 GB RAM / 40 GB disk running Ubuntu 22.04 LTS.

### Step 2: Install system dependencies

```bash
apt update && apt upgrade -y

# Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# PM2
npm install -g pm2

# nginx
apt install -y nginx

# Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy

# Certbot
apt install -y certbot python3-certbot-nginx

apt install -y git
```

### Step 3: Set up directory structure

```bash
mkdir -p /var/www/eve-for-hire-app
mkdir -p /var/www/sites
mkdir -p /var/data
mkdir -p /etc/caddy/sites
mkdir -p /var/log/caddy
```

### Step 4: Configure Caddy

Edit `/etc/caddy/Caddyfile`:
```
import /etc/caddy/sites/*.caddy
```

```bash
systemctl enable caddy && systemctl start caddy
```

### Step 5: Clone the repository

```bash
cd /var/www/eve-for-hire-app
git clone https://github.com/BusinessBuilders/eve-for-hire .
```

### Step 6: Create environment file

Create `.env.production` with all variables from Section 4.

### Step 7: Build the app

```bash
npm ci
NODE_ENV=production npm run build
```

### Step 8: Configure nginx

```bash
cp deploy/nginx/eve.center.conf /etc/nginx/sites-available/eve.center
ln -s /etc/nginx/sites-available/eve.center /etc/nginx/sites-enabled/
```

Update `server_name` to your domain and `proxy_pass` to `http://127.0.0.1:3000` if not using Docker bridge networking.

```bash
nginx -t && systemctl reload nginx
```

### Step 9: Obtain SSL certificate

```bash
certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

Update nginx config's `ssl_certificate` paths accordingly.

### Step 10: Start the application

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # follow the printed systemctl command
```

### Step 11: Configure Stripe webhook

In Stripe Dashboard:
1. Developers -> Webhooks -> Add endpoint
2. URL: `https://yourdomain.com/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.production`
5. `pm2 reload ecosystem.config.js --env production`

### Step 12: Set up OpenClaw tunnel (on Nova)

```bash
# Install autossh
apt install -y autossh

# Create systemd service
cat > /etc/systemd/system/openclaw-tunnel.service << 'EOF'
[Unit]
Description=OpenClaw reverse SSH tunnel to VPS
After=network.target

[Service]
ExecStart=/usr/bin/autossh -M 0 -N \
  -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -R 127.0.0.1:8097:127.0.0.1:8097 root@YOUR_VPS_IP
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl enable openclaw-tunnel
systemctl start openclaw-tunnel
```

### Step 13: Set up CI/CD (GitHub Actions)

1. Generate a deploy keypair:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f /tmp/deploy_key
   ```
2. Add public key to VPS `~/.ssh/authorized_keys`.
3. Add private key as GitHub Actions secret named `VPS_SSH_KEY`.
4. Update the VPS IP in `.github/workflows/deploy-vps.yml` if needed.

### Step 14: Verify

```bash
pm2 status
systemctl status nginx caddy
pm2 logs eve-for-hire
```

Visit `https://yourdomain.com` — Eve's landing page should load.

---

## 6. Known Issues & Workarounds

### 6.1 OpenClaw tunnel drops -> chat returns 503

**Symptom:** `/api/chat` returns 503; PM2 logs show "OpenClaw proxy failed."  
**Cause:** Reverse SSH tunnel from Nova dropped.  
**Fix:** Use `autossh` (see Step 12) with `ServerAliveInterval`. Confirm Nova is online and VPS firewall allows SSH.

### 6.2 PM2 doesn't see env vars on reload

**Symptom:** App starts but secrets are empty.  
**Fix:** Always use `pm2 reload ecosystem.config.js --env production`. The ecosystem config self-reads `.env.production` via `fs.readFileSync` — but only on start/reload, not on restart of individual processes.

### 6.3 Duplicate Stripe customers

**Fixed in `99ecfc7`.** Checkout now upserts customers by email. Pre-fix duplicates in Stripe Dashboard can be manually merged.

### 6.4 Domain suggestions including unavailable domains

**Fixed in `2dd8fc3`.** `suggestAvailableDomains` now filters to available-only before returning.

### 6.5 Chat 504 on slow Eve responses

**Fixed in `d93f00c`.** nginx has `proxy_read_timeout 120s` for `/api/chat`. Internal OpenClaw call has a 60s timeout.

### 6.6 SSH key format errors in GitHub Actions

**Fixed in `8aa3cef`.** The deploy workflow uses `webfactory/ssh-agent@v0.9.0`. If format errors recur, regenerate the key with `ssh-keygen -t ed25519`.

### 6.7 Caddy not serving customer sites

Check that `/etc/caddy/Caddyfile` contains `import /etc/caddy/sites/*.caddy`. Without this, per-site configs are silently ignored.

### 6.8 Order database wiped on redeploy

Store the database outside the app root. Set `ORDER_DB_PATH=/var/data/orders.db` in `.env.production`. The default fallback (`./data/orders.db`) is inside the app directory and will survive `git pull` but is at risk if the directory is ever recreated.

### 6.9 LLM errors showing as Eve's reply

The chat route detects text starting with "LLM request failed" or "Error:" and throws instead of displaying it as Eve's reply. This returns a 503 to the browser with a clean error message.

### 6.10 In-memory rate limiter resets on restart

The 20 req/min per-IP rate limit is in-memory. For stronger abuse protection, add nginx-level rate limiting in addition to the application-level check.
