// OpenClaw HTTP proxy URL — the proxy handles the WebSocket gateway handshake internally.
// Default: nova's proxy via Tailscale. Override via OPENCLAW_URL for VPS with WireGuard relay.
const OPENCLAW_PROXY_URL =
  (process.env.OPENCLAW_URL ?? 'http://100.105.14.117:8097').replace(/\/$/, '');

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

// Wrap a plain string into the AI SDK UIMessageStream wire format so the
// existing `useChat` / DefaultChatTransport frontend needs no changes.
// Protocol: each line is "<type>:<json>\n"
//   3: = message start  |  0: = text delta  |  e:/d: = finish
function textToUIMessageStreamResponse(text: string): Response {
  const encoder = new TextEncoder();
  const msgId = `msg_${Date.now()}`;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`3:${JSON.stringify({ messageId: msgId })}\n`));

      // Emit word-by-word for a natural streaming feel
      const chunks = text.match(/\S+\s*/g) ?? [text];
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
      }

      const finish = JSON.stringify({
        finishReason: 'stop',
        usage: { promptTokens: 0, completionTokens: 0 },
      });
      controller.enqueue(encoder.encode(`e:${finish}\n`));
      controller.enqueue(encoder.encode(`d:${finish}\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1',
      'Cache-Control': 'no-cache',
    },
  });
}

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
