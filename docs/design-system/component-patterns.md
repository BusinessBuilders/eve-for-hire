# Swarm Component Patterns Library (v1.4)

This document contains standardized CSS and HTML patterns for the Website Build Swarm. Follow these patterns to ensure premium quality and consistency.

## 1. Hero Section (Cinematic)

The hero section utilizes radial glows and cinematic typography for a high-end feel.

```html
<section class="hero reveal-anim">
    <div class="container hero-inner">
        <p class="tagline">{tagline}</p>
        <h1 class="hero-headline">{headline}</h1>
        <p class="hero-sub">{subheadline}</p>
        <a href="contact.html" class="btn btn-primary">{ctaText}</a>
    </div>
</section>
```

## 2. Feature & Pricing Cards

Use glassmorphism and deep shadows for featured items.

```html
<div class="feature-card glass reveal-anim">
    <div class="feature-icon">{icon}</div>
    <h3 class="feature-title">{title}</h3>
    <p class="feature-desc">{description}</p>
</div>

<!-- Pricing Tier -->
<div class="feature-card glass featured-tier">
    <h3 class="feature-title">{tierName}</h3>
    <p class="service-price">{price}</p>
    <ul class="tier-features">
        <li>✓ {feature}</li>
    </ul>
    <a href="contact.html" class="btn btn-primary">Get Started</a>
</div>
```

## 3. FAQ Accordion (v1.4)

Modular FAQ items with cinematic glass backgrounds.

```html
<section class="faq section-padding">
    <div class="container max-width-800">
        <h2 class="section-title">Common Questions</h2>
        <div class="faq-list">
            <div class="glass faq-item">
                <h3>{question}</h3>
                <p>{answer}</p>
            </div>
        </div>
    </div>
</section>
```

## 4. About Visual (Premium)

A stylized SVG graphic with brand gradients.

```html
<div class="about-visual about-visual-v13" aria-hidden="true">
    <svg viewBox="0 0 400 400" fill="none" class="premium-svg">
        <defs>
            <linearGradient id="grad-about" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="var(--primary)" />
                <stop offset="100%" stop-color="var(--accent)" />
            </linearGradient>
        </defs>
        <rect x="80" y="80" width="240" height="240" rx="32" fill="url(#grad-about)" />
        <!-- Icon components here -->
    </svg>
</div>
```

## Animation Guidelines

- **Scroll Reveal**: Apply `.reveal-anim` and use GSAP/CSS to trigger visibility.
- **Cinematic Glow**: Use `var(--primary-glow)` for hero backgrounds.
- **Hover Transitions**: Always use `cubic-bezier(0.4, 0, 0.2, 1)` for button and card hover effects.
