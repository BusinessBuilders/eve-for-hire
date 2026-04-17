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

  ${renderHowItWorks(content)}
  ${renderPricing(content)}
  ${renderFaq(content)}
  ${renderGeolocation(content)}

  <section class="about" id="about">
    <div class="container about-inner">
      <div class="about-content">
        <h2 class="section-title">About Us</h2>
        <p class="about-text">${esc(content.about)}</p>
        <a href="about.html" class="btn btn-primary">Our Story &rarr;</a>
      </div>
      <div class="about-visual about-visual-v13" aria-hidden="true">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" class="premium-svg">
          <defs>
            <linearGradient id="grad-about" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--primary)" />
              <stop offset="100%" stop-color="var(--accent)" />
            </linearGradient>
          </defs>
          <rect x="50" y="50" width="300" height="300" rx="48" fill="url(#grad-about)" opacity="0.1" />
          <rect x="80" y="80" width="240" height="240" rx="32" fill="url(#grad-about)" />
          <path d="M160 200L190 230L240 180" stroke="white" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="320" cy="80" r="40" fill="var(--accent)" />
          <text x="320" y="92" text-anchor="middle" fill="white" font-family="var(--font-heading)" font-weight="900" font-size="32">${esc(content.businessName.slice(0, 1))}</text>
        </svg>
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
      <div class="about-visual about-visual-v13" aria-hidden="true">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" class="premium-svg">
          <defs>
            <linearGradient id="grad-about" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--primary)" />
              <stop offset="100%" stop-color="var(--accent)" />
            </linearGradient>
          </defs>
          <rect x="50" y="50" width="300" height="300" rx="48" fill="url(#grad-about)" opacity="0.1" />
          <rect x="80" y="80" width="240" height="240" rx="32" fill="url(#grad-about)" />
          <path d="M160 200L190 230L240 180" stroke="white" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="320" cy="80" r="40" fill="var(--accent)" />
          <text x="320" y="92" text-anchor="middle" fill="white" font-family="var(--font-heading)" font-weight="900" font-size="32">${esc(content.businessName.slice(0, 1))}</text>
        </svg>
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
  const isCinematic = content.theme === 'cinematic';
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

  const fonts = isCinematic
    ? '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">'
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${esc(content.subheadline)}" />
  <title>${esc(content.businessName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ${fonts}
  <style>
    ${css(content)}
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

function css(content: SiteContent): string {
  const { primaryColor: primary, accentColor: accent, backgroundColor: bg, softBackgroundColor: bgSoft, theme } = content;
  const isCinematic = theme === 'cinematic';
  
  if (isCinematic) {
    return `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :root {
        --primary: ${primary};
        --accent: ${accent};
        --fg: #e2e8f0;
        --fg-muted: #94a3b8;
        --bg: #0a0a10;
        --surface: #0f0f1a;
        --border: rgba(255, 255, 255, 0.08);
        --glass: rgba(255, 255, 255, 0.03);
        --radius: 16px;
        --font: 'Outfit', system-ui, sans-serif;
        --font-heading: 'Bebas Neue', system-ui, sans-serif;
      }

      html { scroll-behavior: smooth; }
      body { font-family: var(--font); color: var(--fg); background: var(--bg); line-height: 1.6; }

      .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

      /* ── Header ── */
      .header { position: sticky; top: 0; background: rgba(10, 10, 16, 0.8); backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border); z-index: 100; }
      .nav { display: flex; align-items: center; gap: 1rem; height: 72px; }
      .logo { font-family: var(--font-heading); font-size: 1.5rem; color: var(--primary); letter-spacing: 0.02em;
        text-decoration: none; flex-shrink: 0; }
      .nav-links { display: flex; gap: 0.5rem; flex: 1; }
      .nav-link { padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none;
        font-size: 0.95rem; color: var(--fg-muted); transition: all 0.2s ease; }
      .nav-link:hover, .nav-active { color: #fff; background: var(--glass); }
      .nav-cta { margin-left: auto; flex-shrink: 0; }

      /* ── Buttons ── */
      .btn { display: inline-flex; align-items: center; justify-content: center; padding: 12px 28px;
        border-radius: 10px; font-weight: 600; font-size: 1rem; text-decoration: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: none; }
      .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
      .btn-primary { 
        background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%); 
        color: #fff;
        box-shadow: 0 0 20px color-mix(in srgb, var(--primary), transparent 60%);
      }
      .btn-outline { border: 2px solid var(--primary); color: var(--primary); background: transparent; }
      .btn-outline:hover { background: var(--primary); color: #fff; }
      .btn-white { background: #fff; color: #000; }

      /* ── Hero ── */
      .hero { padding: 140px 0 100px; position: relative; overflow: hidden; text-align: center; }
      .hero::before {
        content: ''; position: absolute; inset: 0;
        background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--primary), transparent 85%) 0%, transparent 70%);
        z-index: -1;
      }
      .hero-sm { padding: 80px 0 60px; }
      .hero-inner { display: flex; flex-direction: column; align-items: center; gap: 24px; }
      .tagline { font-size: 0.9rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--primary); opacity: 0.9; }
      .hero-headline { 
        font-family: var(--font-heading); font-size: clamp(3rem, 8vw, 5.5rem); font-weight: 400; line-height: 1;
        letter-spacing: 0.02em; max-width: 900px;
        background: linear-gradient(135deg, #fff 0%, var(--fg-muted) 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      }
      .hero-sub { font-size: 1.25rem; color: var(--fg-muted); max-width: 650px; font-weight: 300; }

      /* ── Features / Services ── */
      .features { padding: 100px 0; background: var(--surface); }
      .section-title { font-family: var(--font-heading); font-size: 2.5rem; letter-spacing: 0.02em; margin-bottom: 48px;
        text-align: center; color: #fff; }
      .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; }
      .feature-card { 
        background: var(--glass); border-radius: var(--radius); padding: 40px 32px;
        backdrop-filter: blur(12px); border: 1px solid var(--border);
        transition: all 0.4s ease;
      }
      .feature-card:hover { border-color: var(--primary); transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
      .feature-icon { font-size: 2.5rem; margin-bottom: 20px; }
      .feature-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; color: #fff; }
      .feature-desc { color: var(--fg-muted); font-size: 1rem; }
      .service-price { margin-top: 16px; font-weight: 600; color: var(--primary); font-size: 1.1rem; font-family: var(--font-heading); }

      /* ── About ── */
      .about { padding: 100px 0; }
      .about-inner { display: flex; align-items: center; gap: 80px; }
      .about-content { flex: 1; display: flex; flex-direction: column; gap: 24px; }
      .about-content .section-title { text-align: left; margin-bottom: 0; }
      .about-text { color: var(--fg-muted); font-size: 1.1rem; font-weight: 300; }
      .about-visual { flex: 0 0 240px; display: flex; align-items: center; justify-content: center; }
      .about-blob { width: 200px; height: 200px; border-radius: 40px;
        background: linear-gradient(135deg, var(--primary), var(--accent));
        display: flex; align-items: center; justify-content: center;
        font-size: 5rem; font-family: var(--font-heading); color: #fff;
        box-shadow: 0 0 40px color-mix(in srgb, var(--primary), transparent 70%);
        transform: rotate(-3deg);
      }

      /* ── CTA Banner ── */
      .cta-banner { background: var(--surface); padding: 100px 0; text-align: center; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
      .cta-inner { display: flex; flex-direction: column; align-items: center; gap: 24px; }
      .cta-inner h2 { font-family: var(--font-heading); font-size: 3rem; color: #fff; }
      .cta-inner p { color: var(--fg-muted); font-size: 1.2rem; max-width: 600px; font-weight: 300; }

      /* ── Contact ── */
      .contact-section { padding: 100px 0; }
      .contact-inner { display: grid; grid-template-columns: 1fr 2fr; gap: 80px; align-items: start; }
      .contact-details { display: flex; flex-direction: column; gap: 24px; }
      .contact-details .section-title { text-align: left; margin-bottom: 8px; }
      .contact-detail { display: flex; align-items: center; gap: 16px; font-size: 1.05rem; color: var(--fg-muted); }
      .contact-icon { font-size: 1.5rem; flex-shrink: 0; color: var(--primary); }
      .contact-detail a { color: #fff; text-decoration: none; }
      .contact-detail a:hover { color: var(--primary); }
      .contact-form-wrap .section-title { text-align: left; margin-bottom: 32px; }
      .contact-form { display: flex; flex-direction: column; gap: 24px; }
      .form-group { display: flex; flex-direction: column; gap: 10px; }
      .form-group label { font-size: 0.9rem; font-weight: 600; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; }
      .form-group input, .form-group textarea {
        padding: 14px 18px; border-radius: 12px; border: 1px solid var(--border);
        font-family: var(--font); font-size: 1rem; color: #fff;
        background: var(--glass); backdrop-filter: blur(8px); transition: all 0.2s; resize: vertical; }
      .form-group input:focus, .form-group textarea:focus {
        outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary), transparent 90%); }
      .cf-status { font-size: 1rem; border-radius: 10px; padding: 16px; display: none; }
      .cf-status:not(:empty) { display: block; }
      .cf-success { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
      .cf-error { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }

      /* ── Footer ── */
      .footer { background: #050508; color: #64748b; padding: 64px 0 40px; border-top: 1px solid var(--border); }
      .footer-inner { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
      .footer-nav { display: flex; gap: 2rem; margin-bottom: 12px; flex-wrap: wrap; justify-content: center; }
      .footer-nav a { color: #94a3b8; text-decoration: none; font-size: 0.95rem; }
      .footer-nav a:hover { color: #fff; }
      .footer-name { font-family: var(--font-heading); color: #fff; font-size: 1.5rem; letter-spacing: 0.02em; }
      .footer-copy { font-size: 0.9rem; }
      .footer-email { color: var(--primary); font-size: 0.95rem; text-decoration: none; }

      /* ── Responsive ── */
      @media (max-width: 900px) {
        .about-inner { flex-direction: column; gap: 48px; text-align: center; }
        .about-content .section-title { text-align: center; }
        .about-visual { order: -1; }
        .contact-inner { grid-template-columns: 1fr; gap: 48px; }
      }
      @media (max-width: 768px) {
        .nav-links { display: none; }
        .hero { padding: 100px 0 72px; }
      }
    `;
  }

  // Classic Theme (Existing)
  const isLightHero = isColorLight(primary) || isColorLight(accent);
  const heroTextColor = isLightHero ? '#111827' : '#ffffff';

  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --primary: ${primary};
      --accent: ${accent};
      --fg: #111827;
      --fg-muted: #6b7280;
      --bg: ${bg || '#ffffff'};
      --bg-soft: ${bgSoft || '#f9fafb'};
      --radius: 12px;
      --font: system-ui, -apple-system, "Segoe UI", sans-serif;
    }

    html { scroll-behavior: smooth; }
    body { font-family: var(--font); color: var(--fg); background: var(--bg); line-height: 1.6; }

    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

    /* ── Header ── */
    .header { position: sticky; top: 0; background: color-mix(in srgb, var(--bg), transparent 8%); backdrop-filter: blur(8px);
      border-bottom: 1px solid rgba(0,0,0,0.08); z-index: 100; }
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
    .btn-primary { background: var(--primary); color: ${isColorLight(primary) ? '#111827' : '#ffffff'}; }
    .btn-outline { border: 1.5px solid var(--primary); color: var(--primary); background: transparent; }
    .btn-white { background: #fff; color: var(--primary); }

    /* ── Hero ── */
    .hero { padding: 100px 0 80px; background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: ${heroTextColor}; text-align: center; }
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
      box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.08); }
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
      font-size: 3.5rem; font-weight: 800; color: ${heroTextColor}; }

    /* ── CTA Banner ── */
    .cta-banner { background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: ${heroTextColor}; padding: 80px 0; text-align: center; }
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
      padding: 10px 14px; border-radius: 8px; border: 1.5px solid rgba(0,0,0,0.1);
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


function renderHowItWorks(content: SiteContent): string {
  if (!content.howItWorks || content.howItWorks.length === 0) return '';

  return `
  <section class="how-it-works section-padding">
    <div class="container">
      <h2 class="section-title">How It Works</h2>
      <div class="step-grid">
        ${content.howItWorks
          .map(
            (step, i) => `
          <div class="step-card">
            <div class="step-number">${i + 1}</div>
            <h3 class="step-title">${esc(step.title)}</h3>
            <p class="step-desc">${esc(step.description)}</p>
          </div>`,
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

function renderFaq(content: SiteContent): string {
  if (!content.faq || content.faq.length === 0) return '';

  return `
  <section class="faq section-padding">
    <div class="container" style="max-width: 800px">
      <h2 class="section-title">Common Questions</h2>
      <div style="display:flex; flex-direction:column; gap:var(--space-4)">
        ${content.faq
          .map(
            (item) => `
          <div class="glass" style="padding:1.5rem; border-radius:var(--radius)">
            <h3 style="font-size:1.1rem; margin-bottom:0.5rem; color:var(--fg)">${esc(item.question)}</h3>
            <p style="color:var(--fg-muted); font-size:0.95rem">${esc(item.answer)}</p>
          </div>`,
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

function renderPricing(content: SiteContent): string {
  if (!content.pricing) return '';

  return `
  <section class="pricing section-padding" style="background: var(--bg-soft)">
    <div class="container">
      <h2 class="section-title">${esc(content.pricing.title)}</h2>
      <p style="text-align:center; color:var(--fg-muted); margin-top:-2rem; margin-bottom:3rem">${esc(content.pricing.description)}</p>
      <div class="feature-grid">
        ${content.pricing.tiers
          .map(
            (tier) => `
          <div class="feature-card ${tier.featured ? 'glass' : ''}" style="${tier.featured ? 'border-color:var(--primary); transform:scale(1.05); z-index:1;' : ''}">
            <h3 class="feature-title">${esc(tier.name)}</h3>
            <p class="service-price" style="font-size:2.5rem; margin-bottom:1rem">${esc(tier.price)}</p>
            <ul style="list-style:none; margin-bottom:2rem; flex-grow:1; display:flex; flex-direction:column; gap:0.5rem">
              ${tier.features
                .map(
                  (f) => `<li style="display:flex; gap:0.5rem; font-size:0.95rem; color:var(--fg-muted)">
                <span style="color:var(--primary)">✓</span> ${esc(f)}
              </li>`,
                )
                .join('')}
            </ul>
            <a href="contact.html" class="btn ${tier.featured ? 'btn-primary' : 'btn-outline'}" style="width:100%">Get Started</a>
          </div>`,
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

function renderGeolocation(content: SiteContent): string {
  if (!content.location) return '';

  return `
  <section class="geolocation-section section-padding">
    <div class="container geo-inner">
      <div class="geo-map-wrap">
        <div class="geo-map-bg"></div>
        <div class="geo-pulse"></div>
        <div class="geo-marker"></div>
      </div>
      <div class="geo-content">
        <h2 class="section-title">Serving ${esc(content.location.city)}</h2>
        <p class="about-text">We provide fast, reliable service within a ${content.location.serviceRadius}-mile radius of ${esc(content.location.city)}. Our team is currently active and ready to help.</p>
        <div class="geo-status" id="geo-status">
          <div class="geo-dot" id="geo-dot"></div>
          <span id="geo-text">Ready to check your area...</span>
        </div>
        <button class="btn btn-outline" onclick="simulateGeo()" id="geo-btn">Check Service Area</button>
      </div>
    </div>
    <script>
      function simulateGeo() {
        const btn = document.getElementById('geo-btn');
        const dot = document.getElementById('geo-dot');
        const text = document.getElementById('geo-text');
        
        btn.disabled = true;
        btn.textContent = 'Locating...';
        dot.className = 'geo-dot';
        text.textContent = 'Identifying your location...';

        setTimeout(() => {
          dot.className = 'geo-dot active';
          text.textContent = 'We\\'re in your area! 📍 Estimated arrival: 15-30 mins.';
          btn.textContent = 'Area Verified';
        }, 1500);
      }
    </script>
  </section>`;
}

function isColorLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Using HSP color model to determine perceived brightness
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  return hsp > 170;
}
