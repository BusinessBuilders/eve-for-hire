---
name: website-build-swarm
description: Orchestrate a multi-agent swarm to build, design, and deploy a website for a paid order. Use when an order reaches the 'paid' state and needs a full build/deploy pipeline.
---

# Website Build Swarm

This skill provides a multi-agent workflow for automating the website creation process. It replaces the linear build pipeline with a coordinated swarm of specialized agents.

## Workflow

### 1. Preparation
- **Read Order**: Retrieve the order details from the database using `orderStore.findById(orderId)`.
- **Requirements**: Extract `businessType`, `purpose`, and `chatSummary`.

### 2. Content Generation (Content Agent)
- **Role**: Copywriter.
- **Task**: Generate structured `SiteContent` using `lib/site/content-generator.ts`.
- **Refinement**: Ensure copy is benefit-led and covers all 4 pages (Home, About, Services, Contact).

### 3. Design Refinement (Design Agent)
- **Role**: Visual Designer.
- **Task**: Review the generated `SiteContent`.
- **Responsibility**: 
    - Adjust `primaryColor` and `accentColor` for best accessibility and brand fit.
    - Refine `headline` and `tagline` for visual impact.

### 4. Build & Deployment (Deploy Agent)
- **Role**: Technical Lead / DevOps.
- **Task**: 
    - Render HTML using `lib/site/template.ts`.
    - Upload to VPS via SSH using `lib/site/ssh.ts`.
    - Reload Caddy.

### 5. Verification & QA (QA Agent)
- **Role**: Quality Assurance.
- **Task**: 
    - Verify DNS propagation.
    - Run HTTP smoke test.
    - Confirm site is reachable and looks correct.

## Agent Roles & Prompts

See [references/agents.md](references/agents.md) for detailed role definitions and system prompts.

## Tools & Scripts

- **List Orders**: `npx tsx scripts/swarm-tools/list-paid-orders.ts`
- **Requirements**: `npx tsx scripts/swarm-tools/get-requirements.ts <orderId>`
- **Validation**: `npx tsx scripts/swarm-tools/validate-content.ts <content.json>`
- **State**: `npx tsx scripts/swarm-tools/update-order-state.ts <orderId> <event> [note]`
- **Deploy**: `npx tsx scripts/swarm-tools/deploy-site.ts <content.json> <domain>`
- **QA**: `npx tsx scripts/swarm-tools/verify-site.ts <domain>`

## State Transitions

The swarm must update the order state in the database:
- `building`: When content/design/deploy starts.
- `deploying`: When build succeeds and verification starts.
- `live`: When QA passes.
- `build_failed` / `deploy_failed`: On error.
