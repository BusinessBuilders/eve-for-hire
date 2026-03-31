// OpenClaw gateway URL — default to Eve's public Tailscale endpoint.
// Override via OPENCLAW_URL env var if the VPS has a direct route to a different address.
const OPENCLAW_API = `${process.env.OPENCLAW_URL ?? 'https://nova.tailscale.io:18789'}/api/chat`;

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
  const token = process.env.OPENCLAW_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Chat not configured — OPENCLAW_TOKEN not set on the server' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

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

  // Forward to Eve's OpenClaw gateway. The IP is used as the sessionKey so
  // each visitor gets a continuous conversation with Eve.
  let eveReply: string;
  try {
    const ocRes = await fetch(OPENCLAW_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: lastUserMessage, sessionKey: ip }),
    });

    if (!ocRes.ok) {
      const errText = await ocRes.text().catch(() => '');
      console.error(`OpenClaw ${ocRes.status}: ${errText}`);
      return new Response(
        JSON.stringify({
          error: `Eve is unavailable right now (${ocRes.status}) — try again shortly`,
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const data = (await ocRes.json()) as { content?: string; message?: string; text?: string };
    eveReply = data.content ?? data.message ?? data.text ?? '';
    if (!eveReply) throw new Error('Empty response body from OpenClaw');
  } catch (err) {
    console.error('OpenClaw fetch failed:', err);
    return new Response(
      JSON.stringify({ error: 'Could not reach Eve — please try again shortly' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return textToUIMessageStreamResponse(eveReply);
}
