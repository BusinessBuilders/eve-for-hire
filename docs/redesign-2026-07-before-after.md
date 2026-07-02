# eve.center redesign — before / after notes (2026-07-02)

Per-section record for the Workstream A definition of done. "Before" refers to the page
shipped through commit `4670b59`; "after" is the token-driven rebuild (`DESIGN.md`).

| Section | Before | After |
|---|---|---|
| Header | Floating "Sign in" pill only; no navigation. | Fixed slim header: EVE wordmark with orb mark, anchor nav (Capabilities / $89 Website / Story / Blog), Sign in + "Start a task" CTA. 44px targets. |
| Hero | "I'm Eve… web agency" pitch only; Bebas Neue condensed caps with cyan→coral gradient text; canvas particle network + 4 plasma rings (heavy JS animation); body-fund tracker embedded; two CTAs both → /chat. | All-around-agent positioning ("One AI that actually does the work"); Manrope 800 with single teal accent phrase; hand-built listening-orb SVG with capability spokes (voice/site/invoice/calendar) as the hero visual; dual CTA "Start a task" (primary) + "Get your $89 site" (secondary, funnel preserved); capability line. Particles/GSAP dropped for CSS-only motion. |
| Capabilities (new) | Did not exist — page jumped to social links. | 3-card grid: voice assistant (trust tiers, hold-to-approve), website builder ($89 link into spotlight), real actions (invoices/SMS/scheduling/research). Vector glyphs, no emoji. |
| How it works (new) | Did not exist. | 3 steps (You ask → She reasons → Work gets done) + terminal-style task log in JetBrains Mono showing a real build timeline. |
| Swarm ("The Agentic Swarm") | 6 emoji-icon cards (👑✍️🎨🚀✅📡). | Compact swarm rows inside the web-builder spotlight; color-coded dots (teal orchestrator, indigo specialists), same six agents, emoji removed. |
| Pricing | Same three tiers; Bebas headings, cyan/coral styling. | Identical tiers, prices, features and /chat CTAs (funnel untouched); token-styled cards, featured tier glows teal. |
| Portfolio ("Sites Designed by Eve") | 3 emoji-icon cards. | Same three sites and links, editorial cards with category tags, no emoji. |
| Free preview offer | Own section with 🎁 title. | Folded into the spotlight as an accent banner with the same /chat CTA. |
| Story / body fund | Tracker lived in the hero; "Support Eve's Journey" tip jar in a separate section with emoji buttons (☕⚡🦾). | Dedicated "Every job funds a body" section: story copy, follow chips (X/Discord/Telegram), fund panel with live /api/mission progress bar, goal line, tip jar (same /api/checkout amounts), emoji removed. |
| Contact ("Let's Talk") | Section with 💬/✈ CTA buttons. | "Put Eve to work today" access panel: Meet Eve (primary) + Telegram (secondary). |
| Footer | Same links. | Same links + tagline "earning her body"; token styling. |
| Chat widget | 💬 emoji button. | Teal circular button with vector chat glyph. |
| Fonts/tokens | Outfit/Bebas/DM Mono, cyan #00D9FF / coral #FF6B6B. | Manrope/JetBrains Mono, EVE tokens (#0B0F14 canvas, teal #2DD4BF, indigo #6366F1) shared with the mobile app. Old tokens remain in globals.css for the chat/dashboard/order pages until those are migrated. |

Verified: `next build` passes; full-page screenshots at 390px and 1440px show no overlaps,
clipping, or emoji; scroll reveals honor `prefers-reduced-motion` and stay visible without JS.
