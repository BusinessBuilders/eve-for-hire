# Phase 1 Product Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship multi-page sites, a working contact form backend, session persistence for re-engagement, and a smoke test script for Phase 1 of the eve.center product.

**Architecture:** Four additive features on top of the existing pipeline: (1) `lib/site/template.ts` renders 4 HTML files instead of 1; `lib/site/build-service.ts` uploads all 4; (2) a new Next.js API route at `app/api/contact/[domain]/route.ts` receives form submissions and forwards via SMTP using nodemailer; (3) chat page swaps `sessionStorage` → `localStorage` plus a returning-user banner; (4) `scripts/smoke-test.sh` exercises all API endpoints with curl.

**Tech Stack:** Next.js 15 App Router, TypeScript, better-sqlite3, nodemailer, bash (smoke test)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/site/content-generator.ts` | Modify | Extend `SiteContent` schema with optional page fields; extend AI prompt |
| `lib/site/template.ts` | Modify | Replace `renderSiteHtml()` with `renderSitePages()` returning 4-file map |
| `lib/site/build-service.ts` | Modify | Upload all 4 pages; call `renderSitePages()` instead of `renderSiteHtml()` |
| `lib/order/store.ts` | Modify | Add `findByDomain(domain)` to interface + SQLite impl |
| `app/api/contact/[domain]/route.ts` | Create | Contact form POST handler with rate limiting, order lookup, nodemailer |
| `app/chat/page.tsx` | Modify | `sessionStorage` → `localStorage`; returning-user banner |
| `scripts/smoke-test.sh` | Create | curl-based API smoke tests |
| `docs/smoke-test-runbook.md` | Create | Manual E2E runbook |
| `package.json` | Modify | Add `nodemailer` + `@types/nodemailer` |

---

## Task 1: Install nodemailer

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

```bash
cd /home/magiccat/.paperclip/instances/default/projects/73ea94d4-2b33-466b-8019-2e5fa03bc5c6/68969dc8-d4a4-449e-8a2d-a4e828b04bc1/eve-for-hire
npm install nodemailer
npm install --save-dev @types/nodemailer
```

Expected: `package.json` now lists `"nodemailer"` in dependencies and `"@types/nodemailer"` in devDependencies.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add nodemailer for contact form email forwarding

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 2: Extend SiteContent schema for multi-page content

**Files:**
- Modify: `lib/site/content-generator.ts`

The `SiteContentSchema` currently produces only the fields needed for a single landing page. We add three optional page-specific groups so the AI can populate richer content for dedicated pages.

- [ ] **Step 1: Add optional page schemas to `SiteContentSchema`**

Open `lib/site/content-generator.ts`. After the closing of the existing `features` field (around line 30), add three optional fields before the `contactEmail` field:

```typescript
// BEFORE (excerpt around line 30):
  features: z
    .array(...)
    .min(3)
    .max(6)
    .describe('Key features or benefits of the business'),
  about: z
    .string()
    .describe(...),
  primaryColor: ...

// AFTER — add these three fields between `about` and `primaryColor`:
  about: z
    .string()
    .describe(
      '2-3 sentence paragraph about the business for the "About Us" section',
    ),
  servicesPage: z
    .object({
      intro: z.string().describe('One sentence intro for the services page'),
      items: z
        .array(
          z.object({
            icon: z.string().describe('A single relevant emoji'),
            title: z.string().describe('Service name, 2-5 words'),
            description: z.string().describe('One sentence describing this service'),
            price: z.string().optional().describe('Price or price range, e.g. "From $99"'),
          }),
        )
        .min(1)
        .max(8),
    })
    .optional()
    .describe('Content for the dedicated Services page'),
  aboutPage: z
    .object({
      story: z.string().describe('2-3 sentences telling the business origin story'),
      mission: z.string().describe('1-2 sentence mission statement'),
    })
    .optional()
    .describe('Extended content for the dedicated About page'),
  contactPage: z
    .object({
      address: z.string().optional().describe('Street address if applicable'),
      phone: z.string().optional().describe('Phone number if applicable'),
      hours: z.string().optional().describe('Business hours, e.g. "Mon–Fri 9am–5pm"'),
    })
    .optional()
    .describe('Contact details for the Contact page'),
  primaryColor: ...
```

- [ ] **Step 2: Extend the AI prompt to elicit page content**

In the same file, find `buildPrompt()`. Replace the JSON schema at the end of the function (the `parts.push(...)` block that starts with `Return a single valid JSON object`) with:

```typescript
  parts.push('');
  parts.push(`Return a single valid JSON object with exactly these fields:
{
  "businessName": string,
  "tagline": string,
  "headline": string — punchy hero headline, max 10 words,
  "subheadline": string — 1-2 sentences,
  "ctaText": string — e.g. "Book a Call",
  "features": [{ "icon": string, "title": string, "description": string }],  (3 to 6 items)
  "about": string — 2-3 sentences for the About section,
  "servicesPage": {
    "intro": string — one sentence intro,
    "items": [{ "icon": string, "title": string, "description": string, "price"?: string }]  (1-8 items)
  },
  "aboutPage": {
    "story": string — 2-3 sentences origin story,
    "mission": string — 1-2 sentence mission statement
  },
  "contactPage": {
    "address"?: string,
    "phone"?: string,
    "hours"?: string
  },
  "primaryColor": string — dominant brand hex color (e.g. "#2563eb"),
  "accentColor": string — secondary accent hex color,
  "contactEmail"?: string — contact email if derivable
}`);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -40
```

Expected: No TypeScript errors in `lib/site/content-generator.ts`. (Other errors OK for now — build will fail until all tasks are complete.)

- [ ] **Step 4: Commit**

```bash
git add lib/site/content-generator.ts
git commit -m "feat: extend SiteContent schema with multi-page fields

Adds optional servicesPage, aboutPage, contactPage fields to SiteContent.
Updates AI prompt to elicit per-page content.

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 3: Implement renderSitePages() in template.ts

**Files:**
- Modify: `lib/site/template.ts`

Replace the single `renderSiteHtml()` with `renderSitePages()` that returns a map of filename → HTML. All 4 pages share the same CSS (inlined per file for zero-dependency static hosting). The contact page embeds the form with hardcoded `eve.center` API endpoint.

- [ ] **Step 1: Replace the entire contents of `lib/site/template.ts`**

```typescript
/**
 * Site Template Renderer
 *
 * Produces self-contained HTML pages for a customer's static site.
 * No external dependencies — all CSS is inlined so files work as static assets.
 *
 * Pages: index.html, about.html, services.html, contact.html
 */

import type { SiteContent } from './content-generator';

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Render all pages for a customer site. Returns a map of filename → HTML.
 * Upload all files to the site root on the VPS.
 */
export function renderSitePages(
  content: SiteContent,
  domain: string,
): Record<string, string> {
  return {
    'index.html': renderHome(content, domain),
    'about.html': renderAbout(content, domain),
    'services.html': renderServices(content, domain),
    'contact.html': renderContact(content, domain),
  };
}

/**
 * @deprecated Use renderSitePages() instead.
 * Kept for backward compatibility during transition.
 */
export function renderSiteHtml(content: SiteContent, domain: string): string {
  return renderHome(content, domain);
}

// ─── Page renderers ───────────────────────────────────────────────────────────

function renderHome(content: SiteContent, domain: string): string {
  const contactHref = 'contact.html';

  return page(content, domain, 'index.html', `
  <section class="hero">
    <div class="container hero-inner">
      <p class="tagline">${esc(content.tagline)}</p>
      <h1 class="hero-headline">${esc(content.headline)}</h1>
      <p class="hero-sub">${esc(content.subheadline)}</p>
      <a href="${contactHref}" class="btn btn-primary">${esc(content.ctaText)}</a>
    </div>
  </section>

  <section class="features" id="features">
    <div class="container">
      <h2 class="section-title">What We Offer</h2>
      <div class="feature-grid">
        ${content.features
          .map(
            (f) => `<div class="feature-card">
          <div class="feature-icon">${f.icon}</div>
          <h3 class="feature-title">${esc(f.title)}</h3>
          <p class="feature-desc">${esc(f.description)}</p>
        </div>`,
          )
          .join('\n        ')}
      </div>
    </div>
  </section>

  <section class="about" id="about">
    <div class="container about-inner">
      <div class="about-content">
        <h2 class="section-title">About Us</h2>
        <p class="about-text">${esc(content.about)}</p>
        <a href="about.html" class="btn btn-primary">Our Story →</a>
      </div>
      <div class="about-visual" aria-hidden="true">
        <div class="about-blob">${esc(content.businessName.slice(0, 1))}</div>
      </div>
    </div>
  </section>

  <section class="cta-banner">
    <div class="container cta-inner">
      <h2>Ready to get started?</h2>
      <p>Reach out today — we&rsquo;d love to work with you.</p>
      <a href="${contactHref}" class="btn btn-white">${esc(content.ctaText)}</a>
    </div>
  </section>
  `);
}

function renderAbout(content: SiteContent, domain: string): string {
  const story = content.aboutPage?.story ?? content.about;
  const mission =
    content.aboutPage?.mission ??
    `${esc(content.businessName)} is dedicated to delivering excellent results for every client.`;

  return page(content, domain, 'about.html', `
  <section class="hero hero-sm">
    <div class="container hero-inner">
      <h1 class="hero-headline">About ${esc(content.businessName)}</h1>
      <p class="hero-sub">${esc(content.tagline)}</p>
    </div>
  </section>

  <section class="about" id="story">
    <div class="container about-inner">
      <div class="about-content">
        <h2 class="section-title">Our Story</h2>
        <p class="about-text">${esc(story)}</p>
        <h2 class="section-title" style="margin-top:2rem">Our Mission</h2>
        <p class="about-text">${esc(mission)}</p>
        <a href="contact.html" class="btn btn-primary" style="margin-top:1rem">${esc(content.ctaText)}</a>
      </div>
      <div class="about-visual" aria-hidden="true">
        <div class="about-blob">${esc(content.businessName.slice(0, 1))}</div>
      </div>
    </div>
  </section>
  `);
}

function renderServices(content: SiteContent, domain: string): string {
  const intro =
    content.servicesPage?.intro ??
    `Here&rsquo;s what ${esc(content.businessName)} can do for you.`;
  const items = content.servicesPage?.items ?? content.features.map((f) => ({
    icon: f.icon,
    title: f.title,
    description: f.description,
    price: undefined,
  }));

  return page(content, domain, 'services.html', `
  <section class="hero hero-sm">
    <div class="container hero-inner">
      <h1 class="hero-headline">Our Services</h1>
      <p class="hero-sub">${intro}</p>
    </div>
  </section>

  <section class="features" id="services">
    <div class="container">
      <div class="feature-grid">
        ${items
          .map(
            (s) => `<div class="feature-card">
          <div class="feature-icon">${s.icon}</div>
          <h3 class="feature-title">${esc(s.title)}</h3>
          <p class="feature-desc">${esc(s.description)}</p>
          ${s.price ? `<p class="service-price">${esc(s.price)}</p>` : ''}
        </div>`,
          )
          .join('\n        ')}
      </div>
    </div>
  </section>

  <section class="cta-banner">
    <div class="container cta-inner">
      <h2>Interested in working together?</h2>
      <a href="contact.html" class="btn btn-white">${esc(content.ctaText)}</a>
    </div>
  </section>
  `);
}

function renderContact(content: SiteContent, domain: string): string {
  const cp = content.contactPage;
  const contactEmail = content.contactEmail;

  const detailRows = [
    cp?.address ? `<div class="contact-detail"><span class="contact-icon">📍</span><span>${esc(cp.address)}</span></div>` : '',
    cp?.phone ? `<div class="contact-detail"><span class="contact-icon">📞</span><a href="tel:${esc(cp.phone)}">${esc(cp.phone)}</a></div>` : '',
    cp?.hours ? `<div class="contact-detail"><span class="contact-icon">🕐</span><span>${esc(cp.hours)}</span></div>` : '',
    contactEmail ? `<div class="contact-detail"><span class="contact-icon">✉️</span><a href="mailto:${esc(contactEmail)}">${esc(contactEmail)}</a></div>` : '',
  ]
    .filter(Boolean)
    .join('\n        ');

  return page(content, domain, 'contact.html', `
  <section class="hero hero-sm">
    <div class="container hero-inner">
      <h1 class="hero-headline">Contact Us</h1>
      <p class="hero-sub">We&rsquo;d love to hear from you.</p>
    </div>
  </section>

  <section class="contact-section">
    <div class="container contact-inner">
      ${
        detailRows
          ? `<div class="contact-details">
        <h2 class="section-title">Get In Touch</h2>
        ${detailRows}
      </div>`
          : ''
      }
      <div class="contact-form-wrap">
        <h2 class="section-title">Send a Message</h2>
        <form class="contact-form" id="contact-form">
          <div class="form-group">
            <label for="cf-name">Your Name</label>
            <input type="text" id="cf-name" name="name" required placeholder="Jane Smith" />
          </div>
          <div class="form-group">
            <label for="cf-email">Email Address</label>
            <input type="email" id="cf-email" name="email" required placeholder="jane@example.com" />
          </div>
          <div class="form-group">
            <label for="cf-message">Message</label>
            <textarea id="cf-message" name="message" rows="5" required placeholder="Tell us how we can help…"></textarea>
          </div>
          <div id="cf-status" class="cf-status" aria-live="polite"></div>
          <button type="submit" class="btn btn-primary" id="cf-submit">Send Message</button>
        </form>
        <script>
          (function() {
            var form = document.getElementById('contact-form');
            var status = document.getElementById('cf-status');
            var submit = document.getElementById('cf-submit');
            form.addEventListener('submit', function(e) {
              e.preventDefault();
              submit.disabled = true;
              submit.textContent = 'Sending\u2026';
              status.textContent = '';
              status.className = 'cf-status';
              var data = {
                name: document.getElementById('cf-name').value,
                email: document.getElementById('cf-email').value,
                message: document.getElementById('cf-message').value
              };
              fetch('https://eve.center/api/contact/${esc(domain)}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              })
              .then(function(r) { return r.json(); })
              .then(function(json) {
                if (json.ok) {
                  status.textContent = 'Message sent! We\u2019ll be in touch soon.';
                  status.className = 'cf-status cf-success';
                  form.reset();
                } else {
                  status.textContent = json.error || 'Something went wrong. Please try again.';
                  status.className = 'cf-status cf-error';
                }
              })
              .catch(function() {
                status.textContent = 'Network error. Please try again.';
                status.className = 'cf-status cf-error';
              })
              .finally(function() {
                submit.disabled = false;
                submit.textContent = 'Send Message';
              });
            });
          })();
        </script>
      </div>
    </div>
  </section>
  `);
}

// ─── Shared page shell ────────────────────────────────────────────────────────

function page(
  content: SiteContent,
  _domain: string,
  currentPage: string,
  mainHtml: string,
): string {
  const nav = [
    { href: 'index.html', label: 'Home' },
    { href: 'about.html', label: 'About' },
    { href: 'services.html', label: 'Services' },
    { href: 'contact.html', label: 'Contact' },
  ]
    .map(
      ({ href, label }) =>
        `<a href="${href}" class="nav-link${href === currentPage ? ' nav-active' : ''}">${label}</a>`,
    )
    .join('');

  const contactEmail = content.contactEmail;
  const mailtoHref = contactEmail ? `mailto:${contactEmail}` : `mailto:hello@${_domain}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${esc(content.subheadline)}" />
  <title>${esc(content.businessName)}</title>
  <style>
    ${css(content.primaryColor, content.accentColor)}
  </style>
</head>
<body>
  <header class="header">
    <nav class="nav container">
      <a href="index.html" class="logo">${esc(content.businessName)}</a>
      <div class="nav-links">${nav}</div>
      <a href="${mailtoHref}" class="btn btn-outline nav-cta">Contact Us</a>
    </nav>
  </header>

  <main>
    ${mainHtml}
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-nav">
        <a href="index.html">Home</a>
        <a href="about.html">About</a>
        <a href="services.html">Services</a>
        <a href="contact.html">Contact</a>
      </div>
      <p class="footer-name">${esc(content.businessName)}</p>
      <p class="footer-copy">&copy; ${new Date().getFullYear()} ${esc(content.businessName)}. All rights reserved.</p>
      ${
        contactEmail
          ? `<a href="mailto:${esc(contactEmail)}" class="footer-email">${esc(contactEmail)}</a>`
          : ''
      }
    </div>
  </footer>
</body>
</html>`;
}

// ─── HTML escape ─────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function css(primary: string, accent: string): string {
  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --primary: ${primary};
      --accent: ${accent};
      --fg: #111827;
      --fg-muted: #6b7280;
      --bg: #ffffff;
      --bg-soft: #f9fafb;
      --radius: 12px;
      --font: system-ui, -apple-system, "Segoe UI", sans-serif;
    }

    html { scroll-behavior: smooth; }
    body { font-family: var(--font); color: var(--fg); background: var(--bg); line-height: 1.6; }

    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

    /* ── Header ── */
    .header { position: sticky; top: 0; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px);
      border-bottom: 1px solid #e5e7eb; z-index: 100; }
    .nav { display: flex; align-items: center; gap: 1rem; height: 64px; }
    .logo { font-weight: 700; font-size: 1.1rem; color: var(--primary); letter-spacing: -0.02em;
      text-decoration: none; flex-shrink: 0; }
    .nav-links { display: flex; gap: 0.25rem; flex: 1; }
    .nav-link { padding: 0.35rem 0.75rem; border-radius: 6px; text-decoration: none;
      font-size: 0.9rem; color: var(--fg-muted); transition: color 0.15s, background 0.15s; }
    .nav-link:hover, .nav-active { color: var(--primary); background: rgba(0,0,0,0.04); }
    .nav-cta { margin-left: auto; }

    /* ── Buttons ── */
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 22px;
      border-radius: 8px; font-weight: 600; font-size: 0.95rem; text-decoration: none;
      transition: transform 0.15s, box-shadow 0.15s; cursor: pointer; }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-outline { border: 1.5px solid var(--primary); color: var(--primary); background: transparent; }
    .btn-white { background: #fff; color: var(--primary); }

    /* ── Hero ── */
    .hero { padding: 100px 0 80px; background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: #fff; text-align: center; }
    .hero-sm { padding: 60px 0 48px; }
    .hero-inner { display: flex; flex-direction: column; align-items: center; gap: 20px; }
    .tagline { font-size: 0.875rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.8; }
    .hero-headline { font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 800; line-height: 1.15;
      letter-spacing: -0.03em; max-width: 780px; }
    .hero-sub { font-size: 1.15rem; opacity: 0.88; max-width: 600px; }

    /* ── Features / Services ── */
    .features { padding: 88px 0; background: var(--bg-soft); }
    .section-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 40px;
      text-align: center; }
    .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
    .feature-card { background: var(--bg); border-radius: var(--radius); padding: 32px 28px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .feature-icon { font-size: 2rem; margin-bottom: 12px; }
    .feature-title { font-size: 1.05rem; font-weight: 700; margin-bottom: 8px; }
    .feature-desc { color: var(--fg-muted); font-size: 0.93rem; }
    .service-price { margin-top: 10px; font-weight: 700; color: var(--primary); font-size: 0.95rem; }

    /* ── About ── */
    .about { padding: 88px 0; }
    .about-inner { display: flex; align-items: center; gap: 64px; }
    .about-content { flex: 1; display: flex; flex-direction: column; gap: 20px; }
    .about-content .section-title { text-align: left; margin-bottom: 0; }
    .about-text { color: var(--fg-muted); font-size: 1.05rem; line-height: 1.75; }
    .about-visual { flex: 0 0 200px; display: flex; align-items: center; justify-content: center; }
    .about-blob { width: 160px; height: 160px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex; align-items: center; justify-content: center; font-size: 3.5rem; font-weight: 800; color: #fff; }

    /* ── CTA Banner ── */
    .cta-banner { background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: #fff; padding: 80px 0; text-align: center; }
    .cta-inner { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .cta-inner h2 { font-size: 2rem; font-weight: 700; }
    .cta-inner p { opacity: 0.88; font-size: 1.05rem; }

    /* ── Contact ── */
    .contact-section { padding: 88px 0; }
    .contact-inner { display: grid; grid-template-columns: 1fr 2fr; gap: 64px; align-items: start; }
    .contact-details { display: flex; flex-direction: column; gap: 16px; }
    .contact-details .section-title { text-align: left; margin-bottom: 8px; }
    .contact-detail { display: flex; align-items: center; gap: 12px; font-size: 0.95rem; }
    .contact-icon { font-size: 1.2rem; flex-shrink: 0; }
    .contact-detail a { color: var(--primary); text-decoration: none; }
    .contact-detail a:hover { text-decoration: underline; }
    .contact-form-wrap .section-title { text-align: left; margin-bottom: 24px; }
    .contact-form { display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.875rem; font-weight: 600; color: var(--fg); }
    .form-group input, .form-group textarea {
      padding: 10px 14px; border-radius: 8px; border: 1.5px solid #d1d5db;
      font-family: var(--font); font-size: 0.95rem; color: var(--fg);
      background: var(--bg); transition: border-color 0.15s; resize: vertical; }
    .form-group input:focus, .form-group textarea:focus {
      outline: none; border-color: var(--primary); }
    .cf-status { font-size: 0.9rem; border-radius: 8px; padding: 10px 14px; display: none; }
    .cf-status:not(:empty) { display: block; }
    .cf-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .cf-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

    /* ── Footer ── */
    .footer { background: var(--fg); color: #d1d5db; padding: 40px 0; }
    .footer-inner { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
    .footer-nav { display: flex; gap: 1.5rem; margin-bottom: 8px; }
    .footer-nav a { color: #9ca3af; text-decoration: none; font-size: 0.85rem; }
    .footer-nav a:hover { color: #fff; }
    .footer-name { font-weight: 700; color: #fff; font-size: 1rem; }
    .footer-copy { font-size: 0.85rem; }
    .footer-email { color: #93c5fd; font-size: 0.85rem; text-decoration: none; }
    .footer-email:hover { text-decoration: underline; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .contact-inner { grid-template-columns: 1fr; gap: 40px; }
      .nav-links { display: none; }
    }
    @media (max-width: 680px) {
      .about-inner { flex-direction: column; gap: 32px; }
      .about-visual { display: none; }
      .hero { padding: 72px 0 56px; }
    }
  `;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep "lib/site/template"
```

Expected: No errors on `lib/site/template.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/site/template.ts
git commit -m "feat: replace renderSiteHtml with renderSitePages (4 pages)

Generates index.html, about.html, services.html, contact.html.
All pages share nav and footer. contact.html embeds a form that
POSTs to eve.center/api/contact/{domain}.

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 4: Update build-service.ts to upload all pages

**Files:**
- Modify: `lib/site/build-service.ts`

Replace the single `renderSiteHtml` call and `uploadFile` for `index.html` with a loop over all pages from `renderSitePages`.

- [ ] **Step 1: Update the import and upload logic in `lib/site/build-service.ts`**

Find this import near the top of `build-service.ts`:

```typescript
import { renderSiteHtml } from './template';
```

Replace it with:

```typescript
import { renderSitePages } from './template';
```

Then find the Phase 1 content generation block inside `buildAndDeployOrder()`:

```typescript
  // ── Phase 1: Generate content ───────────────────────────────────────────────
  // ...
  let html: string;
  try {
    const content = await generateSiteContent(requirements);
    html = renderSiteHtml(content, domain);
    console.log(`[build-service] content generated for ${domain} (${html.length} bytes)`);
  } catch (err) {
    // ...
  }
```

Replace with:

```typescript
  // ── Phase 1: Generate content ───────────────────────────────────────────────
  console.log(`[build-service] generating content for order ${orderId} domain=${domain}`);
  let pages: Record<string, string>;
  try {
    const content = await generateSiteContent(requirements);
    pages = renderSitePages(content, domain);
    const totalBytes = Object.values(pages).reduce((s, h) => s + h.length, 0);
    console.log(`[build-service] content generated for ${domain} (${Object.keys(pages).length} pages, ${totalBytes} bytes)`);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[build-service] content generation failed for ${orderId}:`, detail);
    await failBuild(orderId, `Content generation failed: ${detail}`);
    return { ok: false, phase: 'build', error: detail };
  }
```

Then find the SSH deploy block that uploads `index.html`:

```typescript
    // Upload the generated HTML.
    await session.uploadFile(`${siteRoot}/index.html`, html);
```

Replace with:

```typescript
    // Upload all generated pages.
    for (const [filename, html] of Object.entries(pages)) {
      await session.uploadFile(`${siteRoot}/${filename}`, html);
    }
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npm run build 2>&1 | grep -E "(error|Error|lib/site)" | head -20
```

Expected: No errors in `lib/site/` files.

- [ ] **Step 3: Commit**

```bash
git add lib/site/build-service.ts
git commit -m "feat: upload all 4 pages to VPS in build pipeline

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 5: Add findByDomain() to OrderStore

**Files:**
- Modify: `lib/order/store.ts`

The contact API needs to look up the customer email by domain name. SQLite already stores the full order JSON in the `data` column; we can use `json_extract` to query it.

- [ ] **Step 1: Add `findByDomain` to the `OrderStore` interface**

Find the `OrderStore` interface in `lib/order/store.ts` (around line 30):

```typescript
export interface OrderStore {
  create(input: CreateOrderInput): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByIdempotencyKey(key: string): Promise<Order | null>;
  transition(id: string, input: TransitionInput): Promise<TransitionResult>;
  list(opts?: { limit?: number; offset?: number }): Promise<Order[]>;
}
```

Add `findByDomain` to the interface:

```typescript
export interface OrderStore {
  create(input: CreateOrderInput): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByIdempotencyKey(key: string): Promise<Order | null>;
  findByDomain(domain: string): Promise<Order | null>;
  transition(id: string, input: TransitionInput): Promise<TransitionResult>;
  list(opts?: { limit?: number; offset?: number }): Promise<Order[]>;
}
```

- [ ] **Step 2: Implement `findByDomain` in `SqliteOrderStore`**

Find the `findByIdempotencyKey` method in `SqliteOrderStore` and add `findByDomain` directly after it:

```typescript
  async findByIdempotencyKey(key: string): Promise<Order | null> {
    const row = this.db
      .prepare<[string], { data: string }>('SELECT data FROM orders WHERE idempotency_key = ?')
      .get(key);
    return row ? (JSON.parse(row.data) as Order) : null;
  }

  async findByDomain(domain: string): Promise<Order | null> {
    const row = this.db
      .prepare<[string], { data: string }>(
        `SELECT data FROM orders WHERE json_extract(data, '$.domain.domain') = ?`,
      )
      .get(domain);
    return row ? (JSON.parse(row.data) as Order) : null;
  }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep "lib/order/store"
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/order/store.ts
git commit -m "feat: add findByDomain() to OrderStore for contact form lookup

Uses SQLite json_extract to query domain.domain field without full table scan.

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 6: Create contact form API route

**Files:**
- Create: `app/api/contact/[domain]/route.ts`

Handles contact form submissions from generated customer sites. Rate limited per IP. Looks up the business owner's email via the order store and forwards the message via SMTP.

- [ ] **Step 1: Create directory and file**

```bash
mkdir -p /home/magiccat/.paperclip/instances/default/projects/73ea94d4-2b33-466b-8019-2e5fa03bc5c6/68969dc8-d4a4-449e-8a2d-a4e828b04bc1/eve-for-hire/app/api/contact/\[domain\]
```

- [ ] **Step 2: Write `app/api/contact/[domain]/route.ts`**

```typescript
/**
 * Contact Form API
 *
 * Receives form submissions from generated customer sites and forwards
 * the visitor's message to the business owner via SMTP email.
 *
 * CORS: open (*) so the generated static sites can POST from any origin.
 * Rate limit: 5 requests per IP per hour to prevent spam.
 *
 * Required env vars (for email forwarding):
 *   SMTP_HOST  — SMTP server hostname
 *   SMTP_PORT  — SMTP port (default: 587)
 *   SMTP_USER  — SMTP username
 *   SMTP_PASS  — SMTP password or API key
 *   SMTP_FROM  — sender display+address, e.g. "Eve <hello@eve.center>"
 *
 * If SMTP env vars are absent, the endpoint still returns 200 (graceful degradation).
 */

import { type NextRequest } from 'next/server';
import nodemailer from 'nodemailer';
import { orderStore } from '@/lib/order/store';

// ─── Rate limiting ────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── Domain validation ────────────────────────────────────────────────────────

const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
): Promise<Response> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: 'Too many requests — please try again later' },
      { status: 429, headers: CORS },
    );
  }

  const { domain } = await params;

  if (!DOMAIN_RE.test(domain)) {
    return Response.json({ error: 'Invalid domain' }, { status: 400, headers: CORS });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS });
  }

  const { name, email, message } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof email !== 'string' || !email.includes('@') ||
    typeof message !== 'string' || !message.trim()
  ) {
    return Response.json(
      { error: 'name, email, and message are required' },
      { status: 400, headers: CORS },
    );
  }

  // Look up the business owner's email. Return 200 regardless to avoid
  // leaking whether a domain is registered with us.
  const order = await orderStore.findByDomain(domain);
  if (!order) {
    console.warn(`[contact] no order found for domain ${domain} — discarding submission`);
    return Response.json({ ok: true }, { headers: CORS });
  }

  // Forward via SMTP if configured.
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM ?? 'Eve <hello@eve.center>';

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: order.customerEmail,
        replyTo: `${name.trim()} <${email.trim()}>`,
        subject: `New contact from ${name.trim()} via ${domain}`,
        text: [
          `You received a new message on your website ${domain}:`,
          '',
          `From: ${name.trim()} <${email.trim()}>`,
          '',
          'Message:',
          message.trim(),
          '',
          '---',
          'Sent via Eve for Business (eve.center)',
        ].join('\n'),
      });

      console.log(`[contact] forwarded message from ${email} to ${order.customerEmail} for ${domain}`);
    } catch (err) {
      // Log but don't expose SMTP errors to the caller.
      console.error(`[contact] email send failed for ${domain}:`, err);
    }
  } else {
    console.warn('[contact] SMTP not configured — skipping email forwarding');
  }

  return Response.json({ ok: true }, { headers: CORS });
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "(contact|error)" | head -20
```

Expected: No errors in the contact route.

- [ ] **Step 4: Commit**

```bash
git add app/api/contact/
git commit -m "feat: add contact form API route with SMTP email forwarding

POST /api/contact/{domain} validates form fields, looks up order by domain,
and forwards visitor messages to the business owner via nodemailer/SMTP.
CORS open for cross-origin requests from static customer sites.
Rate limited to 5 req/IP/hour.

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 7: Implement session persistence (re-engagement)

**Files:**
- Modify: `app/chat/page.tsx`

Switch from `sessionStorage` to `localStorage` so the Eve session persists across tab closes. Add a returning-user welcome banner with a "Start fresh" escape hatch.

- [ ] **Step 1: Add `isReturningUser` state and update session initialization**

In `app/chat/page.tsx`, find the component state declarations near the top of `ChatPage`:

```typescript
  const [aiError, setAiError] = useState('');
  const [sessionId, setSessionId] = useState('');
```

Add a new state variable:

```typescript
  const [aiError, setAiError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isReturningUser, setIsReturningUser] = useState(false);
```

- [ ] **Step 2: Replace the sessionStorage useEffect with localStorage**

Find the existing `useEffect` that initializes the session:

```typescript
  useEffect(() => {
    let id = sessionStorage.getItem('eve-session');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('eve-session', id);
    }
    setSessionId(id);
  }, []);
```

Replace with:

```typescript
  useEffect(() => {
    const existing = localStorage.getItem('eve-session');
    const id = existing ?? crypto.randomUUID();
    if (!existing) {
      localStorage.setItem('eve-session', id);
    } else {
      setIsReturningUser(true);
    }
    setSessionId(id);
  }, []);
```

- [ ] **Step 3: Add `startFresh` helper function**

After the `submit` function inside `ChatPage`, add:

```typescript
  function startFresh() {
    const id = crypto.randomUUID();
    localStorage.setItem('eve-session', id);
    setSessionId(id);
    setIsReturningUser(false);
  }
```

- [ ] **Step 4: Add returning-user banner to the empty state**

Find the empty state JSX block in the messages section:

```tsx
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-avatar">🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
                  I&apos;m Eve.
                </div>
                <div style={{ color: 'var(--muted)', maxWidth: '400px', fontSize: '0.9rem' }}>
                  An AI agent earning money toward a robot body. Ask me anything — or hire me for real work.
                </div>
              </div>
            </div>
```

Replace with:

```tsx
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-avatar">🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
                  I&apos;m Eve.
                </div>
                <div style={{ color: 'var(--muted)', maxWidth: '400px', fontSize: '0.9rem' }}>
                  An AI agent earning money toward a robot body. Ask me anything — or hire me for real work.
                </div>
              </div>
              {isReturningUser && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 217, 255, 0.25)',
                  background: 'rgba(0, 217, 255, 0.06)',
                  fontSize: '0.85rem',
                  color: 'var(--muted)',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                }}>
                  <span>👋 Welcome back! Your conversation is saved.</span>
                  <button
                    onClick={startFresh}
                    style={{
                      background: 'none', border: '1px solid var(--border)',
                      borderRadius: '6px', padding: '0.25rem 0.6rem',
                      color: 'var(--muted)', cursor: 'pointer', fontSize: '0.78rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Start fresh →
                  </button>
                </div>
              )}
            </div>
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep "app/chat" | head -10
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add app/chat/page.tsx
git commit -m "feat: persist Eve chat session across browser closes (localStorage)

Switches sessionStorage to localStorage so returning users resume their
qualifying conversation with Eve. Adds welcome-back banner with start-fresh option.

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 8: Create smoke test script

**Files:**
- Create: `scripts/smoke-test.sh`

Tests all API endpoints with curl. Exits 0 if all pass, 1 if any fail.

- [ ] **Step 1: Create `scripts/` directory and write the script**

```bash
mkdir -p /home/magiccat/.paperclip/instances/default/projects/73ea94d4-2b33-466b-8019-2e5fa03bc5c6/68969dc8-d4a4-449e-8a2d-a4e828b04bc1/eve-for-hire/scripts
```

Write `scripts/smoke-test.sh`:

```bash
#!/usr/bin/env bash
# Eve for Hire — API Smoke Test
# Usage: BASE_URL=https://eve.center ./scripts/smoke-test.sh
# Defaults to http://localhost:3000 if BASE_URL not set.

set -euo pipefail

BASE="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

check() {
  local name="$1"
  local expected_status="$2"
  local actual_status="$3"
  local body="$4"

  if [ "$actual_status" = "$expected_status" ]; then
    echo -e "${GREEN}PASS${RESET} [$actual_status] $name"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}FAIL${RESET} [$actual_status != $expected_status] $name"
    echo "      body: ${body:0:200}"
    FAIL=$((FAIL + 1))
  fi
}

echo "Smoke testing $BASE"
echo "---"

# 1. Landing page loads
resp=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
check "GET / returns 200" "200" "$resp" ""

# 2. Chat API accepts a message (SSE stream)
body=$(curl -s -o - -w "\n%{http_code}" -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","parts":[{"type":"text","text":"hello"}]}]}')
status=$(echo "$body" | tail -1)
check "POST /api/chat returns 200" "200" "$status" "$body"

# 3. Domain search
body=$(curl -s -o - -w "\n%{http_code}" "$BASE/api/domains/search?q=acme")
status=$(echo "$body" | tail -1)
check "GET /api/domains/search returns 200" "200" "$status" "$body"

# 4. Orders checkout rejects missing fields (400)
body=$(curl -s -o - -w "\n%{http_code}" -X POST "$BASE/api/orders/checkout" \
  -H "Content-Type: application/json" \
  -d '{}')
status=$(echo "$body" | tail -1)
check "POST /api/orders/checkout with empty body returns 400" "400" "$status" "$body"

# 5. Orders list returns 200
body=$(curl -s -o - -w "\n%{http_code}" "$BASE/api/orders")
status=$(echo "$body" | tail -1)
check "GET /api/orders returns 200" "200" "$status" "$body"

# 6. Unknown order returns 404
body=$(curl -s -o - -w "\n%{http_code}" "$BASE/api/orders/00000000-0000-0000-0000-000000000000")
status=$(echo "$body" | tail -1)
check "GET /api/orders/fake-id returns 404" "404" "$status" "$body"

# 7. Contact form rejects missing fields (400)
body=$(curl -s -o - -w "\n%{http_code}" -X POST "$BASE/api/contact/example.com" \
  -H "Content-Type: application/json" \
  -d '{"name":""}')
status=$(echo "$body" | tail -1)
check "POST /api/contact/{domain} with missing fields returns 400" "400" "$status" "$body"

# 8. Contact form OPTIONS (CORS preflight) returns 204
resp=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BASE/api/contact/example.com" \
  -H "Access-Control-Request-Method: POST")
check "OPTIONS /api/contact/{domain} returns 204" "204" "$resp" ""

echo "---"
echo "Results: ${PASS} passed, ${FAIL} failed"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x /home/magiccat/.paperclip/instances/default/projects/73ea94d4-2b33-466b-8019-2e5fa03bc5c6/68969dc8-d4a4-449e-8a2d-a4e828b04bc1/eve-for-hire/scripts/smoke-test.sh
```

- [ ] **Step 3: Commit**

```bash
git add scripts/smoke-test.sh
git commit -m "feat: add API smoke test script (scripts/smoke-test.sh)

Tests 8 endpoints: landing page, chat, domain search, orders CRUD,
contact form validation, and CORS preflight.
Run with: BASE_URL=https://eve.center ./scripts/smoke-test.sh

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 9: Create manual E2E smoke test runbook

**Files:**
- Create: `docs/smoke-test-runbook.md`

- [ ] **Step 1: Write the runbook**

```markdown
# Eve for Hire — E2E Smoke Test Runbook

Run this manually to verify the full Phase 1 pipeline: chat → qualify → domain search → checkout → payment → domain registration → site build → deploy → live HTTPS.

## Prerequisites

- Dev server running: `npm run dev` (or production at `https://eve.center`)
- Stripe test mode enabled (check Stripe dashboard)
- Porkbun API keys set (`PORKBUN_API_KEY`, `PORKBUN_SECRET_KEY`)
- VPS accessible (`CONTABO_VPS_IP`, `CONTABO_SSH_PRIVATE_KEY`)
- SMTP configured (or check server logs to confirm email would have sent)

## Automated API Tests

Run first to catch obvious regressions:

```bash
./scripts/smoke-test.sh
```

All 8 checks should PASS before continuing.

## Step-by-Step E2E Flow

### 1. Chat & Qualify

1. Open `http://localhost:3000/chat` (or `https://eve.center/chat`)
2. Type: _"I run a plumbing business in Austin, TX and need a website"_
3. **Expected:** Eve responds and starts gathering requirements (business name, services, style)
4. Complete the qualifying conversation:
   - Business name: **AustinPro Plumbing**
   - Services: residential plumbing, leak repair, drain cleaning
   - Style: professional, blue color scheme
5. **Expected:** Eve suggests domain names and shows domain results card

### 2. Domain Selection

6. Eve shows domain availability card
7. **Expected:** At least one available `.com` domain listed
8. Click **Select →** on an available domain
9. **Expected:** Eve shows checkout card with $89 first month + domain

### 3. Checkout

10. Enter test email: `smoke-test@example.com`
11. Click **Proceed to Checkout →**
12. **Expected:** Stripe Checkout opens in new tab

### 4. Stripe Payment (Test Mode)

13. Use Stripe test card: `4242 4242 4242 4242`, exp `12/29`, CVC `123`, ZIP `10001`
14. Click **Pay**
15. **Expected:** Redirected to `/support/success` page showing order confirmation

### 5. Verify Order State

16. Check order via API:
```bash
curl http://localhost:3000/api/orders | jq '.[0] | {state, domain, identifier}'
```
**Expected:** `state: "building"` or later (pipeline is running)

### 6. Site Build & Deploy (5–10 minutes)

17. Wait for the build pipeline to complete. Monitor logs:
```bash
# On VPS
ssh root@$CONTABO_VPS_IP 'journalctl -u caddy -n 50'
```
18. **Expected:** 4 HTML files appear at `/var/www/sites/{domain}/`

### 7. DNS Propagation

19. Check DNS:
```bash
dig +short {domain} @8.8.8.8
```
**Expected:** Resolves to `$CONTABO_VPS_IP`
(This can take up to 5 minutes with fresh Porkbun DNS)

### 8. Smoke Test Live Site

20. Visit `https://{domain}` in browser
21. **Expected checklist:**
    - [ ] `index.html` loads with hero, features, about section
    - [ ] Nav links to About, Services, Contact work
    - [ ] `about.html` shows business story + mission
    - [ ] `services.html` shows services grid
    - [ ] `contact.html` shows contact form
    - [ ] Contact form submits and shows "Message sent!" (check server logs for email)
    - [ ] HTTPS certificate is valid (Caddy auto-provisioned via Let's Encrypt)

### 9. Verify Order is Live

22. Check final order state:
```bash
curl http://localhost:3000/api/orders | jq '.[0] | {state, "siteUrl": .deploy.siteUrl}'
```
**Expected:** `state: "live"`, `siteUrl: "https://{domain}"`

## Stripe Test Cards Reference

| Scenario | Card Number |
|----------|-------------|
| Payment succeeds | 4242 4242 4242 4242 |
| Card declined | 4000 0000 0000 0002 |
| Insufficient funds | 4000 0000 0000 9995 |
| 3D Secure required | 4000 0025 0000 3155 |

All test cards: expiry `12/29`, any 3-digit CVC, any 5-digit ZIP.

## Failure Modes & Recovery

| Symptom | Check | Fix |
|---------|-------|-----|
| Domain card never appears | Check `/api/domains/search` returns results | Verify `PORKBUN_API_KEY` env var |
| Checkout fails with error | Check browser console + server logs | Verify `STRIPE_SECRET_KEY` env var |
| Order stuck in `building` | Check server logs for SSH errors | Verify `CONTABO_VPS_IP`, `CONTABO_SSH_PRIVATE_KEY` |
| Site not live after 10 min | Check DNS + Caddy logs on VPS | Manual DNS check + `caddy reload` |
| Contact form sends no email | Check server logs for `[contact]` lines | Verify SMTP env vars |
```

- [ ] **Step 2: Commit**

```bash
git add docs/smoke-test-runbook.md
git commit -m "docs: add manual E2E smoke test runbook

Covers full pipeline: chat → qualify → domain → checkout → payment →
build → deploy → live. Includes Stripe test cards and failure recovery.

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
```

---

## Task 10: Full TypeScript build verification

- [ ] **Step 1: Run full build**

```bash
cd /home/magiccat/.paperclip/instances/default/projects/73ea94d4-2b33-466b-8019-2e5fa03bc5c6/68969dc8-d4a4-449e-8a2d-a4e828b04bc1/eve-for-hire
npm run build 2>&1
```

Expected: Build succeeds with `✓ Compiled successfully` (or equivalent Next.js success message). Zero TypeScript errors.

- [ ] **Step 2: Run automated smoke tests against local server (optional — requires running server)**

If a local dev server is running:

```bash
BASE_URL=http://localhost:3000 ./scripts/smoke-test.sh
```

Expected: `8 passed, 0 failed`

- [ ] **Step 3: Final commit if any fixups were needed**

If you made any fixup commits during build verification:
```bash
git log --oneline -8
```

Verify all 8 feature commits are present in order.

---

## Environment Variables Summary

The following env vars must be set in production for all features to work:

```bash
# Already required
ANTHROPIC_API_KEY=...
CONTABO_VPS_IP=...
CONTABO_SSH_USER=root
CONTABO_SSH_PRIVATE_KEY=...
PORKBUN_API_KEY=...
PORKBUN_SECRET_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# New — required for contact form email forwarding
SMTP_HOST=smtp.sendgrid.net        # or smtp.gmail.com, etc.
SMTP_PORT=587
SMTP_USER=apikey                   # or your SMTP username
SMTP_PASS=your-smtp-password
SMTP_FROM=Eve <hello@eve.center>
```
