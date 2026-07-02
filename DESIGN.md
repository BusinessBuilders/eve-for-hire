# eve.center — Design System

**Seeded from the EVE Design System** (`~/jarvis-sidecar/eve-app/design/tokens.json`, generated
via the `claude_design` connector and shipped in the EVE mobile app). The web and the mobile app
must read as one product; the tokens below are the shared contract. Distilled on top of the
[awesome-claude-design](https://github.com/VoltAgent/awesome-claude-design) principles: token,
rule, and **rationale live in the same file** so anyone (human or agent) extending the site makes
consistent decisions beyond the documented cases.

**Positioning this system serves:** Eve is an all-around AI agent — one intelligence that does
real work (voice, websites, invoices, scheduling, research). The site's atmosphere is
**cinematic dark editorial**: calm, premium, "a personal AI that runs on your hardware and
actually does the work." Not a SaaS template; not a neon crypto page.

---

## 1. Visual Theme

- **Dark is the primary brand.** Canvas `#0B0F14`. Light mode exists in the token contract but
  the marketing site ships dark-only — the mobile app, the orb, and the brand photography are
  all tuned to dark. *Rationale: one flawless theme beats two mediocre ones; dark carries the
  "runs on my own hardware, always on" feeling.*
- **Premium = restraint.** Vast negative space, one accent doing the work, glow reserved for
  live/interactive states. If a section feels empty, it's probably right. *Rationale: the
  awesome-claude-design survey shows "austerity" is the shared marker of premium brands
  (Apple/Ferrari class); density reads as dashboard, not brand.*
- **The listening orb is the signature element** — a teal→indigo radial with a breathing pulse
  and a 5-bar waveform (see §8). Everything else supports it.
- **No emoji anywhere in the UI.** Crafted vector glyphs / typographic marks only. *Rationale:
  emoji render inconsistently across platforms and instantly read as "AI-generated draft," the
  opposite of hand-built premium.*

## 2. Color

Use **semantic roles, never raw hexes** in components. All values are the `color.dark` ramp
from `tokens.json`; they are exposed as CSS custom properties in `app/globals.css`.

### Surfaces
| Token | Value | Role |
|---|---|---|
| `--surface-canvas` | `#0B0F14` | page background |
| `--surface-sunken` | `#060A0E` | recessed wells (code, terminal panes) |
| `--surface-raised` | `#11161D` | cards |
| `--surface-raised-2` | `#161D26` | nested cards, hover-lift of raised |
| `--surface-overlay` | `#1E2630` | menus, dialogs, toasts |

### Borders
| Token | Value | Role |
|---|---|---|
| `--border-subtle` | `#94A3B81A` | hairlines inside cards |
| `--border-default` | `#1E293B` | card and section boundaries |
| `--border-strong` | `#24303C` | interactive element resting borders |

### Text
| Token | Value | Role |
|---|---|---|
| `--text-primary` | `#F8FAFC` | headings, body |
| `--text-secondary` | `#94A3B8` | supporting copy, captions |
| `--text-tertiary` | `#64748B` | de-emphasized meta, placeholders |
| `--text-on-accent` | `#04201C` | text on teal fills |
| `--text-link` | `#5EEAD4` | inline links |

### Accents & status
| Token | Value | Role |
|---|---|---|
| `--accent` | `#2DD4BF` | teal — "calm intelligence"; primary CTAs, live states |
| `--accent-hover` | `#5EEAD4` | hover of accent fills/links |
| `--accent-pressed` | `#14B8A6` | active/pressed |
| `--accent-soft` | `#2DD4BF1F` | tinted chips, soft fills |
| `--accent-line` | `#2DD4BF4D` | accent-tinted borders |
| `--accent-2` | `#6366F1` | indigo — secondary accent, the orb's outer field |
| `--accent-2-soft` | `#6366F124` | indigo tint |
| `--success` / `--success-soft` | `#34D399` / `#34D39921` | confirmations |
| `--warning` / `--warning-soft` | `#FBBF24` / `#FBBF2424` | caution states |
| `--danger` / `--danger-soft` | `#F87171` / `#F8717121` | errors, destructive |

**Rules with rationale**
- Teal is the *only* CTA color. Indigo never fills a button — it's atmosphere (orb, gradients,
  soft chips). *One accent doing the work is what separates Lamborghini-gold restraint from
  rainbow-SaaS noise; two competing CTA colors halve conversion clarity.*
- Gradients are allowed **only** teal→indigo and only in the orb, hero atmosphere, and thin
  rules — never as button fills or text fills for body copy. *Gradient buttons are the #1
  generic-AI-design tell.*
- Color is never the sole signal (a11y): every status/state pairs color with a text label or
  glyph shape. *Inherited from the mobile app's trust-tier rule; red-green safe.*
- Old landing palette (`--cyan #00D9FF`, `--coral`) is **retired**. Any surviving usage should
  be migrated on touch. *Cyan+coral reads consumer-gadget; teal+indigo is the brand.*

## 3. Typography

- **Sans: Manrope** (Google Fonts; weights 300–800). Fallback stack:
  `Manrope, "Manrope Fallback", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Mono: JetBrains Mono** (Google Fonts) — figures, terminal/log motifs, prices, order ids.
  Enable `font-feature-settings: "tnum"` where numbers align. *Money and metrics line up;
  mono snippets sell "this thing actually executes."*
- Load via `next/font/google` (self-hosted, zero CLS), never a render-blocking `@import`.

### Scale (from `type.scale`, converted to rem @16px root, fluid on top)
| Token | Size / line / weight / tracking | Web usage |
|---|---|---|
| `display` | `clamp(2.125rem, 5.5vw + 1rem, 4rem)` / 1.15 / 800 / -0.02em | hero H1 only |
| `title-xl` | `clamp(1.75rem, 3vw + 0.75rem, 2.5rem)` / 1.2 / 800 / -0.018em | section H2 |
| `title` | 1.375rem / 1.27 / 700 / -0.015em | card H3 |
| `headline` | 1.0625rem / 1.4 / 700 / -0.011em | emphasized row, nav |
| `body-lg` | 1rem / 1.5 / 400 | hero sub, lead paragraphs |
| `body` | 0.9375rem / 1.47 / 400 | default copy |
| `body-sm` | 0.875rem / 1.43 / 400 | dense copy, footers |
| `label` | 0.8125rem / 1.23 / 600 | buttons, chips, form labels |
| `caption` | 0.75rem / 1.33 / 400 | meta, legal |
| `micro` | 0.6875rem / 1.27 / 700 / +0.08em / UPPERCASE | eyebrow kickers, badges |

**Rules with rationale**
- One `display` per page, one `title-xl` per section. *Hierarchy collapses when everything
  shouts; the mobile scale was built around a single display moment per screen.*
- Body copy never lighter than 400 and never below `body-sm` on mobile. *Thin light-on-dark
  text shimmers and fails contrast.*
- Eyebrow kickers (`micro`, uppercase, `--text-secondary` or `--accent`) label sections instead
  of decorative icons. *Editorial, cheap to render, no emoji temptation.*

## 4. Spacing, Radius, Sizing

4px grid, from `space`:
`--s1 4 · --s2 8 · --s3 12 · --s4 16 · --s5 20 · --s6 24 · --s7 32 · --s8 40 · --s9 48 · --s10 56 · --s11 64 · --s12 80` (px).

- Screen gutter: `20px` mobile (`gutterScreen`), `--s7` ≥768px. Content max-width `1120px`
  (sections), `72ch` (prose).
- Card padding `18px` (`padCard`), large card `22px`; gap between cards `14px` (`gapCard`).
- Section vertical rhythm: `--s12` (80px) mobile, `120px` desktop between major sections.
  *Whitespace rhythm is a token, not a vibe — consistent 80/120 keeps scroll pacing calm.*
- Radii (`radius`): chips/inputs `xs 6` · controls `md 14` · cards `lg 18` · sheets/hero
  panels `xl 24` · pills `999`. Cards are `lg`; never mix radii within one component.
- Controls (`control`): heights `sm 36 · md 44 · lg 52`. **Every touch target ≥44px** —
  `control-md` is the floor for anything tappable on mobile; primary CTAs use `lg`.

## 5. Elevation & Depth

Dark surfaces get depth from **lighter raised surfaces + hairline borders**, not big shadows.
From `elevation`:

| Token | Value | Use |
|---|---|---|
| `--glow-accent` | `0 8px 30px rgba(45,212,191,0.16)` | hover of primary CTA, live cards |
| `--glow-accent-strong` | `0 0 44px rgba(45,212,191,0.30)` | the orb only |
| `--ring-focus` | `0 0 0 3px rgba(45,212,191,0.35)` | `:focus-visible` on everything |
| `--ring-danger` | `0 0 0 3px rgba(248,113,113,0.30)` | destructive focus/error fields |

*Rationale: glow is a scarce resource — reserved for "alive" things (orb, primary action,
in-flight work). If everything glows, nothing is live.*

## 6. Component States

Every interactive component defines all six states. Missing states are bugs, not polish.

**Primary button** (teal fill, `--text-on-accent`, radius `md`, height `lg` for hero CTAs)
- default: `--accent` fill · hover: `--accent-hover` + `--glow-accent`, no transform >2px
- active: `--accent-pressed`, translate-y 1px · focus-visible: `--ring-focus`
- disabled: `--surface-raised-2` fill, `--text-tertiary`, no pointer events
- loading: label swaps to inline 3-dot pulse (`eve-think`), width locked to prevent reflow

**Secondary button** (transparent, `1px --accent-line` border, `--accent` text)
- hover: `--accent-soft` fill · active: border `--accent` · focus/disabled as primary

**Card**: default `--surface-raised` + `--border-default`; interactive cards hover to
`--surface-raised-2` + `--border-strong` (+`--glow-accent` only if the card is a primary
pathway); focus-within shows `--ring-focus`.

**Input**: `--surface-sunken` fill, `--border-strong`; focus `--accent` border + `--ring-focus`;
error `--danger` border + `--ring-danger` + caption in `--danger` (text, not color alone);
disabled `--text-tertiary` on `--surface-raised`.

**Link**: `--text-link`, no underline at rest, underline on hover/focus. In-body links always
underline. *Low-vision users shouldn't hunt for hover to find links in prose.*

## 7. Motion

From `motion`: `--dur-instant 90ms · --dur-fast 140ms · --dur-base 220ms · --dur-slow 340ms ·
--dur-deliberate 520ms`; `--ease-standard cubic-bezier(.2,.8,.2,1)`;
`--ease-emphasized cubic-bezier(.2,.9,.1,1)`; `--ease-exit cubic-bezier(.4,0,1,1)`;
`--ease-spring cubic-bezier(.34,1.56,.64,1)`.

- Hover feedback `fast`; reveals-on-scroll `base`–`slow`, translate ≤24px, once only.
- `deliberate` (520ms) is the **commit beat** — reserved for the orb's breath and
  hold-to-approve-style confirmations, echoing the mobile app.
- **Honor `prefers-reduced-motion`**: orb pulse → static ring, scroll reveals → opacity-only.
- No parallax, no scroll-jacking, no autoplaying carousels. *Motion is seasoning; the survey's
  "motion-first" brands earn it with 60fps craft — a marketing page that stutters on a phone
  loses the premium claim instantly.*
- Prefer CSS keyframes/transitions over JS animation libs; the page must not ship a motion
  dependency for what CSS does. Keyframe names follow the app: `eve-listen`, `eve-halo`,
  `eve-think`, `eve-wave`, `eve-commit`, `eve-rise`.

## 8. The Listening Orb (hero motif)

Hand-built standalone SVG (see `pitch-deck-svg` skill), not an AI-rendered image.
- Anatomy: teal-core → indigo-field radial (`--accent` → `--accent-2`), soft halo
  (`--glow-accent-strong`), **5-bar waveform** in the core (bars at weights 0.6/0.8/1/0.8/0.6 of
  core height), breathing pulse at `--dur-deliberate` rhythm (scale 1→1.04→1).
- Capability spokes (voice waveform, website block, invoice doc, calendar) orbit as thin-line
  vector glyphs on `--border-strong` strokes with `--accent-soft` fills — glyphs, not emoji.
- SVG gotchas: include `xmlns`, dereference every `var()` to literal hex inside the exported
  file, escape `&` in any font `@import`, `viewBox` + `width:100%` for crisp scaling.

## 9. Layout & Responsive Behavior

- **Mobile-first: 360–430px is the primary canvas.** Build it flawless there, then scale up.
- Breakpoints: `480px` (large phone) · `768px` (tablet: 2-col grids appear) · `1024px`
  (desktop: 3-col, nav expands) · `1280px` (max-width rails). Test the collapse at every one.
- CTAs land in the thumb zone: hero CTA visible without scroll at 360×640; sticky elements
  never cover inputs.
- Grids: capabilities 1-col → 2-col (768) → 3/4-col (1024). Cards equal-height; text truncates
  by design, never overflows.
- Images/SVG: explicit `width`/`height` or `aspect-ratio` (zero CLS); hero SVG inlined.

## 10. Do's & Don'ts

**Do**
- Use semantic tokens for every color/space/radius/duration. *A hex in a component is a future
  inconsistency.*
- Pair every status color with a label or glyph. Keep AA contrast (4.5:1 text, 3:1 large/UI).
- Show Eve *doing* work: terminal-style panes (`--surface-sunken` + JetBrains Mono), real
  product states, the real agent-swarm story (`lib/paperclip/delegate.ts` — it's real, tell it).
- Keep the $89 web-builder funnel path (chat → build → checkout) visually primary in its
  section: it pays for everything.

**Don't**
- No emoji as icons. No stock 3D robots. No AI-render hero images. *Every survey marker of
  "generic AI page."*
- No gradient text on body copy; no gradient button fills.
- No new fonts, no new accent hues, no light theme "just for one section."
- No layout that requires hover to access content (mobile has no hover).
- Never alter auth/chat/API/Stripe/Porkbun/Paperclip logic for a visual change — design edits
  are visual/UX only; every route and data flow stays intact.

## 11. Agent Prompt Guide

When extending this site: read this file first; use tokens via `var(--…)`; build the 360px
layout before the desktop one; add all six component states; run `next build` and check
WCAG 2.2 AA; screenshot mobile + desktop before calling a section done. When a decision isn't
covered here, choose the option with **more restraint** (fewer colors, more whitespace, less
motion) — that is the brand's default answer.
