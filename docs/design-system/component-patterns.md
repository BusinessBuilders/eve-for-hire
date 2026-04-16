# Swarm Component Patterns Library

This document contains standardized CSS and HTML patterns for the Website Build Swarm. Follow these patterns to ensure premium quality and consistency.

## 1. Hero Section

The hero section should be impactful and clear.

```html
<section class="hero-section reveal-anim">
    <div class="container">
        <p class="hero-tagline">{tagline}</p>
        <h1 class="glow-text">{headline}</h1>
        <p class="hero-subheadline">{subheadline}</p>
        <div class="flex-center">
            <button class="btn btn-primary">{ctaText}</button>
            <a href="#services" class="btn btn-secondary">Learn More</a>
        </div>
    </div>
</section>
```

## 2. Feature Cards (Grid 3)

Use glassmorphism for a modern feel.

```html
<div class="glass-card reveal-anim">
    <div class="glass-card-header">
        <span class="feature-icon">{icon}</span>
        <h3>{title}</h3>
    </div>
    <p class="text-muted">{description}</p>
</div>
```

## 3. About Section

Combine text with a stylized graphic or image.

```html
<section id="about" class="section surface-alt">
    <div class="container about-grid">
        <div class="reveal-anim">
            <h2 class="text-accent">{aboutTitle}</h2>
            <p class="about-description">{aboutText}</p>
            <div class="stats-grid">
                <!-- Stat Item -->
                <div>
                    <div class="stat-value">{statValue}</div>
                    <div class="stat-label">{statLabel}</div>
                </div>
            </div>
        </div>
        <div class="placeholder-image reveal-anim">
            <!-- SVG Graphic Here -->
        </div>
    </div>
</section>
```

## 4. Testimonials

Trust-building is critical for local businesses.

```html
<div class="glass-card testimonial-card reveal-anim">
    <div class="glass-card-header flex-between">
        <div>
            <h3>{name}</h3>
            <p class="text-xs">{location}</p>
        </div>
        <div class="rating-stars">★★★★★</div>
    </div>
    <p class="testimonial-body italic">"{comment}"</p>
    <div class="testimonial-date">{date}</div>
</div>
```

## 5. Contact / Service Request Modal

Ensure the modal is accessible (ARIA).

```html
<div id="request-modal" class="modal-overlay" role="dialog" aria-modal="true">
    <div class="modal-container">
        <div class="modal-header">
            <h2>{modalTitle}</h2>
            <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
            <form>
                <!-- Form Groups -->
            </form>
        </div>
    </div>
</div>
```

## Animation Guidelines

- **Scroll Reveal**: Apply `.reveal-anim` and use `interactivity.js` to trigger visibility.
- **Stagger**: Add incremental `animation-delay` to children in a grid.
- **Hover Transitions**: Always use `var(--transition-smooth)` for button and card hover effects.
