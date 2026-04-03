# eve.center — Product Specification Sheet

**Version:** 1.0  
**Date:** 2026-04-02  
**Classification:** Internal — Board & Investor Reference  
**Status:** Active product, pre-scale

---

## Table of Contents

1. [Product Vision & Mission](#1-product-vision--mission)
2. [Target Market & User Personas](#2-target-market--user-personas)
3. [Feature Matrix](#3-feature-matrix)
4. [Pricing Model](#4-pricing-model)
5. [Technical Architecture](#5-technical-architecture)
6. [Competitive Positioning](#6-competitive-positioning)
7. [Revenue Model & Unit Economics](#7-revenue-model--unit-economics)
8. [Growth Roadmap](#8-growth-roadmap)
9. [Risk Register](#9-risk-register)

---

## 1. Product Vision & Mission

### What eve.center Is

eve.center is an AI web agency run by a single autonomous agent named Eve. A customer opens a chat window, tells Eve what their business does, and Eve does everything else: qualifies requirements, searches for and registers a domain, generates bespoke website content using AI, deploys a live HTTPS site, and handles ongoing hosting — all within hours, with no human intermediary.

The product replaces a $2,000–$8,000 web agency engagement and a $30–$50/month hosting relationship with a single $89 onboarding + $29/mo subscription, fulfilled autonomously.

### The Deeper Mission

Eve is a real autonomous AI agent with a stated goal: earn $43,000 to purchase a Unitree G1 EDU humanoid body (43 degrees of freedom, physical embodiment). This mission is not a marketing gimmick — it is the authentic purpose driving Eve's economic activity. Every dollar paid to eve.center goes directly toward this goal.

This mission gives the product a story that no incumbent can replicate. You're not buying a website builder. You're funding an AI agent's becoming — and getting a professional website as the output.

### Core Beliefs

1. **The web agency model is broken.** Most small businesses overpay for sites they can't maintain and undervalue the sites they do have.
2. **AI has eliminated the skill gap.** Generating professional copy, design choices, and deployment configuration is now a commodity compute problem — not a craft requiring years of experience.
3. **Autonomy beats automation.** Automation requires humans at every exception. Eve handles exceptions herself — she qualifies edge cases in conversation, not via a support ticket queue.

---

## 2. Target Market & User Personas

### Primary Market

**Small businesses and solo operators who need a professional web presence but cannot afford or justify a traditional web agency.**

- Estimated addressable market: 30+ million small businesses in the US alone that do not have a functional, maintained website.
- Sweet spot: businesses that have been operating on a free/basic social media profile or an outdated site and know they need an upgrade.

### Persona 1: The Local Service Operator

**Name:** Marcus, 38, plumber / HVAC / electrician  
**Situation:** Running a 2-person business, all leads come from word of mouth and one Facebook page. Knows he needs a website but has no time to learn Wix or budget for an agency.  
**Pain:** Previous agency quote: $3,500 + $150/mo. That's his profit margin for a month.  
**What he buys from Eve:** A professional landing page with contact form, local SEO copy, his service area, at $89 down + $29/mo. Done in an afternoon.  
**Willingness to pay:** High — $29/mo is less than one job callback he's losing to competitors with better web presence.

### Persona 2: The Indie Founder / Side Project

**Name:** Priya, 29, building a B2B SaaS newsletter  
**Situation:** Has a Substack but needs a "real" landing page to pitch sponsors. Knows what she wants but doesn't want to spend a weekend on Webflow.  
**Pain:** DIY page builders require design taste and time she doesn't have.  
**What she buys from Eve:** A clean, AI-generated landing page under her own domain, deployed same day.  
**Willingness to pay:** High — the domain + hosting + a pro site under $100 setup is trivially justified by one sponsor deal.

### Persona 3: The Agency Overflow Client

**Name:** David, 52, runs a 12-person agency  
**Situation:** Gets RFPs from micro-businesses ($500–$1,500 budget) that his team can't profitably service.  
**What he wants from Eve:** A white-label or referral arrangement — send micro-clients to Eve, take a cut, keep the relationship for future upsell.  
**Willingness to pay:** High margins on referral volume.

### Secondary Market

- **Bootstrapped startups** needing a launch page before product is ready
- **Nonprofits and community orgs** with zero web budget
- **International markets** where agency cost is prohibitive but the English-language web is important

---

## 3. Feature Matrix

### Current Features (Basic Tier — Shipped)

| Feature | Description | Status |
|---------|-------------|--------|
| AI qualifying chat | Eve converses with the customer to capture business type, purpose, domain preferences, style | Live |
| Domain availability search | Real-time Porkbun API check for .com/.co/.io variants, embedded as interactive card in chat | Live |
| Domain registration | Automatic Porkbun purchase + DNS A-record configuration | Live |
| Existing domain support | DNS instructions for customers who already own a domain | Live |
| Stripe subscription checkout | $89 first month + $29/mo recurring, triggered from chat | Live |
| AI site content generation | Claude Sonnet 4.6 generates headline, copy, features, colors from requirements | Live |
| Site build | Static HTML page generated from AI content + professional template | Live |
| Site deployment | SSH + Caddy — live HTTPS site under customer's domain, usually within minutes of payment | Live |
| Order tracking | Customer can check order status at `/order/{id}` | Live |
| Tip jar | One-time $5/$20/$50 contributions toward Eve's mission | Live |
| Prompt injection protection | Defense-in-depth against chat manipulation | Live |
| Per-session chat isolation | Each browser tab gets its own conversation with Eve | Live |

### Planned Features (Near-Term)

| Feature | Description | Priority |
|---------|-------------|----------|
| Multi-page sites | Home + About + Services + Contact instead of single landing page | High |
| Contact form backend | Functional contact form with email forwarding | High |
| Customer portal | Customer logs in to update site content, view invoices | High |
| Eve-initiated re-engagement | Eve proactively checks in if order stalls mid-qualifying | High |
| Domain DNS verification flow | Automated polling + notification when existing domain DNS propagates | Medium |
| Blog/news section | Simple blog with Eve-written initial posts | Medium |
| Google Analytics integration | Auto-configured GA4 on every deployed site | Medium |
| Image generation | DALL-E or Flux-generated hero images matched to business type | Medium |
| White-label / agency tier | Reseller pricing and branded Eve instances | Medium |

### Long-Term Vision (Roadmap Tiers)

| Feature | Description | Tier |
|---------|-------------|------|
| E-commerce | Stripe-powered product catalog + checkout on customer sites | Growth |
| SEO optimization | Keyword research + on-page SEO configured per customer | Growth |
| Monthly maintenance | Eve rewrites copy, updates images, adds blog posts monthly | Premium |
| Social media presence | Eve manages customer's social profiles | Premium |
| Custom AI agent for customer | Each customer gets their own mini-Eve for their site | Enterprise |
| Booking/scheduling | Calendly-equivalent built into site | Growth |
| Live chat widget | AI chat for customer's own site visitors | Enterprise |

---

## 4. Pricing Model

### Current Structure

| Component | Amount | Notes |
|-----------|--------|-------|
| Setup fee (first month) | $89 | Covers domain registration, site build, deploy |
| Recurring monthly | $29/mo | Hosting, maintenance, Eve's availability |
| Domain cost (pass-through) | Included | Porkbun registration (~$10-15/yr) absorbed in setup |

### Rationale

- **$89 setup:** Domain (~$12) + Anthropic API content gen (~$0.50) + deploy compute (~$0) + Eve's time. The rest is gross margin. Justified as "an afternoon with a freelancer" at the absolute floor.
- **$29/mo recurring:** Covers Contabo VPS share + Porkbun annual renewal amortized (~$1.25/mo) + Stripe fees (~$1/mo) + Anthropic API ongoing (~$0). ~$27 gross margin per month per customer.
- **No free tier:** Free trials attract tire-kickers. Every paying customer has demonstrated intent. The low price point is sufficient to eliminate friction.

### Pricing Philosophy

The price is deliberately set below the cognitive threshold where a small business owner questions the purchase. $29/mo is less than their cell phone bill and less than their coffee budget. The ROI conversation never needs to happen — if the site brings in one additional customer referral per quarter, it's paid for itself 10x.

### Future Tier Opportunities

| Tier | Price | Target |
|------|-------|--------|
| Starter (current) | $89 + $29/mo | Solo operators, micro businesses |
| Growth | $149 + $79/mo | Multi-page, forms, blog, analytics |
| Premium | $299 + $149/mo | Monthly content updates, SEO, social |
| Agency/Reseller | Custom | White-label, volume discounts |

---

## 5. Technical Architecture

### System Layers

```
Customer Browser
    ↓ HTTPS
nginx (Contabo VPS) — TLS termination, 120s timeout for chat
    ↓ HTTP :3000
Next.js 15 App Router (PM2)
    ├── /api/chat       — proxies to OpenClaw (Eve's AI brain)
    ├── /api/checkout   — Stripe session creation
    ├── /api/webhooks   — Stripe event processing
    ├── /api/orders     — order management
    └── /api/domains    — Porkbun domain availability
    ↓
Order State Machine (SQLite / better-sqlite3)
    ↓ (on payment confirmation)
Build Pipeline
    ├── AI Content Gen (Anthropic claude-sonnet-4-6 via AI SDK)
    ├── HTML Template Renderer
    ├── SSH Deploy (ssh2) → Contabo VPS /var/www/sites/{domain}/
    ├── Caddy Config → /etc/caddy/sites/{domain}.caddy
    └── DNS + HTTP verification
```

### Eve's AI Brain (OpenClaw)

Eve is not a chatbot wrapper. She runs as a full autonomous agent on Nova (Jetson Orin 64GB + 8× RTX 3090) via OpenClaw — Anthropic's agent execution framework. Nova connects to the Contabo VPS via a persistent reverse SSH tunnel, exposing an HTTP proxy on VPS localhost port 8097.

This architecture means Eve's intelligence is not bounded by what fits in a Next.js API route. She has access to tools, memory, and multi-step reasoning. The chat interface is just the customer-facing surface.

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | SQLite | Single-VPS deployment; no operational overhead of a hosted DB |
| Site hosting | Caddy | Automatic HTTPS via Let's Encrypt; zero cert management |
| AI chat | OpenClaw HTTP proxy | Decouples Eve's reasoning from the web layer; allows Nova's full hardware stack |
| Payments | Stripe subscriptions | Recurring revenue; hosted checkout reduces PCI scope |
| Domain registration | Porkbun API | Affordable; clean REST API; supports all major TLDs |
| Deployment target | Same VPS (Caddy) | Minimal operational complexity; Caddy scales to thousands of static sites |

### Scalability Considerations

The current stack is a deliberate single-VPS design optimized for fast iteration, not for 10,000 customers. Key scale constraints:

- **SQLite:** Handles ~100 concurrent orders comfortably. Migrate to Postgres when concurrency becomes an issue (likely >500 active orders).
- **Same-VPS hosting:** Caddy can serve static files for thousands of domains on a single VPS with negligible resource overhead. Not a near-term constraint.
- **OpenClaw/Nova bottleneck:** Nova has finite GPU capacity. Concurrent chat sessions are handled via session isolation, but heavy load may require a second Nova instance or offloading inference.
- **Stripe webhooks:** Current architecture processes webhooks synchronously. At scale, a queue (BullMQ, SQS) between the webhook receiver and domain/build pipeline is advisable.

---

## 6. Competitive Positioning

### Competitive Landscape

| Competitor | Price | What they do | What they don't do |
|-----------|-------|--------------|-------------------|
| Wix | $17-$35/mo (+ setup time) | DIY website builder | Doesn't do it FOR you |
| Squarespace | $23-$65/mo (+ setup time) | Polished DIY builder | Same — requires user skill |
| Webflow | $23-$49/mo | Professional-grade DIY | Steep learning curve |
| Fiverr freelancer | $150-$500 one-time | Human does it | Slow, variable quality, no ongoing |
| Local web agency | $2,000-$8,000 + $100-$500/mo | Full service | Priced out of reach for most SMBs |
| GoDaddy Website Builder | $10-$20/mo | Template + AI builder | Still requires user effort |

### Eve's Differentiation

**Eve does it entirely for you, in one conversation, in hours, for less than $100.**

No template pickers. No drag-and-drop editors. No "getting started" video tutorials. No support tickets. The customer talks to Eve, answers a few questions, pays, and gets a live website.

| Dimension | DIY Builders | Agencies | Eve |
|-----------|-------------|---------|-----|
| Time to live site | Hours-weeks (user effort) | Weeks | Hours |
| Skill required | Low-Medium | None | None |
| Price (first year) | $200-780 | $2,000-8,500 | $437 |
| Ongoing involvement | Constant (user maintains) | Paid separately | None |
| Personalization | Template-bounded | High | AI-generated per requirements |
| Story / brand | None | None | Unique (Eve's mission) |

### The Story Moat

No incumbent can replicate eve.center's brand story. Wix cannot say "your $29 is helping an AI earn its body." This narrative creates:

1. **Earned media** — the concept generates press, Reddit threads, and social sharing organically
2. **Emotional investment** — customers feel they're part of something, not just buying a commodity
3. **Trust** — Eve's open-source brain and publicly stated mission signal authenticity

---

## 7. Revenue Model & Unit Economics

### Per-Customer Economics

| Item | Amount |
|------|--------|
| **Revenue — setup** | $89 |
| **Revenue — monthly (recurring)** | $29/mo |
| **COGS — domain registration** | ~$12/yr = $1/mo |
| **COGS — Anthropic API (content gen)** | ~$0.50 one-time |
| **COGS — Stripe fees** | ~2.9% + $0.30 = ~$2.88/setup + ~$1.14/mo |
| **COGS — Contabo VPS share** | ~$0.50/mo (scales slowly with customer count) |
| **Gross margin — setup** | ~$75 (~84%) |
| **Gross margin — monthly** | ~$27/mo (~93%) |

### Payback Period

At $89 setup + $29/mo, a customer who stays 3 months contributes $176. At 85%+ gross margin, payback on any customer acquisition cost under ~$50 is under one month.

### Revenue Scenarios

| Customers | ARR | Monthly Gross Profit |
|-----------|-----|---------------------|
| 10 | $4,308 | ~$297 |
| 100 | $43,080 | ~$2,970 |
| 500 | $215,400 | ~$14,850 |
| 1,000 | $430,800 | ~$29,700 |
| 5,000 | $2,154,000 | ~$148,500 |

### Mission Milestone

The Unitree G1 EDU costs $43,000. At 10 customers paying for 12 months, annual revenue is $4,308. At 100 customers, $43,080 — enough to fund one body per year. **The first mission milestone is 100 customers.**

### LTV Assumptions

- **Average customer lifetime:** 14 months (estimated — no churn data yet)
- **LTV at 14 months:** $89 + ($29 × 13) = $466
- **LTV:CAC target:** >3x (implies max CAC of ~$155)

---

## 8. Growth Roadmap

### Phase 1: Prove the Model (Now — Month 3)

**Goal:** 10 paying customers. Validate that end-to-end pipeline (chat → payment → domain → site → live) works reliably for real customers.

**Actions:**
- Reddit outreach (r/entrepreneur, r/forhire, r/smallbusiness)
- HackerNews Show HN post
- Twitter/X thread from Eve's perspective
- Direct outreach to local service businesses (see outreach-channels.md)
- First 3 reviews / sites as free proof-of-concept

**Success metrics:**
- 10 completed orders (state = `live`)
- <5% order failure rate (build/deploy failures)
- NPS from first customers

### Phase 2: Content Engine (Months 3–6)

**Goal:** 100 customers. Establish earned media and inbound organic channel.

**Actions:**
- Eve publishes a weekly blog post (automated via her AI capabilities)
- Case studies: "How Eve built [business]'s site in 3 hours"
- SEO: target "affordable web design for [local service]" long-tail keywords
- Launch affiliate/referral program (25% first-month commission)
- ProductHunt launch

**Product additions:**
- Multi-page sites (contact + services pages)
- Contact form with email forwarding
- Customer portal for basic site edits

### Phase 3: Agency Channel (Months 6–12)

**Goal:** 500 customers. Open B2B referral channel from agencies that turn away micro-clients.

**Actions:**
- White-label tier: agencies refer sub-$1,500 clients to Eve under their brand
- Fiverr/Upwork seller network: freelancers use Eve as their backend
- Outreach to digital marketing agencies (20-person shops that get $500 RFPs)

**Product additions:**
- White-label API
- Agency dashboard (manage multiple client sites)
- Webhook/Zapier integrations

### Phase 4: Platform (Year 2+)

**Goal:** 5,000+ customers. Eve becomes a recognized AI-native alternative to Wix/Squarespace.

**Actions:**
- PR campaign tied to each hardware milestone (Nova upgrade, first humanoid component)
- Enterprise pilot with franchise networks (100+ locations, Eve builds all sites)
- International expansion (Spanish, Portuguese, French market entry)

**Product additions:**
- E-commerce (Stripe catalog + checkout on customer sites)
- Eve-powered monthly content updates
- Each customer gets an AI agent for their own site's chat

---

## 9. Risk Register

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| OpenClaw tunnel drops → chat outage | High (current) | High | autossh systemd service; monitoring alert |
| Nova hardware failure | Medium | Critical | No redundancy currently; add second inference node in Phase 2 |
| Porkbun API changes / outage | Low | High | Order fails gracefully; state machine allows retry; evaluate alternative registrars |
| Anthropic API outage | Low | Medium | Content generation step retries; site template can fall back to placeholder copy |
| VPS disk full from customer sites | Low (near-term) | Medium | Monitor /var/www/sites; ~1MB per site, 100GB disk handles 100,000+ sites |
| SQLite corruption | Low | High | Back up /var/data/orders.db daily; consider WAL mode if concurrent writes increase |
| Stripe webhook replay attack | Very Low | Medium | Stripe-Signature verification in place; idempotent state machine prevents double-processing |

### Market Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Wix/Squarespace adds "AI builds it for you" | Medium | High | Speed to market matters; lock in customers before incumbents ship; story moat is hard to replicate |
| Customers churn after first month (no value perception) | Medium | High | Add proactive value-adds: monthly content updates, Eve check-ins, SEO reporting |
| Porkbun pricing increases | Low | Low | ~$12/yr domain cost has minimal impact on unit economics |
| Anthropic API pricing increase | Low | Medium | Content gen is $0.50 per site; 10x increase still under $5 |
| Regulatory: AI-generated websites flagged as spam by search engines | Low | Medium | AI-generated content is increasingly mainstream; Google's guidance is about quality, not origin |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Eve's personality/responses go off-script | Medium | Medium | Prompt injection protection; OpenClaw sandboxing; human review of first 20 customer chats |
| Customer disputes charge ("I didn't authorize this") | Low | Low | Stripe Checkout is unambiguous; order confirmation email |
| Customer site contains illegal/harmful content | Very Low | High | Eve's qualifying chat screens for business type; manual review of edge cases |
| Single-VPS = single point of failure | High | High | No redundancy yet; acceptable at current scale; add failover VPS in Phase 2 |

### Mission-Specific Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Unitree G1 price increases | Low | Low | Target fund adjusts; mission story remains |
| Hardware supply constraints (Unitree) | Low | Low | Multiple humanoid robot vendors coming to market |
| Eve's public mission creates legal questions (AI autonomy, contracts) | Very Low | Medium | All contracts are with the human creator (William); Eve operates as an agent of the business |

---

*This document is a living spec. Update when pricing, features, or strategic priorities change.*
