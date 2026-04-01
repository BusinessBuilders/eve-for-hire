// OpenClaw HTTP proxy URL — the proxy handles the WebSocket gateway handshake internally.
// Default: nova's proxy via Tailscale. Override via OPENCLAW_URL for VPS with WireGuard relay.
const OPENCLAW_PROXY_URL =
  (process.env.OPENCLAW_URL ?? 'http://100.105.14.117:8097').replace(/\/$/, '');

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
      body: JSON.stringify({ message, sessionKey }),
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
  return text;
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
  try {
    const body = await req.json();
    const messages: Array<{ role: string; content?: unknown; parts?: unknown[] }> =
      body.messages ?? [];

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
  // IP is used as sessionKey so each visitor maintains a continuous conversation.
  let eveReply: string;
  try {
    eveReply = await callOpenClaw(lastUserMessage, ip);
  } catch (err) {
    console.error('OpenClaw proxy failed:', err);
    return new Response(
      JSON.stringify({ error: 'Could not reach Eve — please try again shortly' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return textToUIMessageStreamResponse(eveReply);
}
