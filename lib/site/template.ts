/**
 * Site Template Renderer
 *
 * Produces a single self-contained index.html for a customer's landing page.
 * No external dependencies — all CSS is inlined so the file works as a static asset.
 *
 * The template is designed for small businesses: clean hero, feature grid, about, contact.
 */

import type { SiteContent } from './content-generator';

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Render a complete, self-contained HTML page from AI-generated site content.
 */
export function renderSiteHtml(content: SiteContent, domain: string): string {
  const contactHref = content.contactEmail
    ? `mailto:${content.contactEmail}`
    : `mailto:hello@${domain}`;

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
      <div class="logo">${esc(content.businessName)}</div>
      <a href="${contactHref}" class="btn btn-outline">Contact Us</a>
    </nav>
  </header>

  <main>
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
            .join('\n          ')}
        </div>
      </div>
    </section>

    <section class="about" id="about">
      <div class="container about-inner">
        <div class="about-content">
          <h2 class="section-title">About Us</h2>
          <p class="about-text">${esc(content.about)}</p>
          <a href="${contactHref}" class="btn btn-primary">${esc(content.ctaText)}</a>
        </div>
        <div class="about-visual" aria-hidden="true">
          <div class="about-blob">${content.businessName.slice(0, 1)}</div>
        </div>
      </div>
    </section>

    <section class="cta-banner">
      <div class="container cta-inner">
        <h2>Ready to get started?</h2>
        <p>Reach out today — we'd love to work with you.</p>
        <a href="${contactHref}" class="btn btn-white">${esc(content.ctaText)}</a>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <p class="footer-name">${esc(content.businessName)}</p>
      <p class="footer-copy">&copy; ${new Date().getFullYear()} ${esc(content.businessName)}. All rights reserved.</p>
      ${
        content.contactEmail
          ? `<a href="mailto:${esc(content.contactEmail)}" class="footer-email">${esc(content.contactEmail)}</a>`
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
    .nav { display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .logo { font-weight: 700; font-size: 1.1rem; color: var(--primary); letter-spacing: -0.02em; }

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
    .hero-inner { display: flex; flex-direction: column; align-items: center; gap: 20px; }
    .tagline { font-size: 0.875rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      opacity: 0.8; }
    .hero-headline { font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 800; line-height: 1.15;
      letter-spacing: -0.03em; max-width: 780px; }
    .hero-sub { font-size: 1.15rem; opacity: 0.88; max-width: 600px; }

    /* ── Features ── */
    .features { padding: 88px 0; background: var(--bg-soft); }
    .section-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 40px;
      text-align: center; }
    .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
    .feature-card { background: var(--bg); border-radius: var(--radius); padding: 32px 28px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .feature-icon { font-size: 2rem; margin-bottom: 12px; }
    .feature-title { font-size: 1.05rem; font-weight: 700; margin-bottom: 8px; }
    .feature-desc { color: var(--fg-muted); font-size: 0.93rem; }

    /* ── About ── */
    .about { padding: 88px 0; }
    .about-inner { display: flex; align-items: center; gap: 64px; }
    .about-content { flex: 1; display: flex; flex-direction: column; gap: 20px; }
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

    /* ── Footer ── */
    .footer { background: var(--fg); color: #d1d5db; padding: 40px 0; }
    .footer-inner { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
    .footer-name { font-weight: 700; color: #fff; font-size: 1rem; }
    .footer-copy { font-size: 0.85rem; }
    .footer-email { color: #93c5fd; font-size: 0.85rem; text-decoration: none; }
    .footer-email:hover { text-decoration: underline; }

    /* ── Responsive ── */
    @media (max-width: 680px) {
      .about-inner { flex-direction: column; gap: 32px; }
      .about-visual { display: none; }
      .hero { padding: 72px 0 56px; }
    }
  `;
}
