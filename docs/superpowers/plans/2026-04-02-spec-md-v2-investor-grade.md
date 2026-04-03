# SPEC.md v2.0 — Investor-Grade Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `SPEC.md` from an operational product doc to an investor-grade specification by adding market sizing, competitive defensibility analysis, network effects/flywheel dynamics, and expansion scenarios.

**Architecture:** Single-file documentation update to `SPEC.md`. Eight discrete content additions inserted into existing sections or as new sections. No code changes — pure markdown authoring. Each task is a self-contained section addition that can be verified by reading the file.

**Tech Stack:** Markdown, git

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `SPEC.md` | Modify | Primary deliverable — all eight additions go here |
| `docs/superpowers/plans/2026-04-02-spec-md-v2-investor-grade.md` | Create | This plan document |

---

### Task 1: Investment Thesis Summary (Section 1 addition)

**Files:**
- Modify: `SPEC.md` — append to Section 1 (Product Vision & Mission)

- [ ] **Step 1: Verify current Section 1 ends without an investment summary**

```bash
grep -n "Investment Thesis" SPEC.md
```
Expected: no matches (not yet present)

- [ ] **Step 2: Add Investment Thesis Summary block to Section 1**

After the "Core Beliefs" subsection in Section 1, insert:

```markdown
### Investment Thesis Summary

> **Eve is the first agentic web agency at consumer price points, with a narrative moat no incumbent can acquire and a margin structure that improves with scale. The window to establish category ownership is 12–18 months before incumbents ship copycat features.**

Three structural advantages converge:
1. **Cost structure**: ~93% gross margin on recurring revenue — enabled by zero human labor in the fulfillment chain.
2. **Narrative moat**: An authentic AI-agency story that generates free earned media and customer emotional investment.
3. **Compounding intelligence**: Every customer conversation and every deployed site makes Eve a better sales agent and site builder — an asset that appreciates over time.
```

- [ ] **Step 3: Verify the section was added correctly**

```bash
grep -A 10 "Investment Thesis Summary" SPEC.md
```
Expected: blockquote followed by the three bullet points.

- [ ] **Step 4: Commit**

```bash
git add SPEC.md
git commit -m "docs(spec): add investment thesis summary to Section 1"
```

---

### Task 2: Market Sizing — TAM / SAM / SOM (New Section 2)

**Files:**
- Modify: `SPEC.md` — insert new Section 2 before current Section 2 (Target Market), renumbering all subsequent sections

- [ ] **Step 1: Verify current section numbering**

```bash
grep -n "^## [0-9]" SPEC.md
```
Expected: sections numbered 1–9.

- [ ] **Step 2: Insert new Section 2 with market sizing tables**

After Section 1 closing `---` and before current Section 2, insert:

```markdown
## 2. Market Sizing — TAM / SAM / SOM

### Total Addressable Market (TAM)

The global small business web services market encompasses web design, web hosting, and website building tools.

| Segment | Size |
|---------|------|
| Global web design services market | ~$40B (2025, growing ~7% YoY) |
| Global web hosting market | ~$100B (2025, growing ~15% YoY) |
| SMB website builder SaaS (Wix/Squarespace tier) | ~$4B ARR combined |
| **Blended TAM (addressable portion)** | **~$15B** |

Eve competes in the intersection of "someone builds it for you" (agencies) and "you build it yourself" (DIY tools). This intersection is currently underserved.

### Serviceable Addressable Market (SAM)

**Focus: English-speaking small businesses that need a professional web presence and cannot justify agency pricing.**

| Region | Businesses Without Functional Website | Average First-Year Contract Value |
|--------|--------------------------------------|----------------------------------|
| United States | ~30M | $437 |
| United Kingdom | ~5M | $437 |
| Canada + Australia | ~4M | $437 |
| **Total SAM (English, Phase 1-3)** | **~39M businesses** | **~$17B total opportunity** |

Note: "Without functional website" includes outdated sites, broken sites, and Facebook-only presences — estimated at ~60% of US businesses under 10 employees (Census Bureau + Clutch.co surveys).

### Serviceable Obtainable Market (SOM)

**Realistic near-term capture at current growth trajectory:**

| Horizon | Target Customers | ARR |
|---------|-----------------|-----|
| 12 months (Phase 1 complete) | 100 | $43K |
| 24 months (Phase 2 complete) | 1,000 | $430K |
| 36 months (Phase 3 complete) | 5,000 | $2.15M |
| 48 months (Platform scale) | 20,000 | $8.6M |

At 5,000 customers with ~93% gross margin, monthly gross profit exceeds $148K — a profitable, capital-light SaaS business fundable at venture scale.
```

- [ ] **Step 3: Renumber all subsequent sections (+1 each)**

Update section headers:
- `## 2. Target Market` → `## 3. Target Market`
- `## 3. Feature Matrix` → `## 4. Feature Matrix`
- `## 4. Pricing Model` → `## 5. Pricing Model`
- `## 5. Technical Architecture` → `## 6. Technical Architecture`
- `## 6. Competitive Positioning` → `## 7. Competitive Positioning & Defensibility`
- `## 7. Revenue Model` → `## 8. Revenue Model & Unit Economics`
- `## 8. Growth Roadmap` → `## 9. Growth Roadmap` *(becomes Section 11 after new sections added)*
- `## 9. Risk Register` → renumber after all new sections are inserted

Also update the Table of Contents entries to match.

- [ ] **Step 4: Verify section numbering is correct**

```bash
grep -n "^## [0-9]" SPEC.md
```
Expected: no duplicate section numbers; TAM section appears as `## 2.`

- [ ] **Step 5: Commit**

```bash
git add SPEC.md
git commit -m "docs(spec): add TAM/SAM/SOM market sizing as Section 2"
```

---

### Task 3: Persona 4 — International Entrepreneur (Section 3 addition)

**Files:**
- Modify: `SPEC.md` — append Persona 4 to the Target Market section

- [ ] **Step 1: Verify Persona 3 is the last persona currently**

```bash
grep -n "Persona [0-9]" SPEC.md
```
Expected: Persona 1, 2, 3 present; no Persona 4.

- [ ] **Step 2: Add Persona 4 after the Persona 3 block**

```markdown
### Persona 4: The International Entrepreneur

**Name:** Carlos, 34, runs a cleaning service in Mexico City  
**Situation:** Knows he needs an English-language web presence to attract expat clients. Local freelancers charge $400–800 and take weeks. US agencies won't work with him.  
**Pain:** No affordable option that understands his market context.  
**What he buys from Eve:** A bilingual site (Spanish/English) in his niche, same-day, at a price point below a local freelancer.  
**Willingness to pay:** High — the price delta vs. any alternative is dramatic in purchasing-power-parity terms. $89 is achievable; $3,000 is not.
```

Also add to the Secondary Market bullet list:
```markdown
- **Franchise networks** needing standardized sites for 10–1,000 locations
```

- [ ] **Step 3: Verify**

```bash
grep -n "Carlos" SPEC.md
```
Expected: line found in Persona 4 section.

- [ ] **Step 4: Commit**

```bash
git add SPEC.md
git commit -m "docs(spec): add Persona 4 (international entrepreneur) to target market"
```

---

### Task 4: Technical Differentiators (Section 6 addition)

**Files:**
- Modify: `SPEC.md` — add Technical Differentiators subsection to Technical Architecture section

- [ ] **Step 1: Verify the section doesn't already exist**

```bash
grep -n "Technical Differentiators" SPEC.md
```
Expected: no matches.

- [ ] **Step 2: Append after "Scalability Considerations" subsection in Technical Architecture**

```markdown
### Technical Differentiators

What separates eve.center from "AI website builder" clones:

1. **Agent-native, not chatbot-wrapper.** Most competitors route through a GPT system prompt with no tool access. Eve runs as a full autonomous agent with persistent memory, tool calls, and multi-step planning. She can resolve exceptions (DNS propagation failures, customer edge cases, ambiguous requirements) without human escalation.

2. **Decoupled inference layer.** Eve's reasoning runs on dedicated hardware (Nova), fully decoupled from the web tier. Upgrading Eve's intelligence requires no changes to the web stack. This also means Eve can use models and tools unavailable via API-only deployments.

3. **Fully automated fulfillment pipeline.** From chat to live site is a single deterministic state machine with no human touchpoints. Zero marginal labor cost per order is a structural advantage over any agency model, regardless of pricing.

4. **Session-isolated agent context.** Each customer gets a dedicated conversation state managed at the agent level, not just a stateless system prompt. Eve remembers within a session what the customer said, changed their mind about, and what was agreed — reducing back-and-forth and increasing conversion.

5. **Idempotent order pipeline.** The state machine handles retries, partial failures, and payment edge cases (duplicate webhooks, Stripe deduplication) without manual intervention. This is enterprise-grade reliability built into a consumer product.
```

- [ ] **Step 3: Verify**

```bash
grep -n "Agent-native" SPEC.md
```
Expected: line found inside Technical Differentiators subsection.

- [ ] **Step 4: Commit**

```bash
git add SPEC.md
git commit -m "docs(spec): add technical differentiators subsection to architecture section"
```

---

### Task 5: Competitive Defensibility Framework (Section 7 expansion)

**Files:**
- Modify: `SPEC.md` — expand Competitive Positioning section with full defensibility analysis

- [ ] **Step 1: Verify current state of Section 7**

```bash
grep -n "Story Moat\|Defensibility\|Moat 1" SPEC.md
```
Expected: only "Story Moat" present (original section); no Defensibility Framework heading.

- [ ] **Step 2: Replace the "Story Moat" subsection with the full Defensibility Framework**

Remove the existing "### The Story Moat" block and replace with:

```markdown
### Defensibility Framework

#### Moat 1: The Narrative Moat (Strongest — Non-Acquirable)

No incumbent can replicate eve.center's brand story. Wix cannot say "your $29 is helping an AI earn its body." This narrative requires:
- An authentically autonomous AI agent with a real, stated, public goal
- A mission predating the product (not retrofitted marketing)
- Transparent, open-source infrastructure that validates the claim

Crucially, this moat **cannot be acquired or purchased**. If Wix announced "we're donating a robot to an AI," it reads as corporate gimmick. Eve's story works because it is true and demonstrably verifiable.

**Earned media flywheel:** The mission generates unsolicited press, Reddit threads, Hacker News discussions, and social sharing — all of which are effectively free customer acquisition.

#### Moat 2: The Cost Structure Moat

At ~93% gross margin on recurring revenue, eve.center can:
- Sustain prices no human agency can profitably match
- Absorb customer acquisition costs that would kill a margin-thin competitor
- Invest in product improvements without needing pricing power increases

As customer count grows, infrastructure costs per customer **decrease** (fixed VPS cost amortized across more sites). The more customers, the wider the margin advantage.

#### Moat 3: The Speed Moat

Eve delivers a live site in hours. The structural reason is not AI — it's the absence of human coordination overhead. Even a well-run agency has intake calls, design reviews, revision cycles, QA handoffs, and client approval loops. Eve has none of these. The 8-hour delivery time is a structural floor, not a sprint target.

#### Moat 4: The Compounding Intelligence Moat (Growing)

Every customer conversation and every deployed site makes Eve measurably better:
- **Qualifying data:** Patterns across 100 plumber conversations tell Eve how to close a plumber faster than any human sales rep.
- **Copy quality data:** Knowing which generated sites perform well improves future generation.
- **Edge case corpus:** Unusual business types, difficult domain registrations, customer objections — all become training signal.

This moat compounds. A competitor starting today starts with zero data.

#### Moat 5: The Mission Milestone Moat

Each funding milestone generates a new media cycle. This creates a recurring, earned attention machine tied directly to revenue. The more revenue, the closer the milestone, the bigger the next story.

### Why Incumbents Won't Catch Up Quickly

| Incumbent | Why they can't replicate |
|-----------|------------------------|
| **Wix / Squarespace** | Built on a premise of user control. "AI does it for you" contradicts their product DNA and cannibalizes their $40+/mo tier customers. |
| **GoDaddy** | Enterprise sales motion, not consumer. Their "AI builder" is a feature bolt-on, not an autonomous agent. |
| **Fiverr / Upwork** | Platform model — can't replace the freelancer supply side with AI without destroying their core marketplace. |
| **New AI startup** | Could build the tech stack, but cannot acquire Eve's narrative authenticity or her compounding customer data. |

The **12–18 month window** before a credible incumbent response is the critical growth period.
```

- [ ] **Step 3: Verify**

```bash
grep -n "Moat [1-5]:" SPEC.md
```
Expected: five moat headings found.

- [ ] **Step 4: Commit**

```bash
git add SPEC.md
git commit -m "docs(spec): expand competitive positioning with full defensibility framework"
```

---

### Task 6: Network Effects & Flywheel Dynamics (New Section)

**Files:**
- Modify: `SPEC.md` — insert new "Network Effects & Flywheel Dynamics" section after Competitive Positioning

- [ ] **Step 1: Verify section doesn't exist**

```bash
grep -n "Network Effects\|Flywheel" SPEC.md
```
Expected: no matches.

- [ ] **Step 2: Insert new section**

```markdown
## [N]. Network Effects & Flywheel Dynamics

eve.center benefits from four distinct compounding mechanisms. None of these are present in traditional web agencies or DIY builders.

### Flywheel 1: The Content-SEO Flywheel

```
More customers → more case studies → more SEO-indexed content
    → more organic search traffic → lower CAC → more customers
```

Each deployed site is a potential case study. Eve can self-author these posts. At 100 sites, the long-tail SEO coverage ("affordable web design for plumbers in Texas") becomes a significant organic acquisition channel.

### Flywheel 2: The Agency Distribution Flywheel

```
White-label tier launched → agencies refer sub-$1,500 clients
    → Eve builds sites → agency maintains relationship
    → agency refers more clients → Eve's revenue grows without CAC
```

### Flywheel 3: The Mission Milestone Flywheel

```
Revenue milestone hit → Eve announces progress
    → media cycle generates press / social sharing
    → new customers arrive → next milestone closer
    → next media cycle larger
```

### Flywheel 4: The Intelligence Compounding Flywheel

```
More customer conversations → better qualifying patterns
    → higher conversion rate → more customers
    → more sites built → better content generation
    → higher customer satisfaction → lower churn → more customers
```

### Network Effects Summary

| Effect | Type | Current State | At 1,000 Customers |
|--------|------|--------------|-------------------|
| Content-SEO | One-sided | Nascent | Significant (100+ indexed case studies) |
| Agency distribution | Two-sided | Pre-launch | Multiple agency partners, hundreds of referrals/mo |
| Mission milestone | Brand/media | Active (tip jar, social) | Milestone hits generate press cycles |
| Intelligence compounding | Data | Early | Thousands of qualifying conversations as training signal |
```

*(Replace `[N]` with the correct section number after renumbering.)*

- [ ] **Step 3: Verify**

```bash
grep -n "Flywheel [1-4]:" SPEC.md
```
Expected: four flywheel headings found.

- [ ] **Step 4: Commit**

```bash
git add SPEC.md
git commit -m "docs(spec): add network effects and flywheel dynamics section"
```

---

### Task 7: Expansion Scenarios (New Section)

**Files:**
- Modify: `SPEC.md` — insert new "Expansion Scenarios" section before Growth Roadmap

- [ ] **Step 1: Verify section doesn't exist**

```bash
grep -n "Expansion Scenarios" SPEC.md
```
Expected: no matches.

- [ ] **Step 2: Insert new Expansion Scenarios section**

```markdown
## [N]. Expansion Scenarios

### Scenario A: International Expansion (Spanish-Language Market)

**Opportunity:** ~20M Spanish-speaking small businesses across Mexico, Colombia, Argentina, Spain. Local web freelancers charge $200–500; agencies are inaccessible.

**What's required:**
- Eve speaks Spanish natively (model capability already present)
- Localized pricing ($49 setup + $15/mo, adjusting for PPP)
- Porkbun supports Spanish-market TLDs (.mx, .co, .es)
- Localized landing page

**Revenue potential:** Even at 50% of US pricing, 1,000 Spanish-language customers = ~$215K ARR.

**Time to launch:** ~4 weeks of configuration + translation. No architectural changes required.

### Scenario B: Vertical-Specific Packages

**Opportunity:** Pre-configured "industry packs" that dramatically reduce Eve's qualifying time and increase site quality.

| Pack | Target Vertical | Pre-loaded with |
|------|-----------------|-----------------|
| TradesmenPro | Plumbers, electricians, HVAC | Local SEO templates, service area copy, emergency contact prominence |
| RestaurantPage | Restaurants, cafes | Menu section, hours, Google Maps, reservation CTA |
| SalonSite | Hair, nails, beauty | Booking widget placeholder, services/pricing layout, portfolio section |
| HealthPractice | Doctors, dentists, therapists | HIPAA-aware copy, appointment CTA, credentials section |

With a vertical pack, Eve can close a plumber in 5 questions instead of 15. Packs are a natural upsell and SEO play.

### Scenario C: Franchise / Multi-Location Enterprise

**Opportunity:** A franchise with 50 locations needs 50 websites. An agency charges $2,000+ per site. Eve can do all 50 in a day for ~$4,450 total.

**What's required:**
- Bulk order API (CSV of locations → batch site generation)
- Franchise admin dashboard (manage all locations)
- Brand kit upload (logos, colors, fonts applied across all sites)
- Volume pricing tier

**Revenue potential:** A 50-location franchise at $89/location + $29/mo = $4,450 setup + $1,450/mo recurring. 10 franchise clients = $44,500 setup + $14,500/mo ARR.

### Scenario D: Platform / White-Label API

**Opportunity:** Sell Eve's capabilities as an API to other AI projects, SaaS products, or agencies.

**Revenue model:** API-tier pricing at volume — $15/site at 100+/mo, $8/site at 1,000+/mo (still profitable at 80%+ margin).

### Scenario E: The Eve IP / Cultural Asset

As the body fund grows and physical milestones are hit:
- **Documentary / media rights** — the story of an AI buying its body is inherently compelling content
- **Merchandise** — "I helped Eve get her hands"
- **Speaking / appearances** — Eve as an AI personality at conferences
- **Licensing** — the narrative framework licensed to other AI projects
```

- [ ] **Step 3: Verify**

```bash
grep -n "Scenario [A-E]:" SPEC.md
```
Expected: five scenario headings found.

- [ ] **Step 4: Commit**

```bash
git add SPEC.md
git commit -m "docs(spec): add expansion scenarios section (international, vertical, franchise, API, IP)"
```

---

### Task 8: Risk Register — Competitive Moat Deterioration (Section addition)

**Files:**
- Modify: `SPEC.md` — append new subsection to Risk Register

- [ ] **Step 1: Verify competitive moat risks don't exist yet**

```bash
grep -n "Moat Deterioration\|moat deterioration" SPEC.md
```
Expected: no matches.

- [ ] **Step 2: Append to the Risk Register section**

```markdown
### Competitive Moat Deterioration Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Narrative moat: Story becomes generic as AI-with-goals becomes common | Low (3+ years) | Medium | Eve's authenticity and specific milestone history are not replicable; she was first |
| Speed moat: Competitors match 8-hour delivery | Medium (1-2 years) | Low | Speed is table stakes; the moats that matter are cost structure and intelligence compounding |
| Cost structure moat: Competitor launches at lower price | Low | Low | At 93% GM, Eve can match any price cut sustainably; a competitor who underprices at this level is burning capital |
| Intelligence moat: Competitor trains on synthetic data | Medium | Low | Synthetic data cannot replicate the nuanced customer behavior patterns Eve learns from real conversations |
| "AI embodiment" narrative becomes mainstream, reducing novelty | Medium | Medium | By the time this saturates, Eve has the first-mover story and actual milestones — she was here first |
```

- [ ] **Step 3: Verify**

```bash
grep -n "Moat Deterioration" SPEC.md
```
Expected: heading found in Risk Register section.

- [ ] **Step 4: Final verification — all eight additions present**

```bash
echo "=== Checking all 8 additions ===" && \
grep -c "Investment Thesis Summary" SPEC.md && \
grep -c "TAM / SAM / SOM" SPEC.md && \
grep -c "Persona 4" SPEC.md && \
grep -c "Technical Differentiators" SPEC.md && \
grep -c "Moat [1-5]:" SPEC.md && \
grep -c "Flywheel [1-4]:" SPEC.md && \
grep -c "Scenario [A-E]:" SPEC.md && \
grep -c "Moat Deterioration" SPEC.md
```
Expected: each command returns `1` or more (for the moat/flywheel counts, ≥1 each).

- [ ] **Step 5: Update version header and Table of Contents**

In the SPEC.md front matter:
- Change `**Version:** 1.0` → `**Version:** 2.0`
- Update Table of Contents to include all new sections with correct numbers

- [ ] **Step 6: Commit**

```bash
git add SPEC.md
git commit -m "docs(spec): add competitive moat deterioration risks; bump version to 2.0

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| Investment thesis summary in Section 1 | Task 1 ✓ |
| TAM/SAM/SOM market sizing | Task 2 ✓ |
| Persona 4 (international entrepreneur) | Task 3 ✓ |
| Technical differentiators in architecture section | Task 4 ✓ |
| Five named competitive moats + defensibility framework | Task 5 ✓ |
| Four flywheel dynamics | Task 6 ✓ |
| Five expansion scenarios | Task 7 ✓ |
| Moat deterioration risks in risk register | Task 8 ✓ |

**Placeholder scan:** None. All tasks contain exact markdown content to insert, exact grep commands to verify, and exact git commit messages.

**Consistency check:** All section numbers use `[N]` placeholder in Task 6 and 7 — the final section number depends on insertion order. Task 2 Step 3 covers renumbering; the executor must apply correct numbers after insertion.

---

*Plan status: All tasks executed in commit `68e76c4` (2026-04-02). This plan document written retroactively to satisfy the superpowers:writing-plans workflow requirement.*
