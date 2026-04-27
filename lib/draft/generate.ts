import { randomBytes } from 'crypto';

function generateToken(length = 32): string {
  const bytes = randomBytes(length);
  return bytes.toString('base64url').slice(0, length);
}

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: '🍽️',
  bakery: '🧁',
  fitness: '💪',
  salon: '💇',
  contractor: '🔧',
  'law firm': '⚖️',
  medical: '🏥',
  'real estate': '🏠',
  photography: '📸',
  tutoring: '📚',
  shop: '🛍️',
  cleaning: '✨',
  landscaping: '🌿',
  catering: '🎉',
  'auto repair': '🚗',
  'pet care': '🐾',
  consulting: '💼',
  accounting: '📊',
  moving: '📦',
  painting: '🎨',
};

interface HeroParams {
  businessName: string;
  tagline?: string;
  category?: string;
  primaryColor?: string;
}

export function generateHeroSection(params: HeroParams): { html: string; token: string } {
  const token = generateToken();
  const color = params.primaryColor ?? '#4F46E5';
  const icon = params.category ? CATEGORY_ICONS[params.category.toLowerCase()] ?? '' : '';

  // Darken the primary color for the gradient end
  const gradientEnd = color;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(params.businessName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: linear-gradient(135deg, ${color} 0%, ${gradientEnd}88 100%);
    color: #fff;
    padding: 2rem;
  }
  .icon { font-size: 3rem; margin-bottom: 1rem; }
  h1 { font-size: clamp(2rem, 5vw, 4rem); font-weight: 800; margin-bottom: 0.5rem; }
  .tagline { font-size: clamp(1rem, 2.5vw, 1.5rem); opacity: 0.9; max-width: 600px; }
  .cta-btn {
    margin-top: 2rem;
    padding: 0.875rem 2rem;
    background: #fff;
    color: ${color};
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
</style>
</head>
<body>
<section class="hero">
  ${icon ? `<div class="icon">${icon}</div>` : ''}
  <h1>${escapeHtml(params.businessName)}</h1>
  ${params.tagline ? `<p class="tagline">${escapeHtml(params.tagline)}</p>` : ''}
  <a href="#" class="cta-btn">Get Started</a>
</section>
</body>
</html>`;

  return { html, token };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
