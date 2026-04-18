# Spec: Website Build Swarm (v1.6)

**Date:** 2026-04-18  
**Status:** Active

## Overview

The Website Build Swarm is an agentic construction pipeline that automates the creation of high-converting business websites. Version 1.6 introduces persona-based design automation and refined contact form integration.

## Swarm Workflow

1.  **Preparation**: Lead agent (Eve) gathers requirements and qualifies the order.
2.  **Content Generation (Content Agent)**: Generates full-site copy (Home, About, Services, Contact) in `SiteContent` format.
3.  **Design Selection (Design Agent)**: 
    - Analyzes business type and requirements.
    - Selects a persona from `docs/design-system/persona-templates.json`.
    - Applies persona-based tokens (colors, theme, fonts) to the `SiteContent`.
4.  **Construction (Deploy Agent)**: 
    - Renders HTML using `lib/site/template.ts`.
    - Integrates the contact form with the `/api/contact/[domain]` endpoint.
    - Deploys static assets to the target VPS via SSH.
5.  **Quality Assurance (QA Agent)**: 
    - Verifies DNS and SSL.
    - Runs HTTP smoke tests.
    - Confirms form submissions are correctly routed.

## Design Persona System

The system supports automated styling via predefined personas:
- **Trustworthy Pro**: Professional, reliable, blue-based.
- **Modern Creative**: Vibrant, elegant, cinematic.
- **Boutique Premium**: High-end, dark, sophisticated.
- **High-Energy Startup**: Bold, bright, fast-paced.

## API Integration

### Contact Form
Generated sites POST to `https://eve.center/api/contact/[domain]`.
Required fields:
- `name`: string
- `email`: string
- `message`: string

The backend forwards these messages to the customer's registered email address.
