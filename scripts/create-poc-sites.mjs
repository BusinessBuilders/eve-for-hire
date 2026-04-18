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
  const { primaryColor: primary, accentColor: accent, theme, radius = '12px' } = content;
  const isCinematic = theme === 'cinematic';

  if (isCinematic) {
    return `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :root {
        --primary: ${primary};
        --accent: ${accent};
        --primary-glow: color-mix(in srgb, ${primary}, transparent 60%);
        --fg: #e2e8f0;
        --fg-muted: #94a3b8;
        --bg: #0a0a10;
        --nav-bg: rgba(10, 10, 16, 0.85);
        --surface: #0f0f1a;
        --border: rgba(255, 255, 255, 0.08);
        --glass: rgba(255, 255, 255, 0.03);
        --radius: 16px;
        --font: 'Outfit', system-ui, sans-serif;
        --font-heading: 'Bebas Neue', system-ui, sans-serif;
        --shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.4);
        --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      html { scroll-behavior: smooth; }
      body { font-family: var(--font); color: var(--fg); background: var(--bg); line-height: 1.6; }
      
      .reveal-anim { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease, transform 0.8s ease; }
      .reveal-anim.visible { opacity: 1; transform: translateY(0); }

      .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

      /* ── Header ── */
      .header { position: sticky; top: 0; background: var(--nav-bg); backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border); z-index: 100; }
      .nav { display: flex; align-items: center; gap: 1rem; height: 72px; }
      .logo { font-family: var(--font-heading); font-size: 1.5rem; color: #fff; letter-spacing: 0.02em;
        text-decoration: none; flex-shrink: 0; display: flex; align-items: center; gap: 10px; }
      .logo::before { content: ""; display: block; width: 32px; height: 32px; background: var(--primary); border-radius: 6px; box-shadow: 0 0 15px var(--primary-glow); }
      .nav-links { display: flex; gap: 0.5rem; flex: 1; }
      .nav-link { padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none;
        font-size: 0.95rem; color: var(--fg-muted); transition: all 0.2s ease; }
      .nav-link:hover, .nav-active { color: #fff; background: var(--glass); }
      .nav-cta { margin-left: auto; flex-shrink: 0; }

      /* ── Buttons ── */
      .btn { display: inline-flex; align-items: center; justify-content: center; padding: 12px 28px;
        border-radius: 10px; font-weight: 600; font-size: 1rem; text-decoration: none;
        transition: var(--transition); cursor: pointer; border: none; }
      .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
      .btn-primary { 
        background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%); 
        color: #fff;
        box-shadow: 0 0 20px var(--primary-glow);
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
      .glow-text { text-shadow: 0 0 20px var(--primary-glow); }
      .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; }
      .feature-card, .glass-card { 
        background: var(--glass); border-radius: var(--radius); padding: 40px 32px;
        backdrop-filter: blur(12px); border: 1px solid var(--border);
        transition: var(--transition);
      }
      .feature-card:hover, .glass-card:hover { border-color: var(--primary); transform: translateY(-8px); box-shadow: var(--shadow-xl); }
      .feature-icon { font-size: 2.5rem; margin-bottom: 20px; }
      .feature-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; color: #fff; }
      .feature-desc { color: var(--fg-muted); font-size: 1rem; }
      .service-price { margin-top: 16px; font-weight: 600; color: var(--primary); font-size: 1.1rem; font-family: var(--font-heading); }

      /* ── How It Works ── */
      .steps { padding: 100px 0; position: relative; }
      .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 48px; position: relative; }
      .step-item { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; position: relative; z-index: 2; }
      .step-number { width: 48px; height: 48px; border-radius: 50%; background: var(--primary); color: #fff;
        display: flex; align-items: center; justify-content: center; font-family: var(--font-heading);
        font-size: 1.5rem; box-shadow: 0 0 20px var(--primary-glow); margin-bottom: 8px; }
      .step-title { font-size: 1.25rem; font-weight: 700; color: #fff; }
      .step-desc { color: var(--fg-muted); font-size: 0.95rem; font-weight: 300; }
      
      @media (min-width: 900px) {
        .step-item:not(:last-child)::after {
          content: ""; position: absolute; top: 24px; left: calc(50% + 40px); width: calc(100% - 80px);
          height: 2px; background: linear-gradient(90deg, var(--primary), transparent); opacity: 0.3;
        }
      }

      /* ── About ── */
      .about { padding: 100px 0; }
      .about-inner { display: flex; align-items: center; gap: 80px; }
      .about-content { flex: 1; display: flex; flex-direction: column; gap: 24px; }
      .about-content .section-title { text-align: left; margin-bottom: 0; }
      .about-text { color: var(--fg-muted); font-size: 1.1rem; font-weight: 300; }
      .about-visual { flex: 1; min-height: 300px; display: flex; align-items: center; justify-content: center; position: relative; }
      .premium-illustration { width: 100%; max-width: 400px; height: auto; filter: drop-shadow(0 0 30px var(--primary-glow)); }

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
      
      .map-placeholder { width: 100%; height: 250px; background: var(--surface); border-radius: 12px; margin-top: 24px;
        border: 1px solid var(--border); position: relative; overflow: hidden; }
      .map-grid { position: absolute; inset: 0; background-image: radial-gradient(var(--border) 1px, transparent 1px); background-size: 20px 20px; }
      .map-pin { position: absolute; top: 40%; left: 60%; width: 24px; height: 24px; background: var(--primary); border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg); box-shadow: 0 0 20px var(--primary-glow); }
      .map-pin::after { content: ""; position: absolute; inset: 6px; background: #fff; border-radius: 50%; }
      .map-pin-pulse { position: absolute; top: 40%; left: 60%; width: 24px; height: 24px; transform: translate(-12px, -12px);
        border: 2px solid var(--primary); border-radius: 50%; animation: ping 2s infinite; }
      @keyframes ping { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(3); opacity: 0; } }

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

      /* ── Trust Badges ── */
      .trust-row { display: flex; justify-content: center; gap: 32px; flex-wrap: wrap; margin-top: 48px; }
      .trust-badge { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--fg-muted); 
        background: var(--glass); padding: 8px 16px; border-radius: 50px; border: 1px solid var(--border); }

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

  // Classic Theme
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
    
    .reveal-anim { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease, transform 0.8s ease; }
    .reveal-anim.visible { opacity: 1; transform: translateY(0); }

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
    .btn-primary { background: var(--primary); color: #fff; }
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
    
    .steps { padding: 100px 0; background: var(--bg); }
    .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 48px; }
    .step-item { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; }
    .step-number { width: 48px; height: 48px; border-radius: 50%; background: var(--primary); color: #fff;
      display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.25rem; }
    
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
    .cta-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 24px; }
    .cta-inner h2 { font-size: 2.5rem; font-weight: 800; letter-spacing: -0.03em; }
    
    .contact-section { padding: 100px 0; }
    .contact-inner { display: grid; grid-template-columns: 1fr 1.5fr; gap: 80px; align-items: start; }
    .contact-details { display: flex; flex-direction: column; gap: 24px; }
    .contact-detail { display: flex; align-items: flex-start; gap: 16px; font-size: 1.05rem; }
    .contact-icon { font-size: 1.5rem; flex-shrink: 0; line-height: 1; }
    .contact-form-wrap { background: var(--bg-soft); padding: 48px; border-radius: var(--radius); }
    .contact-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 0.9rem; font-weight: 600; color: var(--fg); }
    .form-group input, .form-group textarea {
      padding: 12px 16px; border-radius: 8px; border: 2px solid #e2e8f0;
      font-family: var(--font-body); font-size: 1rem; background: var(--bg); resize: vertical; }
    
    .cf-status { font-size: 0.9rem; border-radius: 8px; padding: 10px 14px; display: none; }
    .footer { background: #0f172a; color: #94a3b8; padding: 64px 0 40px; }
    .footer-inner { display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center; }
    .footer-nav { display: flex; gap: 2rem; margin-bottom: 8px; flex-wrap: wrap; justify-content: center; }
    .footer-nav a { color: #94a3b8; text-decoration: none; font-size: 0.95rem; transition: color 0.2s; }
    .footer-nav a:hover { color: #fff; }
    
    .trust-row { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin-top: 32px; }
    .trust-badge { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: rgba(255,255,255,0.8); 
      background: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 50px; }

    @media (max-width: 900px) {
      .contact-inner { grid-template-columns: 1fr; gap: 60px; }
      .about-inner { flex-direction: column; gap: 48px; text-align: center; }
      .about-content .section-title { text-align: center; }
      .about-visual { order: -1; }
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
    : '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800&display=swap" rel="stylesheet">';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${esc(content.subheadline)}" />
  <title>${esc(content.businessName)} | ${esc(content.tagline)}</title>
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
      <a href="${mailtoHref}" class="btn btn-primary nav-cta">Get Started</a>
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
    </div>
  </footer>
  <script>
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-anim').forEach(el => observer.observe(el));
  </script>
</body>
</html>`;
}

function renderHome(content) {
  const isCinematic = content.theme === 'cinematic';
  const trustBadgesHtml = content.trustBadges?.length
    ? `<div class="trust-row">
        ${content.trustBadges.map(b => `<div class="trust-badge"><span>${b.icon}</span> <span>${esc(b.label)}</span></div>`).join('\n        ')}
      </div>`
    : '';

  const howItWorksHtml = content.howItWorks?.length
    ? `<section class="steps reveal-anim" id="how-it-works">
    <div class="container">
      <h2 class="section-title">How It Works</h2>
      <div class="steps-grid">
        ${content.howItWorks.map((s, i) => `<div class="step-item">
          <div class="step-number">${i + 1}</div>
          <h3 class="step-title">${esc(s.title)}</h3>
          <p class="step-desc">${esc(s.description)}</p>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>`
    : '';

  const pricingHtml = content.pricing?.length
    ? `<section class="features reveal-anim" id="pricing" style="background: var(--bg);">
    <div class="container">
      <h2 class="section-title">Simple Pricing</h2>
      <div class="feature-grid">
        ${content.pricing.map(p => `<div class="feature-card ${p.isFeatured ? 'glass-card' : ''}" style="${p.isFeatured ? 'border-color: var(--primary);' : ''}">
          <h3 class="feature-title">${esc(p.tier)}</h3>
          <p class="service-price">${esc(p.price)}${p.unit ? `<span>${esc(p.unit)}</span>` : ''}</p>
          <ul style="list-style: none; margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; text-align: left; flex-grow: 1;">
            ${p.features.map(f => `<li style="font-size: 0.95rem; color: var(--fg-muted);"><span style="color: var(--primary); margin-right: 8px;">✓</span> ${esc(f)}</li>`).join('')}
          </ul>
          <a href="contact.html" class="btn ${p.isFeatured ? 'btn-primary' : 'btn-outline'}" style="margin-top: 2rem;">${esc(p.cta || content.ctaText)}</a>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>`
    : '';

  const faqHtml = content.faq?.length
    ? `<section class="about reveal-anim" id="faq" style="background: var(--bg-soft);">
    <div class="container" style="max-width: 800px;">
      <h2 class="section-title">Frequently Asked Questions</h2>
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        ${content.faq.map(f => `<div class="feature-card" style="padding: 2rem; text-align: left;">
          <h3 style="font-size: 1.1rem; margin-bottom: 0.75rem; color: var(--fg);">${esc(f.question)}</h3>
          <p style="color: var(--fg-muted); font-size: 1rem;">${esc(f.answer)}</p>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>`
    : '';

  const aboutIllustration = isCinematic
    ? `<svg class="premium-illustration" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="200" r="150" stroke="url(#p0)" stroke-width="2" stroke-dasharray="10 10"/>
        <rect x="150" y="150" width="100" height="100" rx="20" fill="url(#p0)" fill-opacity="0.2" stroke="url(#p0)" stroke-width="2"/>
        <defs><linearGradient id="p0" x1="50" y1="50" x2="350" y2="350"><stop stop-color="var(--primary)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs>
      </svg>`
    : `<div class="about-blob">${esc(content.businessName.slice(0, 1))}</div>`;

  return page(content, 'index.html', `
  <section class="hero reveal-anim">
    <div class="container hero-inner">
      <p class="tagline">${esc(content.tagline)}</p>
      <h1 class="hero-headline">${esc(content.headline)}</h1>
      <p class="hero-sub">${esc(content.subheadline)}</p>
      <div style="display:flex; gap:16px; justify-content:center;">
        <a href="contact.html" class="btn btn-primary">${esc(content.ctaText)}</a>
        <a href="#features" class="btn btn-outline">Explore Services</a>
      </div>
      ${trustBadgesHtml}
    </div>
  </section>
  <section class="features reveal-anim" id="features">
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
  ${howItWorksHtml}
  ${pricingHtml}
  <section class="about reveal-anim" id="about">
    <div class="container about-inner">
      <div class="about-content">
        <h2 class="section-title">About Us</h2>
        <p class="about-text">${esc(content.about)}</p>
        <a href="about.html" class="btn btn-primary">Our Story &rarr;</a>
      </div>
      <div class="about-visual" aria-hidden="true">${aboutIllustration}</div>
    </div>
  </section>
  ${faqHtml}
  <section class="cta-banner reveal-anim">
    <div class="container cta-inner">
      <h2>Ready to get started?</h2>
      <a href="contact.html" class="btn btn-white">${esc(content.ctaText)}</a>
    </div>
  </section>`);
}

function renderAbout(content) {
  const story = content.aboutPage?.story ?? content.about;
  const mission = content.aboutPage?.mission ?? `${esc(content.businessName)} is dedicated to delivering excellent results for every client.`;
  return page(content, 'about.html', `
  <section class="hero hero-sm reveal-anim">
    <div class="container hero-inner">
      <h1 class="hero-headline">About Us</h1>
    </div>
  </section>
  <section class="about reveal-anim" id="story">
    <div class="container about-inner">
      <div class="about-content">
        <h2 class="section-title">Our Story</h2>
        <p class="about-text">${esc(story)}</p>
        <h2 class="section-title" style="margin-top:2rem">Our Mission</h2>
        <p class="about-text">${esc(mission)}</p>
      </div>
    </div>
  </section>`);
}

function renderServices(content) {
  const items = content.servicesPage?.items ?? content.features.map(f => ({ ...f }));
  return page(content, 'services.html', `
  <section class="hero hero-sm reveal-anim">
    <div class="container hero-inner">
      <h1 class="hero-headline">Our Services</h1>
    </div>
  </section>
  <section class="features reveal-anim" id="services">
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
  </section>`);
}

function renderContact(content, domain) {
  const cp = content.contactPage ?? {};
  const isCinematic = content.theme === 'cinematic';
  const detailRows = [
    cp.address ? `<div class="contact-detail"><span>📍</span><span>${esc(cp.address)}</span></div>` : '',
    cp.phone ? `<div class="contact-detail"><span>📞</span><a href="tel:${esc(cp.phone)}">${esc(cp.phone)}</a></div>` : '',
    content.contactEmail ? `<div class="contact-detail"><span>✉️</span><a href="mailto:${esc(content.contactEmail)}">${esc(content.contactEmail)}</a></div>` : '',
  ].filter(Boolean).join('\n');

  const mapHtml = isCinematic ? `<div class="map-placeholder reveal-anim"><div class="map-grid"></div><div class="map-pin-pulse"></div><div class="map-pin"></div></div>` : '';

  return page(content, 'contact.html', `
  <section class="hero hero-sm reveal-anim">
    <div class="container hero-inner">
      <h1 class="hero-headline">Contact Us</h1>
    </div>
  </section>
  <section class="contact-section reveal-anim">
    <div class="container contact-inner">
      <div class="contact-details">
        <h2 class="section-title">Get in Touch</h2>
        ${detailRows}
        ${mapHtml}
      </div>
      <div class="contact-form-wrap">
        <h2 class="section-title">Send a Message</h2>
        <form class="contact-form" id="contact-form">
          <div class="form-group"><label>Your Name</label><input type="text" name="name" required /></div>
          <div class="form-group"><label>Email Address</label><input type="email" name="email" required /></div>
          <div class="form-group"><label>Message</label><textarea name="message" rows="5" required></textarea></div>
          <button type="submit" class="btn btn-primary">${esc(content.ctaText)}</button>
          <div class="cf-status" id="cf-status"></div>
        </form>
      </div>
    </div>
  </section>`);
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
      chatSummary: 'Mike runs emergency plumbing services in Austin, TX.',
    },
    content: {
      businessName: "Mike's Plumbing",
      tagline: "Austin's #1 Emergency Plumber — 24/7",
      headline: "Fast Plumbing Help When You Need It Most",
      subheadline: "Emergency plumbing services across Austin, TX — available 24/7.",
      ctaText: "Request Service Now",
      theme: 'classic',
      features: [
        { icon: '🚨', title: '24/7 Emergency Service', description: 'We answer calls day and night.' },
        { icon: '🚰', title: 'Drain Cleaning', description: 'Fast, effective drain clearing.' },
        { icon: '⭐', title: 'Licensed & Insured', description: 'Fully licensed Texas plumbers.' },
      ],
      howItWorks: [
        { title: 'Request Service', description: 'Fill out our fast online form or call us directly.' },
        { title: 'Fast Dispatch', description: 'Our nearest licensed plumber is sent to your location immediately.' },
        { title: 'Problem Solved', description: 'Expert diagnosis and repair done right the first time.' },
      ],
      pricing: [
        { tier: "Emergency Fix", price: "$89", unit: " + parts", features: ["24/7 Availability", "Priority Dispatch", "Licensed Plumber"], isFeatured: true },
        { tier: "Maintenance", price: "$149", unit: " / visit", features: ["Full System Check", "Drain Cleaning", "Preventative Care"] }
      ],
      faq: [
        { question: "Do you offer 24/7 emergency services?", answer: "Yes! We have plumbers on standby around the clock in Austin." },
        { question: "Are you licensed and insured?", answer: "Absolutely. All our technicians are fully licensed Texas plumbers." }
      ],
      trustBadges: [
        { icon: '⭐', label: '5-Star Rated' },
        { icon: '🛡️', label: 'Licensed & Insured' },
      ],
      about: "Mike's Plumbing has served the Austin area for over 12 years.",
      primaryColor: '#1e3a8a',
      accentColor: '#f97316',
      contactEmail: 'mike@mikes-plumbing-austin.com',
    },
  },
  {
    domain: 'glowstudiopdx.com',
    customerEmail: 'hello@glowstudiopdx.com',
    customerName: 'Sofia Reyes',
    requirements: {
      businessType: 'Upscale Hair Salon',
      purpose: 'Showcase services and portfolio',
      desiredDomain: 'glowstudiopdx.com',
      domainPath: 'new',
      style: 'Rose gold and cream, luxury feel',
      chatSummary: 'Glow Studio is an upscale hair salon in Portland, Oregon.',
    },
    content: {
      businessName: 'Glow Studio',
      tagline: 'Portland\'s Premier Luxury Hair Salon',
      headline: 'Transform Your Look, Elevate Your Confidence',
      subheadline: 'Expert color treatments and luxury styling in Portland.',
      ctaText: 'Book Your Appointment',
      theme: 'cinematic',
      features: [
        { icon: '✨', title: 'Balayage & Color', description: 'Custom color artistry.' },
        { icon: '✂️', title: 'Precision Cuts', description: 'Tailored cuts.' },
        { icon: '👑', title: 'Luxury Experience', description: 'Calming studio atmosphere.' },
      ],
      howItWorks: [
        { title: 'Consultation', description: 'Discuss your hair goals with our master stylists.' },
        { title: 'Luxury Treatment', description: 'Relax while we transform your look with premium products.' },
        { title: 'Elevated Confidence', description: 'Walk out feeling beautiful and empowered.' },
      ],
      pricing: [
        { tier: "Signature Cut", price: "$120", unit: " + styling", features: ["Master Stylist", "Deep Conditioning", "Scalp Massage"], isFeatured: true },
        { tier: "Balayage Luxe", price: "$350", unit: " / starting", features: ["Custom Color Artistry", "Tonal Gloss", "Luxury Finish"] }
      ],
      faq: [
        { question: "Which products do you use?", answer: "We exclusively use Oribe and Oway organic luxury hair care." },
        { question: "How long does a color appointment take?", answer: "Typically 3-4 hours depending on the complexity of your transformation." }
      ],
      trustBadges: [
        { icon: '✨', label: 'Luxury Experience' },
        { icon: '💎', label: 'Premium Products' },
      ],
      about: "Glow Studio was founded by Sofia Reyes, a nationally recognized colorist.",
      primaryColor: '#8E585E',
      accentColor: '#D4AF37',
      contactEmail: 'hello@glowstudiopdx.com',
    },
  },
  {
    domain: 'casabonitatacos.com',
    customerEmail: 'hola@casabonitatacos.com',
    customerName: 'Maria Gutierrez',
    requirements: {
      businessType: 'Family Mexican Restaurant',
      purpose: 'Show full menu',
      desiredDomain: 'casabonitatacos.com',
      domainPath: 'new',
      style: 'Warm Mexican colors',
      chatSummary: 'Casa Bonita Tacos is a family-owned Mexican restaurant in Denver, CO.',
    },
    content: {
      businessName: 'Casa Bonita Tacos',
      tagline: 'Authentic Mexican Flavors Since 2009',
      headline: 'Where Family Recipes Meet Denver Nights',
      subheadline: "Serving Denver's most authentic tacos and burritos.",
      ctaText: 'See Our Menu',
      theme: 'cinematic',
      features: [
        { icon: '🌮', title: 'Authentic Tacos', description: 'Street-style tacos.' },
        { icon: '🥑', title: 'Fresh Guacamole', description: 'Made tableside.' },
        { icon: '🎉', title: 'Festive Atmosphere', description: 'Colorful decor.' },
      ],
      howItWorks: [
        { title: 'Pick Your Favorites', description: 'Browse our menu of authentic Oaxacan family recipes.' },
        { title: 'Fresh Preparation', description: 'Our chefs cook your meal fresh to order with love.' },
        { title: 'Enjoy Like Family', description: 'Experience the warm festive atmosphere of our dining room.' },
      ],
      pricing: [
        { tier: "Taco Platter", price: "$14.99", unit: " / platter", features: ["3 Signature Tacos", "Handmade Tortillas", "Rice & Beans"], isFeatured: true },
        { tier: "Family Feast", price: "$55", unit: " (Serves 4)", features: ["12 Tacos", "Large Guacamole", "Churros for Dessert"] }
      ],
      faq: [
        { question: "Do you have vegetarian options?", answer: "Yes! Our Hibiscus Tacos and Rajas con Crema are local favorites." },
        { question: "Can I book a table online?", answer: "We are currently walk-in only to keep things festive and fair for everyone!" }
      ],
      trustBadges: [
        { icon: '🌮', label: 'Authentic Recipes' },
        { icon: '👨‍👩‍👧‍👦', label: 'Family Owned' },
      ],
      about: "Casa Bonita Tacos has been a Denver institution since 2009.",
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
  const idempotencyKey = `poc-demo-${site.domain}`;
  const existing = db.prepare('SELECT id FROM orders WHERE idempotency_key = ?').get(idempotencyKey);
  if (existing) return existing.id;

  const now = new Date().toISOString();
  db.prepare("UPDATE meta SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'next_seq'").run();
  const seqRow = db.prepare("SELECT CAST(value AS INTEGER) AS seq FROM meta WHERE key = 'next_seq'").get();
  const seq = seqRow.seq;

  const id = randomUUID();
  const data = JSON.stringify({
    id, identifier: `EVE-${String(seq).padStart(4, '0')}`,
    customerEmail: site.customerEmail, customerName: site.customerName,
    state: 'building', idempotencyKey,
    requirements: site.requirements, domain: { domain: site.domain, registeredAt: now },
    auditTrail: [], createdAt: now, updatedAt: now,
  });

  db.prepare('INSERT INTO orders (id, idempotency_key, state, seq, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, idempotencyKey, 'building', seq, data, now, now);
  return id;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const db = initDb();
mkdirSync(OUT_DIR, { recursive: true });

for (const site of POC_SITES) {
  console.log(`Building: ${site.domain}`);
  createOrderDirect(db, site);
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
  }
}
db.close();
console.log('\n✅ All 3 PoC sites regenerated in scripts/poc-output/');
