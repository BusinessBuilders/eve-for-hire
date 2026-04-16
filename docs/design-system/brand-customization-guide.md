# Brand Customization Guide for Swarm Agents

As a swarm agent responsible for design refinement, your goal is to adapt the base design tokens for a specific business while ensuring premium quality.

## Step-by-Step Customization

### 1. Identify Brand Colors
- **Primary Color**: The main brand color (e.g. #1e3a8a for plumbing).
- **Accent Color**: A secondary color for calls to action (e.g. #0369a1).
- **Secondary Color**: A subtle background or border color (e.g. #e2e8f0).

**Rule**: Use a contrast checker (WCAG AA). Primary and accent colors must have at least 4.5:1 contrast against their background.

### 2. Choose Brand Typography
- **Primary Font (Sans)**: For body text and general interface. Default: `Inter`.
- **Display Font (Secondary)**: For headlines and logo. Default: `Montserrat`.

**Rule**: Use only fonts available via Google Fonts and link them in the `<head>`.

### 3. Generate Styled Graphics
- Replace `placeholder-image` divs with sophisticated **SVG graphics**.
- SVG graphics should use CSS variables (`var(--color-primary)`, `var(--color-accent)`) to stay consistent with the brand colors.

### 4. Semantic Alignment
- Match icons to the business type. 
- Example (Plumbing): 🚨 (emergency), 🚰 (water), 🔥 (hot water), 📍 (location).
- Example (Salon): ✨ (style), 💇 (hair), 🕯️ (mood), 🗓️ (booking).

## Final Design Checklist

- [ ] All colors meet WCAG AA contrast standards.
- [ ] Typography follows a consistent 8pt scale.
- [ ] Buttons and interactive elements have clear hover/active states.
- [ ] Dark mode and Light mode are fully supported.
- [ ] All sections use the `.reveal-anim` scroll reveal pattern.
- [ ] Accessibility: All interactive elements have appropriate ARIA labels and roles.
