# BUS-327 Blocker Report

**Date:** 2026-05-31
**Issue:** BUS-327 Fix login issues on eve.center
**Blocker:** Paperclip API unreachable — cannot update issue status

## What happened
- Fix was committed (6df8c9e) and pushed to main
- Paperclip API at `http://127.0.0.1:3100` is serving a different application's HTML
- Unable to PATCH issue status or post comments via API

## Fix summary
- AUTH_URL env var added for NextAuth v5 compatibility
- Edge auth jwt callback added for consistency
- signIn=1 redirect handling in chat page
- Missing Prisma migration created for ChatSession/ChatMessage/DraftPreview

## Unblock action needed
- Paperclip API needs to be restarted/restored at port 3100
- Issue BUS-327 status should be set to `in_review` with the fix comment
- VPS deployment needed: `git pull && npm run build && npm run db:deploy && pm2 reload ecosystem.config.js --env production`
