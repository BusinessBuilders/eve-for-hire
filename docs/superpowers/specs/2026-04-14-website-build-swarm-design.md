# Spec: Website Build Swarm Skill (BUS-145)

**Date:** 2026-04-14  
**Author:** CTO Agent  
**Status:** Draft

## Overview

The `website-build-swarm` skill transforms the current linear, hardcoded website build pipeline into an agentic "swarm" process. Instead of a single script execution, Eve (the lead agent) orchestrates a team of specialized sub-agents to generate content, refine design, execute deployment, and perform quality assurance.

This approach increases flexibility, allows for better error recovery, and enables future expansion (e.g., more complex designs, AI-generated images, custom SEO).

## Swarm Architecture

The swarm consists of an Orchestrator (Eve) and four specialized roles:

### 1. Orchestrator (Eve)
- **Trigger**: New paid order detected (state = `paid`).
- **Responsibility**: 
    - Analyzes order requirements.
    - Delegates sub-tasks to the swarm.
    - Collects outputs and manages transitions.
    - Handles exceptions and retries.

### 2. Content Agent
- **Input**: Order requirements (business type, purpose, chat summary).
- **Responsibility**: Generates high-quality, conversion-focused copy for all 4 pages (Home, About, Services, Contact).
- **Output**: Structured `SiteContent` JSON.

### 3. Design Agent
- **Input**: `SiteContent` + style preferences.
- **Responsibility**: 
    - Selects primary and accent colors.
    - Refines tagline and headlines for visual impact.
    - (Future) Suggests image prompts for AI image generation.
- **Output**: Updated `SiteContent` with design metadata.

### 4. Deploy Agent
- **Input**: Finalized `SiteContent` + domain.
- **Responsibility**: 
    - Renders HTML pages using `lib/site/template.ts`.
    - Connects to VPS via SSH.
    - Uploads files and reloads Caddy.
- **Output**: Build/Deploy logs and site URL.

### 5. QA Agent
- **Input**: Site URL + domain.
- **Responsibility**: 
    - Verifies DNS propagation.
    - Runs HTTP smoke tests.
    - Checks for common visual or functional issues (e.g., broken links, missing content).
- **Output**: QA Report (Pass/Fail).

---

## Technical Implementation

### 1. Skill Definition (`skills/website-build-swarm/SKILL.md`)
Defines the workflow and how to trigger each agent.

### 2. Agent Roles (`skills/website-build-swarm/references/agents.md`)
Contains the specific system prompts and responsibilities for each sub-agent.

### 3. Tooling
The existing `lib/site/` services will be exposed as tools that the agents can call:
- `generate-content`: Wrapper for `lib/site/content-generator.ts`.
- `deploy-site`: Wrapper for `lib/site/build-service.ts` (Phase 2: SSH logic).
- `verify-site`: Wrapper for `lib/site/verify.ts`.

### 4. Workflow State
The `orders.db` SQLite database remains the source of truth for order state. The swarm updates the `audit_trail` and `state` as it progresses.

---

## Execution Plan

1. **Research & Design**: (This document).
2. **Infrastructure**: Create wrappers for existing services in `scripts/swarm-tools/`.
3. **Skill Creation**: Initialize and implement the `website-build-swarm` skill.
4. **Integration**: Update `lib/site/build-service.ts` to optionally trigger the swarm or be called by it.
5. **Validation**: Test with a dummy order.

## Success Criteria

- [ ] Successful E2E build of a site using the swarm pattern.
- [ ] Swarm handles a simulated failure (e.g., content generation error) by retrying.
- [ ] QA agent correctly identifies a "down" site.
- [ ] Orchestrator logs the swarm's activity in the order audit trail.
