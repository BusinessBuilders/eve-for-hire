/**
 * Site Template Renderer
 *
 * Produces self-contained HTML pages for a customer's static site.
 * No external dependencies — all CSS is inlined so files work as static assets
 * served by Caddy with no external HTTP requests required.
 *
 * Pages: index.html, about.html, services.html, contact.html
 */

import type { SiteContent } from './content-generator';

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Render all pages for a customer site.
 * Returns a map of filename → HTML. Upload every file to the site root on VPS.
 */
export function renderSitePages(
  content: SiteContent,
  domain: string,
): Record<string, string> {
  return {
    'index.html': renderHome(content, domain),
    'about.html': renderAbout(content),
    'services.html': renderServices(content),
    'contact.html': renderContact(content, domain),
  };
}

/**
 * @deprecated Use renderSitePages() instead.
 * Kept so existing callers compile during migration.
 */
export function renderSiteHtml(content: SiteContent, domain: string): string {
  return renderHome(content, domain);
}

// ─── Page renderers ───────────────────────────────────────────────────────────

function renderHome(content: SiteContent, _domain: string): string {
  return page(content, 'index.html', `
  <section class="hero">
    <div class="container hero-inner">
      <p class="tagline">${esc(content.tagline)}</p>
      <h1 class="hero-headline">${esc(content.headline)}</h1>
      <p class="hero-sub">${esc(content.subheadline)}</p>
      <a href="contact.html" class="btn btn-primary">${esc(content.ctaText)}</a>
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
        <a href="about.html" class="btn btn-primary">Our Story &rarr;</a>
      </div>
      <div class="about-visual" aria-hidden="true">
        <div class="about-blob">${esc(content.businessName.slice(0, 1))}</div>
      </div>
    </div>
  </section>

  <section class="cta-banner">
    <div class="container cta-inner">
      <h2>Ready to get started?</h2>
      <p>Reach out today &mdash; we&rsquo;d love to work with you.</p>
      <a href="contact.html" class="btn btn-white">${esc(content.ctaText)}</a>
    </div>
  </section>
`);
}

function renderAbout(content: SiteContent): string {
  const story = content.aboutPage?.story ?? content.about;
  const mission =
    content.aboutPage?.mission ??
    `${esc(content.businessName)} is dedicated to delivering excellent results for every client.`;

  return page(content, 'about.html', `
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

function renderServices(content: SiteContent): string {
  const intro =
    content.servicesPage?.intro ??
    `Here&rsquo;s what ${esc(content.businessName)} can do for you.`;
  const items = content.servicesPage?.items ?? content.features.map((f) => ({
    icon: f.icon,
    title: f.title,
    description: f.description,
    price: undefined as string | undefined,
  }));

  return page(content, 'services.html', `
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

  const detailRows = [
    cp?.address
      ? `<div class="contact-detail"><span class="contact-icon">&#x1F4CD;</span><span>${esc(cp.address)}</span></div>`
      : '',
    cp?.phone
      ? `<div class="contact-detail"><span class="contact-icon">&#x1F4DE;</span><a href="tel:${esc(cp.phone)}">${esc(cp.phone)}</a></div>`
      : '',
    cp?.hours
      ? `<div class="contact-detail"><span class="contact-icon">&#x1F550;</span><span>${esc(cp.hours)}</span></div>`
      : '',
    content.contactEmail
      ? `<div class="contact-detail"><span class="contact-icon">&#x2709;&#xFE0F;</span><a href="mailto:${esc(content.contactEmail)}">${esc(content.contactEmail)}</a></div>`
      : '',
  ]
    .filter(Boolean)
    .join('\n        ');

  return page(content, 'contact.html', `
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
            <textarea id="cf-message" name="message" rows="5" required placeholder="Tell us how we can help&hellip;"></textarea>
          </div>
          <div id="cf-status" class="cf-status" aria-live="polite"></div>
          <button type="submit" class="btn btn-primary" id="cf-submit">Send Message</button>
        </form>
        <script>
          (function() {
            var ENDPOINT = 'https://eve.center/api/contact/${esc(domain)}';
            var form = document.getElementById('contact-form');
            var status = document.getElementById('cf-status');
            var submit = document.getElementById('cf-submit');
            form.addEventListener('submit', function(e) {
              e.preventDefault();
              submit.disabled = true;
              submit.textContent = 'Sending\u2026';
              status.textContent = '';
              status.className = 'cf-status';
              fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: document.getElementById('cf-name').value,
                  email: document.getElementById('cf-email').value,
                  message: document.getElementById('cf-message').value
                })
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
  currentPage: string,
  mainHtml: string,
): string {
  const navLinks = [
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

  const mailtoHref = content.contactEmail
    ? `mailto:${content.contactEmail}`
    : 'contact.html';

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
      <div class="nav-links">${navLinks}</div>
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
    .nav { display: flex; align-items: center; gap: 1rem; height: 64px; }
    .logo { font-weight: 700; font-size: 1.1rem; color: var(--primary); letter-spacing: -0.02em;
      text-decoration: none; flex-shrink: 0; }
    .nav-links { display: flex; gap: 0.25rem; flex: 1; }
    .nav-link { padding: 0.35rem 0.75rem; border-radius: 6px; text-decoration: none;
      font-size: 0.9rem; color: var(--fg-muted); transition: color 0.15s, background 0.15s; }
    .nav-link:hover, .nav-active { color: var(--primary); background: rgba(0,0,0,0.04); }
    .nav-cta { margin-left: auto; flex-shrink: 0; }

    /* ── Buttons ── */
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 22px;
      border-radius: 8px; font-weight: 600; font-size: 0.95rem; text-decoration: none;
      transition: transform 0.15s, box-shadow 0.15s; cursor: pointer; border: none; }
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
    .about-blob { width: 160px; height: 160px; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex; align-items: center; justify-content: center;
      font-size: 3.5rem; font-weight: 800; color: #fff; }

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
    .footer-nav { display: flex; gap: 1.5rem; margin-bottom: 8px; flex-wrap: wrap; justify-content: center; }
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
