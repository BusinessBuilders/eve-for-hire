/**
 * PoC Case Study Site Generator (BUS-107)
 *
 * Creates 3 demo orders and generates static HTML for:
 *   1. Mike's Plumbing — mikes-plumbing-austin.com
 *   2. Glow Studio — glowstudiopdx.com
 *   3. Casa Bonita Tacos — casabonitatacos.com
 *
 * Usage: node scripts/create-poc-sites.mjs
 * Output: scripts/poc-output/{domain}/ with index.html, about.html, services.html, contact.html
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'orders.db');
const OUT_DIR = path.join(__dirname, 'poc-output');

// ─── HTML escape ──────────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
function css(content) {
  const { primaryColor: primary, accentColor: accent, backgroundColor: bg, softBackgroundColor: bgSoft, theme, radius = '12px' } = content;
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

  // Classic Theme (Existing logic but cleaned up for the script)
  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --primary: ${primary}; --accent: ${accent};
      --fg: #0f172a; --fg-muted: #64748b;
      --bg: #ffffff; --bg-soft: #f8fafc;
      --radius: ${radius};
      --font-body: 'Inter', system-ui, -apple-system, sans-serif;
      --font-heading: 'Montserrat', system-ui, -apple-system, sans-serif;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    }
    html { scroll-behavior: smooth; }
    body { font-family: var(--font-body); color: var(--fg); background: var(--bg); line-height: 1.6; -webkit-font-smoothing: antialiased; }
    h1, h2, h3, h4, .logo { font-family: var(--font-heading); }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .header { position: sticky; top: 0; background: rgba(255,255,255,0.9); backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(0,0,0,0.05); z-index: 100; }
    .nav { display: flex; align-items: center; gap: 1rem; height: 72px; }
    .logo { font-weight: 800; font-size: 1.25rem; color: var(--fg); letter-spacing: -0.04em;
      text-decoration: none; flex-shrink: 0; display: flex; align-items: center; gap: 8px; }
    .logo::before { content: ""; display: block; width: 32px; height: 32px; background: var(--primary); border-radius: 6px; }
    .nav-links { display: flex; gap: 0.5rem; flex: 1; margin-left: 2rem; }
    .nav-link { padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none;
      font-size: 0.95rem; font-weight: 500; color: var(--fg-muted); transition: all 0.2s; }
    .nav-link:hover, .nav-active { color: var(--primary); background: rgba(0,0,0,0.03); }
    .nav-cta { margin-left: auto; flex-shrink: 0; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 12px 28px;
      border-radius: var(--radius); font-weight: 700; font-size: 0.95rem; text-decoration: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: none; gap: 8px; }
    .btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    .btn:active { transform: translateY(0); }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: color-mix(in srgb, var(--primary), black 10%); }
    .btn-outline { border: 2px solid var(--primary); color: var(--primary); background: transparent; }
    .btn-outline:hover { background: var(--primary); color: #fff; }
    .btn-white { background: #fff; color: var(--primary); }
    .hero { padding: 120px 0 100px; background: var(--fg); position: relative; overflow: hidden; color: #fff; text-align: center; }
    .hero::before { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%); opacity: 0.9; }
    .hero::after { content: ""; position: absolute; inset: 0; background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0); background-size: 32px 32px; }
    .hero-sm { padding: 80px 0 60px; }
    .hero-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 24px; }
    .tagline { font-size: 0.9rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 4px; }
    .hero-headline { font-size: clamp(2.25rem, 6vw, 3.75rem); font-weight: 800; line-height: 1.1;
      letter-spacing: -0.04em; max-width: 850px; }
    .hero-sub { font-size: 1.25rem; opacity: 0.9; max-width: 650px; font-weight: 400; }
    .features { padding: 100px 0; background: var(--bg-soft); }
    .section-title { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 48px; text-align: center; color: var(--fg); }
    .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; }
    .feature-card { background: var(--bg); border-radius: var(--radius); padding: 40px;
      box-shadow: var(--shadow-sm); border: 1px solid rgba(0,0,0,0.05); transition: all 0.3s; display: flex; flex-direction: column; }
    .feature-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--accent); }
    .feature-icon { font-size: 2.5rem; margin-bottom: 20px; display: block; line-height: 1; }
    .feature-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; color: var(--fg); }
    .feature-desc { color: var(--fg-muted); font-size: 1rem; flex-grow: 1; }
    .service-price { margin-top: 16px; font-weight: 700; color: var(--primary); font-size: 1.1rem; }
    .about { padding: 100px 0; }
    .about-inner { display: flex; align-items: center; gap: 80px; }
    .about-content { flex: 1; display: flex; flex-direction: column; gap: 24px; }
    .about-content .section-title { text-align: left; margin-bottom: 0; }
    .about-text { color: var(--fg-muted); font-size: 1.1rem; line-height: 1.8; }
    .about-visual { flex: 0 0 240px; display: flex; align-items: center; justify-content: center; }
    .about-blob { width: 200px; height: 200px; border-radius: 24px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex; align-items: center; justify-content: center;
      font-size: 5rem; font-weight: 900; color: #fff; box-shadow: var(--shadow-lg); transform: rotate(-3deg); }
    .cta-banner { background: var(--primary); color: #fff; padding: 100px 0; text-align: center; position: relative; overflow: hidden; }
    .cta-banner::before { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%); opacity: 0.9; }
    .cta-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 24px; }
    .cta-inner h2 { font-size: 2.5rem; font-weight: 800; letter-spacing: -0.03em; }
    .cta-inner p { opacity: 0.9; font-size: 1.2rem; max-width: 600px; }
    .contact-section { padding: 100px 0; }
    .contact-inner { display: grid; grid-template-columns: 1fr 1.5fr; gap: 80px; align-items: start; }
    .contact-details { display: flex; flex-direction: column; gap: 24px; }
    .contact-details .section-title { text-align: left; margin-bottom: 8px; }
    .contact-detail { display: flex; align-items: flex-start; gap: 16px; font-size: 1.05rem; }
    .contact-icon { font-size: 1.5rem; flex-shrink: 0; line-height: 1; }
    .contact-detail a { color: var(--primary); text-decoration: none; font-weight: 600; }
    .contact-detail a:hover { text-decoration: underline; }
    .contact-form-wrap { background: var(--bg-soft); padding: 48px; border-radius: var(--radius); }
    .contact-form-wrap .section-title { text-align: left; margin-bottom: 32px; }
    .contact-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 0.9rem; font-weight: 600; color: var(--fg); }
    .form-group input, .form-group textarea {
      padding: 12px 16px; border-radius: 8px; border: 2px solid #e2e8f0;
      font-family: var(--font-body); font-size: 1rem; color: var(--fg);
      background: var(--bg); transition: all 0.2s; resize: vertical; }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1); }
    .cf-status { font-size: 1rem; border-radius: 8px; padding: 16px; display: none; margin-top: 16px; font-weight: 500; }
    .cf-status:not(:empty) { display: block; }
    .cf-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .cf-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .footer { background: #0f172a; color: #94a3b8; padding: 64px 0 40px; }
    .footer-inner { display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center; }
    .footer-nav { display: flex; gap: 2rem; margin-bottom: 8px; flex-wrap: wrap; justify-content: center; }
    .footer-nav a { color: #94a3b8; text-decoration: none; font-size: 0.95rem; font-weight: 500; transition: color 0.2s; }
    .footer-nav a:hover { color: #fff; }
    .footer-name { font-weight: 800; color: #fff; font-size: 1.25rem; letter-spacing: -0.03em; }
    .footer-copy { font-size: 0.9rem; }
    .footer-email { color: var(--accent); font-size: 0.95rem; text-decoration: none; font-weight: 600; }
    @media (max-width: 900px) {
      .contact-inner { grid-template-columns: 1fr; gap: 60px; }
      .about-inner { flex-direction: column; gap: 48px; text-align: center; }
      .about-content .section-title { text-align: center; }
      .about-visual { order: -1; }
    }
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .hero { padding: 100px 0 80px; }
    }
  `;
}


// ─── Page builder ─────────────────────────────────────────────────────────────
function page(content, currentPage, mainHtml) {
  const isCinematic = content.theme === 'cinematic';
  const navLinks = [
    { href: 'index.html', label: 'Home' },
    { href: 'about.html', label: 'About' },
    { href: 'services.html', label: 'Services' },
    { href: 'contact.html', label: 'Contact' },
  ].map(({ href, label }) =>
    `<a href="${href}" class="nav-link${href === currentPage ? ' nav-active' : ''}">${label}</a>`
  ).join('');

  const mailtoHref = content.contactEmail ? `mailto:${content.contactEmail}` : 'contact.html';

  const fonts = isCinematic
    ? '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">'
    : '<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">';

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
  <style>${css(content)}</style>
</head>
<body>
  <header class="header">
    <nav class="nav container">
      <a href="index.html" class="logo">${esc(content.businessName)}</a>
      <div class="nav-links">${navLinks}</div>
      <a href="${mailtoHref}" class="btn btn-outline nav-cta">Contact Us</a>
    </nav>
  </header>
  <main>${mainHtml}</main>
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
      ${content.contactEmail ? `<a href="mailto:${esc(content.contactEmail)}" class="footer-email">${esc(content.contactEmail)}</a>` : ''}
    </div>
  </footer>
</body>
</html>`;
}


function renderHome(content) {
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
        ${content.features.map(f => `<div class="feature-card">
          <div class="feature-icon">${f.icon}</div>
          <h3 class="feature-title">${esc(f.title)}</h3>
          <p class="feature-desc">${esc(f.description)}</p>
        </div>`).join('\n')}
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
  </section>`);
}

function renderAbout(content) {
  const story = content.aboutPage?.story ?? content.about;
  const mission = content.aboutPage?.mission ?? `${esc(content.businessName)} is dedicated to delivering excellent results for every client.`;
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
  </section>`);
}

function renderServices(content) {
  const intro = content.servicesPage?.intro ?? `Here's what ${esc(content.businessName)} can do for you.`;
  const items = content.servicesPage?.items ?? content.features.map(f => ({ ...f }));
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
        ${items.map(s => `<div class="feature-card">
          <div class="feature-icon">${s.icon}</div>
          <h3 class="feature-title">${esc(s.title)}</h3>
          <p class="feature-desc">${esc(s.description)}</p>
          ${s.price ? `<p class="service-price">${esc(s.price)}</p>` : ''}
        </div>`).join('\n')}
      </div>
    </div>
  </section>
  <section class="cta-banner">
    <div class="container cta-inner">
      <h2>Interested in working together?</h2>
      <a href="contact.html" class="btn btn-white">${esc(content.ctaText)}</a>
    </div>
  </section>`);
}

function renderContact(content, domain) {
  const cp = content.contactPage ?? {};
  const detailRows = [
    cp.address ? `<div class="contact-detail"><span class="contact-icon">📍</span><span>${esc(cp.address)}</span></div>` : '',
    cp.phone ? `<div class="contact-detail"><span class="contact-icon">📞</span><a href="tel:${esc(cp.phone)}">${esc(cp.phone)}</a></div>` : '',
    cp.hours ? `<div class="contact-detail"><span class="contact-icon">🕐</span><span>${esc(cp.hours)}</span></div>` : '',
    content.contactEmail ? `<div class="contact-detail"><span class="contact-icon">✉️</span><a href="mailto:${esc(content.contactEmail)}">${esc(content.contactEmail)}</a></div>` : '',
  ].filter(Boolean).join('\n');

  const contactApiUrl = `https://${domain}/api/contact/${domain}`;

  return page(content, 'contact.html', `
  <section class="hero hero-sm">
    <div class="container hero-inner">
      <h1 class="hero-headline">Contact Us</h1>
      <p class="hero-sub">We&rsquo;d love to hear from you.</p>
    </div>
  </section>
  <section class="contact-section">
    <div class="container contact-inner">
      ${detailRows ? `<div class="contact-details">
        <h2 class="section-title">Get in Touch</h2>
        ${detailRows}
      </div>` : ''}
      <div class="contact-form-wrap">
        <h2 class="section-title">Send a Message</h2>
        <form class="contact-form" id="contact-form">
          <div class="form-group">
            <label for="cf-name">Your Name</label>
            <input type="text" id="cf-name" name="name" placeholder="Jane Smith" required />
          </div>
          <div class="form-group">
            <label for="cf-email">Email Address</label>
            <input type="email" id="cf-email" name="email" placeholder="jane@example.com" required />
          </div>
          <div class="form-group">
            <label for="cf-message">Message</label>
            <textarea id="cf-message" name="message" rows="5" placeholder="How can we help?" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">${esc(content.ctaText)}</button>
          <div class="cf-status cf-success" id="cf-success"></div>
          <div class="cf-status cf-error" id="cf-error"></div>
        </form>
      </div>
    </div>
  </section>
  <script>
    document.getElementById('contact-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const btn = this.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Sending...';
      const data = { name: this.name.value, email: this.email.value, message: this.message.value };
      try {
        const r = await fetch('${contactApiUrl}', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
        if (r.ok) {
          document.getElementById('cf-success').textContent = 'Message sent! We will be in touch shortly.';
          this.reset();
        } else {
          throw new Error('Server error');
        }
      } catch {
        document.getElementById('cf-error').textContent = 'Something went wrong. Please try again or email us directly.';
      } finally {
        btn.disabled = false;
        btn.textContent = '${esc(content.ctaText)}';
      }
    });
  </script>`);
}

// ─── PoC Site Definitions ─────────────────────────────────────────────────────
const POC_SITES = [
  {
    domain: 'mikes-plumbing-austin.com',
    customerEmail: 'mike@mikes-plumbing-austin.com',
    customerName: 'Mike Johnson',
    requirements: {
      businessType: 'Emergency Plumbing Services',
      purpose: 'Showcase 24/7 emergency plumbing services, contact form for service requests, coverage area in Austin',
      desiredDomain: 'mikes-plumbing-austin.com',
      domainPath: 'new',
      style: 'Professional navy and orange, trustworthy and industrial-grade',
      chatSummary: 'Mike runs emergency plumbing services in Austin, TX. Offers emergency repairs, drain cleaning, water heater installation, and general plumbing. Available 24/7 across Austin and surrounding areas.',
    },
    content: {
      businessName: "Mike's Plumbing",
      tagline: "Austin's #1 Emergency Plumber — 24/7",
      headline: "Fast Plumbing Help When You Need It Most",
      subheadline: "Emergency plumbing services across Austin, TX — available 24/7. We fix leaks, clogs, water heaters, and more with same-day response.",
      ctaText: "Request Service Now",
      theme: 'classic',
      features: [
        { icon: '🚨', title: '24/7 Emergency Service', description: 'We answer calls day and night — no extra charge for after-hours emergencies.' },
        { icon: '🚰', title: 'Drain Cleaning', description: 'Fast, effective drain clearing for kitchens, bathrooms, and main sewer lines.' },
        { icon: '🔥', title: 'Water Heater Experts', description: 'Installation, repair, and replacement of all water heater types.' },
        { icon: '🔧', title: 'General Plumbing', description: 'Leaks, pipe repairs, fixture installs — we handle it all.' },
        { icon: '📍', title: 'All Austin Coverage', description: 'Serving Austin, Round Rock, Cedar Park, Pflugerville, and surrounding areas.' },
        { icon: '⭐', title: 'Licensed & Insured', description: 'Fully licensed Texas plumbers with liability insurance on every job.' },
      ],
      about: "Mike's Plumbing has served the Austin area for over 12 years. Founded by Mike Johnson, a master plumber with 20+ years of experience, we built our reputation on honest pricing, fast response times, and quality workmanship. When you're dealing with a plumbing emergency, you can count on us.",
      servicesPage: {
        intro: "From emergency repairs to planned installations, here's what we handle.",
        items: [
          { icon: '🚨', title: 'Emergency Repairs', description: 'Burst pipes, major leaks, sewage backups — we respond within 60 minutes.', price: 'From $150' },
          { icon: '🚰', title: 'Drain Cleaning', description: 'Hydro-jetting and snake service for all drain types.', price: 'From $99' },
          { icon: '🔥', title: 'Water Heater Install', description: 'Traditional tank and tankless water heater installation.', price: 'From $299' },
          { icon: '🔧', title: 'Pipe Repair & Replacement', description: 'Copper, PVC, PEX — we repair and replace all pipe materials.', price: 'From $125' },
          { icon: '🚿', title: 'Fixture Installation', description: 'Faucets, toilets, sinks, showers, and more.', price: 'From $85' },
          { icon: '🔍', title: 'Camera Inspection', description: 'Video sewer line inspection to diagnose hidden issues.', price: 'From $195' },
        ],
      },
      aboutPage: {
        story: "Mike Johnson started Mike's Plumbing in 2012 after 8 years working for large plumbing corporations. He wanted to build a company that actually cared about customers — no hidden fees, no upselling, just honest work at fair prices. Today, Mike's team of 6 licensed plumbers serves the entire greater Austin area.",
        mission: "Our mission is to be Austin's most trusted plumber by showing up fast, diagnosing correctly, and fixing it right the first time.",
      },
      contactPage: {
        address: '4521 N Lamar Blvd, Austin, TX 78751',
        phone: '(512) 555-0147',
        hours: 'Mon–Sun: 24/7 Emergency Service',
      },
      primaryColor: '#1e3a8a',
      accentColor: '#f97316',
      radius: '8px',
      contactEmail: 'mike@mikes-plumbing-austin.com',
    },
  },
  {
    domain: 'glowstudiopdx.com',
    customerEmail: 'hello@glowstudiopdx.com',
    customerName: 'Sofia Reyes',
    requirements: {
      businessType: 'Upscale Hair Salon',
      purpose: 'Showcase services and portfolio, online appointment booking, luxury brand presentation',
      desiredDomain: 'glowstudiopdx.com',
      domainPath: 'new',
      style: 'Rose gold and cream, chic and feminine, luxury feel',
      chatSummary: 'Glow Studio is an upscale hair salon in Portland, Oregon. Specializes in color treatments, balayage, cuts, styling, and blowouts. Luxury experience focus.',
    },
    content: {
      businessName: 'Glow Studio',
      tagline: 'Portland\'s Premier Luxury Hair Salon',
      headline: 'Transform Your Look, Elevate Your Confidence',
      subheadline: 'Expert color treatments, precision cuts, and luxury styling in the heart of Portland, OR — where every visit is an experience.',
      ctaText: 'Book Your Appointment',
      theme: 'cinematic',
      features: [
        { icon: '✨', title: 'Balayage & Color', description: 'Custom color artistry from subtle sun-kissed highlights to bold transformations.' },
        { icon: '✂️', title: 'Precision Cuts', description: 'Tailored cuts designed to complement your face shape and lifestyle.' },
        { icon: '💇', title: 'Blowouts & Styling', description: 'Professional blowouts and styling for any occasion, from everyday to events.' },
        { icon: '🌿', title: 'Treatments & Care', description: 'Deep conditioning, keratin, and scalp treatments for healthy, luminous hair.' },
        { icon: '👑', title: 'Luxury Experience', description: 'Complimentary beverage, scalp massage, and a calming studio atmosphere.' },
        { icon: '📅', title: 'Easy Booking', description: 'Book online in minutes — flexible scheduling to fit your busy life.' },
      ],
      about: "Glow Studio was founded by Sofia Reyes, a nationally recognized colorist with 15 years of experience. Located in Portland's Pearl District, our studio blends artistry with luxury to create a truly elevated salon experience. We use only the finest professional-grade products from Oribe and Kérastase.",
      servicesPage: {
        intro: 'Every service is personalized to your unique hair goals and lifestyle.',
        items: [
          { icon: '✨', title: 'Full Balayage', description: 'Hand-painted color for a natural, sun-kissed look that grows out beautifully.', price: 'From $220' },
          { icon: '🎨', title: 'Color Correction', description: 'Expert correction of previous color mishaps, safely and beautifully.', price: 'From $300' },
          { icon: '💛', title: 'Highlights & Lowlights', description: 'Foil highlights and lowlights for dimension and depth.', price: 'From $165' },
          { icon: '✂️', title: 'Haircut & Style', description: 'Precision cut with blowout and styling consultation.', price: 'From $85' },
          { icon: '💇', title: 'Express Blowout', description: 'Professional blowout to perfection — smooth, voluminous, or beachy.', price: 'From $65' },
          { icon: '🌿', title: 'Keratin Treatment', description: 'Smooth and strengthen hair with our smoothing keratin treatment.', price: 'From $350' },
          { icon: '💆', title: 'Scalp Treatment', description: 'Nourishing scalp therapy for healthy, vibrant hair growth.', price: 'From $75' },
        ],
      },
      aboutPage: {
        story: "Sofia Reyes opened Glow Studio in 2016 after training under master colorists in New York and Paris. She returned to Portland with a vision: a neighborhood luxury salon where clients feel seen, celebrated, and transformed. Every stylist at Glow Studio is handpicked for their artistry and warmth.",
        mission: "To be the studio where Portland women come to feel their most beautiful — through expert craft, genuine care, and an atmosphere that feels like a retreat.",
      },
      contactPage: {
        address: '1234 NW Glisan St, Portland, OR 97209',
        phone: '(503) 555-0289',
        hours: 'Tue–Sat: 9am–7pm | Sun: 10am–5pm',
      },
      primaryColor: '#8E585E',
      accentColor: '#D4AF37',
      backgroundColor: '#FFF9F0',
      softBackgroundColor: '#FAF5E9',
      contactEmail: 'hello@glowstudiopdx.com',
    },
  },
  {
    domain: 'casabonitatacos.com',
    customerEmail: 'hola@casabonitatacos.com',
    customerName: 'Maria Gutierrez',
    requirements: {
      businessType: 'Family Mexican Restaurant',
      purpose: 'Show full menu, tell family story, contact page with address and hours, photo gallery',
      desiredDomain: 'casabonitatacos.com',
      domainPath: 'new',
      style: 'Warm Mexican colors: red, green, and gold. Family friendly and festive.',
      chatSummary: 'Casa Bonita Tacos is a family-owned Mexican restaurant in Denver, CO. Family-owned for 15 years, authentic Mexican food (tacos, burritos, enchiladas, guacamole). Family friendly with festive atmosphere.',
    },
    content: {
      businessName: 'Casa Bonita Tacos',
      tagline: 'Authentic Mexican Flavors Since 2009',
      headline: 'Where Family Recipes Meet Denver Nights',
      subheadline: "Family-owned for 15 years, Casa Bonita Tacos serves Denver's most authentic tacos, burritos, and enchiladas with love — just like abuela made them.",
      ctaText: 'See Our Menu',
      theme: 'cinematic',
      features: [
        { icon: '🌮', title: 'Authentic Tacos', description: 'Street-style tacos with handmade tortillas and family recipes passed down generations.' },
        { icon: '🫔', title: 'Burritos & Enchiladas', description: 'Hearty, flavor-packed classics made fresh every day.' },
        { icon: '🥑', title: 'Fresh Guacamole', description: 'Made tableside with ripe avocados, lime, cilantro, and a secret touch.' },
        { icon: '👨‍👩‍👧‍👦', title: 'Family Friendly', description: "A warm, festive space welcoming families, date nights, and everyone in between." },
        { icon: '🎉', title: 'Festive Atmosphere', description: 'Colorful decor, live music on weekends, and the energy of a true Mexican celebration.' },
        { icon: '🍹', title: 'Margaritas & More', description: "Hand-crafted margaritas, agua frescas, and a full bar menu." },
      ],
      about: "Casa Bonita Tacos has been a Denver institution since Maria and Roberto Gutierrez opened our doors in 2009. What started as a small family dream has grown into a beloved neighborhood restaurant, but our recipes — handed down from Roberto's grandmother in Oaxaca — have never changed. We cook everything fresh, every day.",
      servicesPage: {
        intro: "Our menu celebrates the rich flavors of authentic Mexican cuisine.",
        items: [
          { icon: '🌮', title: 'Street Tacos (3-pack)', description: 'Al pastor, carne asada, or chicken with onion, cilantro, and salsa verde.', price: '$12.99' },
          { icon: '🫔', title: 'Signature Burrito', description: 'Stuffed with rice, beans, your choice of meat, cheese, and house salsa.', price: '$13.99' },
          { icon: '🧀', title: 'Cheese Enchiladas', description: 'Corn tortillas, house cheese blend, topped with red or green chile.', price: '$11.99' },
          { icon: '🥑', title: 'Tableside Guacamole', description: 'Fresh avocados prepared at your table with chips.', price: '$9.99' },
          { icon: '🍹', title: 'Classic Margarita', description: 'Fresh lime juice, triple sec, and your choice of tequila, on the rocks or frozen.', price: '$10.99' },
          { icon: '🌯', title: 'Family Combo Platter', description: 'Tacos, enchiladas, rice, beans — feeds the whole family.', price: '$42.99' },
        ],
      },
      aboutPage: {
        story: "In 2009, Maria and Roberto Gutierrez bet everything on a dream — an authentic Mexican restaurant in Denver's Baker neighborhood. Roberto's grandmother Esperanza had spent 40 years perfecting the recipes in Oaxaca, and Roberto spent 5 years as a chef in Mexico City before bringing those flavors to Colorado. Today, their children work alongside them, and Esperanza's recipes are still the heart of every dish.",
        mission: "To bring the soul of authentic Mexican home cooking to Denver — one taco at a time — and to make every guest feel like family.",
      },
      contactPage: {
        address: '345 W 10th Ave, Denver, CO 80204',
        phone: '(720) 555-0312',
        hours: 'Mon–Thu: 11am–9pm | Fri–Sat: 11am–11pm | Sun: 11am–8pm',
      },
      primaryColor: '#b91c1c',
      accentColor: '#d97706',
      contactEmail: 'hola@casabonitatacos.com',
    },
  },
];

// ─── Order DB helpers ─────────────────────────────────────────────────────────
function initDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  return db;
}

function createOrderDirect(db, site) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const identifier = `EVE-POC-${site.domain.split('.')[0].toUpperCase().slice(0, 8)}`;
  const idempotencyKey = `poc-demo-${site.domain}`;

  // Check if already exists
  const existing = db.prepare('SELECT id FROM orders WHERE idempotency_key = ?').get(idempotencyKey);
  if (existing) {
    console.log(`  → Order already exists for ${site.domain}: ${existing.id}`);
    return existing.id;
  }

  const auditTrail = [
    { at: now, from: 'new', to: 'qualifying', event: 'START_QUALIFYING' },
    { at: now, from: 'qualifying', to: 'payment_pending', event: 'REQUIREMENTS_READY', note: 'PoC demo — no payment required' },
    { at: now, from: 'payment_pending', to: 'paid', event: 'PAYMENT_SUCCEEDED', note: 'PoC demo — waived payment' },
    { at: now, from: 'paid', to: 'domain_purchasing', event: 'START_DOMAIN' },
    { at: now, from: 'domain_purchasing', to: 'building', event: 'DOMAIN_PURCHASED', note: 'PoC demo — domain pre-configured' },
  ];

  // Get next sequence number
  db.prepare("UPDATE meta SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'next_seq'").run();
  const seqRow = db.prepare("SELECT CAST(value AS INTEGER) AS seq FROM meta WHERE key = 'next_seq'").get();
  const seq = seqRow.seq;

  const data = JSON.stringify({
    id,
    identifier: `EVE-${String(seq).padStart(4, '0')}`,
    customerEmail: site.customerEmail,
    customerName: site.customerName,
    state: 'building',
    idempotencyKey,
    requirements: site.requirements,
    domain: { domain: site.domain, registeredAt: now },
    auditTrail,
    createdAt: now,
    updatedAt: now,
  });

  db.prepare(`
    INSERT INTO orders (id, idempotency_key, state, seq, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, idempotencyKey, 'building', seq, data, now, now);

  console.log(`  → Created order ${identifier} (${id}) for ${site.domain}`);
  return id;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const db = initDb();

mkdirSync(OUT_DIR, { recursive: true });

for (const site of POC_SITES) {
  console.log(`\nBuilding site: ${site.domain}`);

  // Create order
  const orderId = createOrderDirect(db, site);

  // Generate HTML pages
  const siteDir = path.join(OUT_DIR, site.domain);
  mkdirSync(siteDir, { recursive: true });

  const pages = {
    'index.html': renderHome(site.content),
    'about.html': renderAbout(site.content),
    'services.html': renderServices(site.content),
    'contact.html': renderContact(site.content, site.domain),
  };

  for (const [filename, html] of Object.entries(pages)) {
    writeFileSync(path.join(siteDir, filename), html, 'utf8');
    console.log(`  ✓ ${filename} (${html.length} bytes)`);
  }

  console.log(`  ✓ Order: ${orderId}`);
}

db.close();
console.log('\n✅ All 3 PoC sites generated in scripts/poc-output/');
