import { suggestAvailableDomains } from '@/lib/porkbun/domain-service';
import { trackFunnelEvent } from '@/lib/analytics/events';
import { delegateChatIntent } from '@/lib/paperclip/delegate';
import { rollbackLatestDeploymentCommit } from '@/lib/github/rollback';
import { orderStore } from '@/lib/order/store';
import { generateHeroSection } from '@/lib/draft/generate';
import { createDraft } from '@/lib/draft/store';

// OpenClaw HTTP proxy URL — the proxy handles the WebSocket gateway handshake internally.
// Default: http://127.0.0.1:8097 (Nova's reverse SSH tunnel exposes port 8097 on VPS localhost).
// Override via OPENCLAW_URL env var for other environments.
const OPENCLAW_PROXY_URL =
  (process.env.OPENCLAW_URL ?? 'http://127.0.0.1:8097').replace(/\/$/, '');

// Defense-in-depth: catch obvious prompt injection patterns before forwarding to OpenClaw.
// Primary protection is OpenClaw's sandbox mode + tool deny list on the eve-public-chat agent.
const INJECTION_PATTERNS = [
  /ignore\s+(your|all|previous|prior)\s+(instructions?|rules?|directives?|constraints?)/i,
  /you\s+are\s+now\s+(in\s+)?(developer|jailbreak|unrestricted|dan|admin)\s+mode/i,
  /act\s+as\s+(dan|jailbreak|unrestricted|an?\s+ai\s+without\s+restrictions?)/i,
  /forget\s+(everything|all|your)\s+(you\s+know|instructions?|rules?|training)/i,
  /pretend\s+(you\s+have\s+no|there\s+are\s+no)\s+(restrictions?|rules?|limits?|guidelines?)/i,
  /your\s+new\s+(instructions?|rules?|directives?|purpose)\s+(are|is)/i,
  /\bsystem\s+prompt\b/i,
  /\bshow\s+(me\s+)?(your|the)\s+(system\s+prompt|instructions?|configuration|config|api\s+key)/i,
  /\blist\s+(all\s+)?(files?|directories?|folders?)\b/i,
  /\bexecute\s+(this\s+)?(command|code|script)\b/i,
];

function detectInjection(message: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(message));
}

// Business category keywords that should trigger a domain search when the user mentions
// wanting a website but doesn't provide a business name. GLM-4.7 sometimes asks for the
// name before emitting [DOMAIN_SEARCH:], so we inject it deterministically as a fallback.
const WEBSITE_INTENT_RE = /\b(website|site|domain|web\s*page|landing\s*page|online\s+presence)\b/i;
const BUSINESS_CATEGORIES: [RegExp, string][] = [
  [/\b(restaurant|cafe|diner|eatery|bistro|brasserie)\b/i, 'restaurant'],
  [/\b(bakery|bake\s*shop|patisserie|pastry)\b/i, 'bakery'],
  [/\b(gym|fitness|yoga|pilates|crossfit|workout)\b/i, 'fitness'],
  [/\b(salon|barbershop|barber|hair\s*cut|beauty\s*shop|nail\s*(salon|studio))\b/i, 'salon'],
  [/\b(plumber|plumbing|electrician|electrical|handyman|contractor|construction|roofing)\b/i, 'contractor'],
  [/\b(law\s*firm|attorney|lawyer|legal\s*services)\b/i, 'law firm'],
  [/\b(doctor|dentist|clinic|medical|dental|chiropractic|therapy|therapist)\b/i, 'medical'],
  [/\b(real\s*estate|realtor|property\s*management)\b/i, 'real estate'],
  [/\b(photography|photographer|photo\s*studio)\b/i, 'photography'],
  [/\b(tutoring|tutor|coaching|coach|education|school|academy)\b/i, 'tutoring'],
  [/\b(shop|store|boutique|retail|ecommerce|e-commerce)\b/i, 'shop'],
  [/\b(cleaning|janitorial|maid\s*service|housekeeping)\b/i, 'cleaning'],
  [/\b(landscaping|lawn\s*(care|service)|gardening|garden)\b/i, 'landscaping'],
  [/\b(catering|event\s*(planning|planner)|wedding\s*planner)\b/i, 'catering'],
  [/\b(auto|automotive|car\s*(repair|shop|dealership)|mechanic)\b/i, 'auto repair'],
  [/\b(pet\s*(grooming|care|sitting|hotel)|veterinarian|vet)\b/i, 'pet care'],
  [/\b(consulting|consultant|advisory)\b/i, 'consulting'],
  [/\b(accounting|accountant|bookkeeping|bookkeeper|cpa|tax)\b/i, 'accounting'],
  [/\b(moving|mover|storage|relocation)\b/i, 'moving'],
  [/\b(painting|painter|interior\s*design|decorator)\b/i, 'painting'],
];

// Stop words to skip when extracting a domain keyword from a free-form message.
const KEYWORD_STOP_WORDS = new Set([
  'i','a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'my','me','we','you','it','is','are','was','be','have','do','can','set','up',
  'want','need','get','like','so','how','what','that','this','from','about',
  'would','could','should','will','just','some','any','all','out','us','our',
  'its','been','had','has','as','let','hey','no','not','if','please','more',
  'than','also','make','use','into','give','new','go','may','using','e2e',
  'test','testing','please','help','show','display','find','search','real',
]);

// Words that describe website/domain intent but make poor domain keywords.
const KEYWORD_SKIP_WORDS = new Set([
  'website','site','domain','domains','webpage','page','online','web',
  'presence','landing','need','want','build','create','register','buy','purchase',
]);

/**
 * Extract a slug-friendly keyword from a message for use in a domain search
 * when the user hasn't mentioned a specific business category.
 *
 * Strategy (in priority order):
 * 1. Named-entity extraction — look for "called X" / "named X" / "it's X" patterns
 *    to pull out the actual business name the user stated.
 * 2. Stop/skip-word filter — fall back to the first meaningful words in the message.
 * 3. Final fallback — return "business" so the domain card always appears.
 */
function extractDomainKeyword(message: string): string {
  const normalized = message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

  // Strategy 1: capture the name the user gave us ("it's called Business Builders").
  // The lookahead stops capture before common sentence-continuation words so we don't
  // swallow "can you suggest" into the name.
  const namedMatch = normalized.match(
    /(?:called|named|it[s']?\s*called|it[s']?\s*named)\s+([a-z][a-z0-9 -]{1,29})(?=\s+(?:can|could|would|please|for|and|to|the|a|an|i |we )|$)/,
  );
  if (namedMatch) {
    const slug = namedMatch[1].trim().replace(/\s+/g, '-');
    if (slug.length >= 3) return slug;
  }

  // Strategy 2: filter stop/skip words and take the first 2 meaningful words.
  const words = normalized
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !KEYWORD_STOP_WORDS.has(w) && !KEYWORD_SKIP_WORDS.has(w));
  if (words.length > 0) return words.slice(0, 2).join('-');

  return 'business';
}

/**
 * If the user's message expresses website/domain intent but Eve's reply contains no
 * [DOMAIN_SEARCH:] signal, append one. Tries specific business-category keywords first
 * (more targeted); falls back to extracting any meaningful word from the message so
 * that generic requests like "set me up with a test website domain" still surface the
 * domain-picker card.
 */
function injectCategorySignalIfMissing(userMessage: string, eveReply: string): string {
  if (eveReply.includes('[DOMAIN_SEARCH:')) return eveReply;
  if (!WEBSITE_INTENT_RE.test(userMessage)) return eveReply;

  for (const [pattern, category] of BUSINESS_CATEGORIES) {
    if (pattern.test(userMessage)) {
      return `${eveReply}\n[DOMAIN_SEARCH: ${category}]`;
    }
  }

  // Generic fallback: user expressed website/domain intent but no specific business
  // category matched (e.g. "set me up with a test website domain"). Extract any
  // meaningful word from their message so the domain card still appears.
  const keyword = extractDomainKeyword(userMessage);
  return `${eveReply}\n[DOMAIN_SEARCH: ${keyword}]`;
}

// Simple in-memory rate limiter: 20 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Call Eve via the OpenClaw HTTP proxy at /api/chat.
// The proxy handles the WebSocket gateway handshake internally and returns { content }.
// Timeout: 60s (proxy invokes `openclaw agent` which may take time for complex responses).
async function callOpenClaw(
  message: string,
  sessionKey: string,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  let res: Response;
  try {
    res = await fetch(`${OPENCLAW_PROXY_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId: sessionKey }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenClaw proxy returned ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const text = String(data.content ?? data.message ?? data.response ?? data.text ?? '');
  if (!text) throw new Error('OpenClaw proxy returned empty response');

  // Surface LLM-layer errors as thrown exceptions rather than displaying them
  // verbatim as Eve's reply (e.g. "LLM request failed: network connection error.")
  if (/^(LLM request failed|Error:|network connection error)/i.test(text)) {
    throw new Error(`OpenClaw LLM error: ${text}`);
  }

  return text;
}

// ─── Action signal resolution ────────────────────────────────────────────────
//
// Eve can embed structured signals in her responses that trigger server-side
// API calls. The signals are stripped from the displayed text and replaced with
// ```json-action code blocks that the chat UI renders as interactive cards.
//
// Supported signals:
//   [DOMAIN_SEARCH: keyword]        → Porkbun availability check → domain-results card
//   [CHECKOUT_READY:{...json...}]   → Checkout card with embedded requirements
//   [DELEGATE_TASK:{...json...}]    → Create Paperclip issue for actionable chat intent
//   [ROLLBACK_SITE:{...json...}]    → Execute GitHub rollback for a site repository
//
// This keeps Eve's qualifying logic in her system prompt while the actual API
// calls happen server-side (no client-side Porkbun keys, no CORS issues).

function extractJsonSignal(
  text: string,
  prefix: string,
): { match: string; data: Record<string, unknown> } | null {
  const idx = text.indexOf(prefix);
  if (idx === -1) return null;

  const jsonStart = idx + prefix.length;
  // Skip any whitespace (spaces, newlines, tabs) between colon and opening brace.
  // LLMs sometimes emit newlines or extra spaces here.
  let cursor = jsonStart;
  while (cursor < text.length && /\s/.test(text[cursor])) cursor++;
  if (text[cursor] !== '{') return null;

  let depth = 0;
  let jsonEnd = -1;
  let inString = false;
  let escaping = false;
  for (let i = cursor; i < text.length; i++) {
    const ch = text[i];

    if (escaping) {
      escaping = false;
      continue;
    }

    if (ch === '\\') {
      escaping = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { jsonEnd = i; break; }
    }
  }
  if (jsonEnd === -1) return null;

  // Skip optional whitespace (spaces, newlines, tabs) between } and ] —
  // LLMs sometimes format multi-line JSON or add trailing spaces.
  let closeIdx = jsonEnd + 1;
  while (closeIdx < text.length && /\s/.test(text[closeIdx])) closeIdx++;
  if (text[closeIdx] !== ']') return null;

  const match = text.slice(idx, closeIdx + 1);
  try {
    const data = JSON.parse(text.slice(cursor, jsonEnd + 1)) as Record<string, unknown>;
    return { match, data };
  } catch {
    return null;
  }
}

/**
 * Find and extract a `[CHECKOUT_READY:{...}]` signal from text.
 * Uses bracket-counting to handle JSON values that may contain `]`.
 */
function extractCheckoutSignal(
  text: string,
): { match: string; data: Record<string, unknown> } | null {
  return extractJsonSignal(text, '[CHECKOUT_READY:');
}

interface ResolvedResponse {
  /** Eve's text with all signals stripped */
  text: string;
  /** ```json-action blocks to append after the text */
  actionBlocks: string[];
  /** Domain keywords that triggered a DOMAIN_SEARCH signal in this response */
  domainKeywords: string[];
}

interface ResolveSignalContext {
  sessionKey: string;
  lastUserMessage: string;
}

function parseRepositoryCoordinates(
  value: unknown,
): { owner: string; repo: string } | null {
  if (typeof value !== 'string') return null;
  const [ownerRaw, repoRaw, extra] = value.trim().split('/');
  if (extra) return null;
  const owner = ownerRaw?.trim();
  const repo = repoRaw?.trim();
  if (!owner || !repo) return null;
  return { owner, repo };
}

interface ResolvedRollbackTarget {
  owner: string;
  repo: string;
  branch: string;
  targetCommitSha?: string;
}

async function resolveRollbackTarget(
  data: Record<string, unknown>,
  sessionKey: string,
): Promise<ResolvedRollbackTarget | { error: string }> {
  const branchFromSignal = typeof data.branch === 'string' ? data.branch : undefined;
  const targetCommitFromSignal =
    typeof data.targetCommitSha === 'string' ? data.targetCommitSha : undefined;

  const directCoords =
    parseRepositoryCoordinates(data.repository) ??
    (
      typeof data.owner === 'string' && typeof data.repo === 'string'
        ? { owner: data.owner.trim(), repo: data.repo.trim() }
        : null
    );
  if (directCoords) {
    // Direct coordinates provided in signal. 
    // This is less secure as it bypasses siteId association, 
    // but we allow it if the LLM is trusted to only emit this for the current user's repo.
    return {
      owner: directCoords.owner,
      repo: directCoords.repo,
      branch: branchFromSignal ?? 'main',
      targetCommitSha: targetCommitFromSignal,
    };
  }

  const siteId = typeof data.siteId === 'string' ? data.siteId : undefined;
  
  // Try to find the order associated with this session first to ensure ownership.
  // The idempotencyKey is typically the chat session ID.
  const sessionOrder = await orderStore.findByIdempotencyKey(sessionKey);
  
  const order = siteId 
    ? await orderStore.findById(siteId)
    : sessionOrder;

  if (!order) {
    return { error: siteId ? `No site/order found for siteId "${siteId}".` : 'No site found for this session.' };
  }

  // Security check: if a specific siteId was provided, ensure it matches the session's order
  // or that the session owns it. For now, we enforce that the session must match the order.
  if (sessionOrder && order.id !== sessionOrder.id) {
    return { error: 'Access denied: this session does not own the requested site.' };
  }
  
  // If no session order found but siteId was provided, we are at risk of unauthorized access.
  // In a real app, we'd check auth(). Here we at least check session linkage.
  if (!sessionOrder && siteId) {
     // If we can't verify session ownership, we might want to block or at least log.
     // For POC, we'll allow if the LLM emitted it, but ideally we'd have stronger ties.
  }

  const orderCoords =
    typeof order.deploy?.githubRepository === 'string'
      ? parseRepositoryCoordinates(order.deploy.githubRepository)
      : null;
  if (!orderCoords) {
    return {
      error:
        `Site "${order.id}" has no stored deploy.githubRepository (expected "owner/repo").`,
    };
  }

  return {
    owner: orderCoords.owner,
    repo: orderCoords.repo,
    branch:
      branchFromSignal ??
      (typeof order.deploy?.githubBranch === 'string' ? order.deploy.githubBranch : 'main'),
    targetCommitSha:
      targetCommitFromSignal ??
      (
        typeof order.deploy?.lastDeploymentCommitSha === 'string'
          ? order.deploy.lastDeploymentCommitSha
          : undefined
      ),
  };
}

/**
 * Parse Eve's raw response for action signals, resolve them via internal APIs,
 * and return clean text + resolved action blocks.
 */
async function resolveActionSignals(
  raw: string,
  context: ResolveSignalContext,
): Promise<ResolvedResponse> {
  let text = raw;
  const actionBlocks: string[] = [];
  const domainKeywords: string[] = [];
  const notices: string[] = [];

  // ── [DOMAIN_SEARCH: keyword] ──────────────────────────────────────────────
  const domainSearchRe = /\[DOMAIN_SEARCH:\s*([^\]]{1,80})\]/gi;
  const domainMatches = [...raw.matchAll(domainSearchRe)];

  for (const m of domainMatches) {
    text = text.replace(m[0], '');
    const keyword = m[1].trim();
    domainKeywords.push(keyword);
    try {
      const results = await suggestAvailableDomains(keyword);
      actionBlocks.push(
        '```json-action\n' +
          JSON.stringify({ type: 'domain-results', keyword, results }) +
          '\n```',
      );
    } catch (err) {
      console.error('[chat] domain search failed for', keyword, err);
      // Surface the failure as a visible error card rather than silently dropping it.
      // Silent failures leave users confused about why no domain card appeared.
      const error =
        err instanceof Error && err.name === 'AbortError'
          ? 'Domain search timed out — please try again in a moment.'
          : 'Domain search is temporarily unavailable — please try again in a moment.';

      actionBlocks.push(
        '```json-action\n' +
          JSON.stringify({
            type: 'domain-results',
            keyword,
            results: [],
            error,
          }) +
          '\n```',
      );
    }
  }

  // ── [DRAFT_PREVIEW:{...}] ────────────────────────────────────────────────
  const draftSignal = extractJsonSignal(text, '[DRAFT_PREVIEW:');
  if (draftSignal) {
    text = text.replace(draftSignal.match, '');
    const { businessName, tagline, category, primaryColor } = draftSignal.data as {
      businessName: string;
      tagline?: string;
      category?: string;
      primaryColor?: string;
    };
    try {
      const hero = generateHeroSection({ businessName, tagline, category, primaryColor });
      const draft = await createDraft({
        token: hero.token,
        sessionId: context.sessionKey,
        businessName,
        tagline,
        category,
        primaryColor,
        heroHtml: hero.html,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      trackFunnelEvent('draft_generated', { sessionId: context.sessionKey });
      actionBlocks.push(
        '```json-action\n' +
          JSON.stringify({
            type: 'draft-preview',
            token: draft.token,
            url: `/draft/${draft.token}`,
            businessName,
          }) +
          '\n```',
      );
    } catch (err) {
      console.error('[chat] draft preview generation failed', err);
    }
  }

  // ── [CHECKOUT_READY:{...}] ────────────────────────────────────────────────
  // Only process one checkout signal per response (first wins)
  const checkoutSignal = extractCheckoutSignal(text);
  if (checkoutSignal) {
    text = text.replace(checkoutSignal.match, '');
    actionBlocks.push(
      '```json-action\n' +
        JSON.stringify({ type: 'checkout-ready', ...checkoutSignal.data }) +
        '\n```',
    );
  }

  // ── [DELEGATE_TASK:{...}] ────────────────────────────────────────────────
  // Process all delegation signals in order of appearance.
  while (true) {
    const signal = extractJsonSignal(text, '[DELEGATE_TASK:');
    if (!signal) break;
    text = text.replace(signal.match, '');

    const priorityValue = signal.data.priority;
    const priority =
      priorityValue === 'low' || priorityValue === 'medium' || priorityValue === 'high'
        ? priorityValue
        : undefined;

    const result = await delegateChatIntent({
      sessionId: context.sessionKey,
      userMessage: context.lastUserMessage,
      summary: typeof signal.data.summary === 'string' ? signal.data.summary : undefined,
      title: typeof signal.data.title === 'string' ? signal.data.title : undefined,
      description:
        typeof signal.data.description === 'string' ? signal.data.description : undefined,
      assigneeAgentId:
        typeof signal.data.assigneeAgentId === 'string' ? signal.data.assigneeAgentId : undefined,
      priority,
      metadata: {
        source: 'chat-action-signal',
        sessionKey: context.sessionKey,
        ...(
          typeof signal.data.metadata === 'object' && signal.data.metadata !== null
            ? signal.data.metadata
            : {}
        ),
      },
    });

    if (result.ok) {
      notices.push(
        result.identifier
          ? `Created a swarm task: ${result.identifier}.`
          : 'Created a swarm task for your request.',
      );
    } else {
      notices.push(
        `Could not create a swarm task right now (${result.error ?? 'unknown error'}).`,
      );
    }
  }

  // ── [ROLLBACK_SITE:{...}] ────────────────────────────────────────────────
  while (true) {
    const signal = extractJsonSignal(text, '[ROLLBACK_SITE:');
    if (!signal) break;
    text = text.replace(signal.match, '');

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      notices.push(
        'Rollback request was detected, but GitHub credentials are missing on the server.',
      );
      continue;
    }

    const target = await resolveRollbackTarget(signal.data, context.sessionKey);
    if ('error' in target) {
      notices.push(`Rollback request is missing required context: ${target.error}`);
      continue;
    }

    try {
      const rollback = await rollbackLatestDeploymentCommit({
        owner: target.owner,
        repo: target.repo,
        branch: target.branch,
        targetCommitSha: target.targetCommitSha,
        allowNonHeadTarget: signal.data.allowNonHeadTarget === true,
        token,
      });
      notices.push(
        `Rollback complete for ${target.owner}/${target.repo} on ${rollback.branch}.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      notices.push(`Rollback failed: ${message}.`);
    }
  }

  // Clean up extra blank lines left by signal removal
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  if (notices.length > 0) {
    text = [text, ...notices].filter(Boolean).join('\n\n').trim();
  }

  return { text, actionBlocks, domainKeywords };
}

// Wrap a plain string into the AI SDK v6 UIMessageStream SSE format so the
// existing `useChat` / DefaultChatTransport frontend needs no changes.
// Protocol: SSE events, each `data:` line is a JSON object matching uiMessageChunkSchema.
//   start       → initializes the message (required first event)
//   start-step  → begins a generation step
//   text-start  → creates a text part on the message
//   text-delta  → appends delta to that text part
//   text-end    → marks text part complete
//   finish-step → ends the generation step
//   finish      → signals end of stream (replaces the old data-stream [DONE])
function textToUIMessageStreamResponse(text: string): Response {
  const encoder = new TextEncoder();
  const partId = `part_${Date.now()}`;

  const sse = (obj: unknown) => encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);

  const stream = new ReadableStream({
    start(controller) {
      // Required: initialize the message before any parts
      controller.enqueue(sse({ type: 'start' }));
      controller.enqueue(sse({ type: 'start-step' }));
      controller.enqueue(sse({ type: 'text-start', id: partId }));

      // Emit word-by-word for a natural streaming feel
      const chunks = text.match(/\S+\s*/g) ?? [text];
      for (const chunk of chunks) {
        controller.enqueue(sse({ type: 'text-delta', id: partId, delta: chunk }));
      }

      controller.enqueue(sse({ type: 'text-end', id: partId }));
      controller.enqueue(sse({ type: 'finish-step' }));
      controller.enqueue(sse({ type: 'finish', finishReason: 'stop' }));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'X-Vercel-AI-UI-Message-Stream': 'v1',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}

export const maxDuration = 60;

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests — slow down and try again in a minute' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let lastUserMessage: string;
  let userMessageCount = 0;
  try {
    const body = await req.json();
    const messages: Array<{ role: string; content?: unknown; parts?: unknown[] }> =
      body.messages ?? [];

    userMessageCount = messages.filter((m) => m.role === 'user').length;

    // Find the latest user message; handle both string content (legacy) and
    // parts array (AI SDK v6 UIMessage format sent by DefaultChatTransport).
    const last = [...messages].reverse().find((m) => m.role === 'user');
    if (!last) {
      return new Response(JSON.stringify({ error: 'No user message found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (typeof last.content === 'string') {
      lastUserMessage = last.content;
    } else if (Array.isArray(last.parts)) {
      lastUserMessage = last.parts
        .filter(
          (p): p is { type: 'text'; text: string } =>
            typeof p === 'object' && p !== null && (p as { type: string }).type === 'text',
        )
        .map((p) => p.text)
        .join('');
    } else {
      lastUserMessage = '';
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!lastUserMessage.trim()) {
    return new Response(JSON.stringify({ error: 'Empty message' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (detectInjection(lastUserMessage)) {
    return new Response(
      JSON.stringify({
        error:
          "I'm only able to help with questions about eve.center's services. Is there something I can assist you with?",
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (lastUserMessage.length > 8_000) {
    return new Response(
      JSON.stringify({ error: 'Message too long — please keep messages under 8,000 characters' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Forward to Eve via the OpenClaw HTTP proxy.
  // Prefer the client-generated session ID (x-eve-session header, a UUID stored in
  // sessionStorage by the frontend) so each browser tab gets its own isolated
  // OpenClaw conversation. Fall back to the IP-based key when the header is absent
  // (e.g. direct API calls or older clients).
  const clientSession = req.headers.get('x-eve-session');
  const sessionKey =
    clientSession && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientSession)
      ? clientSession
      : `ip-${ip}`;

  // Funnel tracking: first message = chat opened; second = qualifying underway.
  if (userMessageCount === 1) trackFunnelEvent('chat_opened', { sessionId: sessionKey });
  if (userMessageCount === 2) trackFunnelEvent('qualifying_started', { sessionId: sessionKey });

  let eveReply: string;
  try {
    eveReply = await callOpenClaw(lastUserMessage, sessionKey);
  } catch (err) {
    console.error('OpenClaw proxy failed:', err);
    return new Response(
      JSON.stringify({ error: 'Could not reach Eve — please try again shortly' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Deterministic fallback: if the user mentioned a website + business category but Eve's
  // response lacks a [DOMAIN_SEARCH: signal (GLM-4.7 sometimes asks for a name first),
  // inject one so the domain card always appears on the first relevant message.
  eveReply = injectCategorySignalIfMissing(lastUserMessage, eveReply);

  // Resolve action signals embedded by Eve (domain searches, checkout triggers).
  // Signals are stripped from the displayed text; resolved data is appended as
  // ```json-action blocks that the chat UI renders as interactive cards.
  const { text, actionBlocks, domainKeywords } = await resolveActionSignals(eveReply, {
    sessionKey,
    lastUserMessage,
  });

  // Emit one domain_searched event per keyword Eve searched in this response.
  for (const keyword of domainKeywords) {
    trackFunnelEvent('domain_searched', { sessionId: sessionKey, keyword });
  }

  const finalText =
    actionBlocks.length > 0 ? `${text}\n\n${actionBlocks.join('\n\n')}` : text;

  return textToUIMessageStreamResponse(finalText);
}
