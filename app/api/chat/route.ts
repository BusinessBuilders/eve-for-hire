import WebSocket from 'ws';

// Convert OPENCLAW_URL (http/https/ws/wss) to a WebSocket URL.
// Eve's gateway is WebSocket-only — there is no REST /api/chat endpoint.
function toWsUrl(url: string): string {
  return url.replace(/^http(s?):\/\//, (_, s) => `ws${s}://`);
}

const OPENCLAW_WS_URL = toWsUrl(
  process.env.OPENCLAW_URL ?? 'wss://nova.tailscale.io:18789',
);

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

// Call Eve via WebSocket. Accumulates all message chunks until the socket
// closes or a done signal arrives, then returns the full reply text.
// Timeout: 30s (covers slow Eve responses).
function callOpenClaw(
  message: string,
  sessionKey: string,
  token: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(OPENCLAW_WS_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-openclaw-token': token,
      },
    });

    const chunks: string[] = [];
    let settled = false;

    const settle = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) {
        reject(err);
      } else {
        const text = chunks.join('');
        if (text) resolve(text);
        else reject(new Error('OpenClaw closed without sending a response'));
      }
    };

    const timer = setTimeout(() => {
      ws.terminate();
      settle(new Error('OpenClaw timed out after 30s'));
    }, 30_000);

    ws.once('open', () => {
      ws.send(JSON.stringify({ message, sessionKey }));
    });

    ws.on('message', (raw) => {
      const str = raw.toString();
      try {
        const parsed = JSON.parse(str) as Record<string, unknown>;
        // Support streaming deltas and single-shot responses.
        const text = String(
          parsed.content ?? parsed.message ?? parsed.text ?? parsed.delta ?? '',
        );
        if (text) chunks.push(text);

        // Some protocols signal completion explicitly.
        if (parsed.done === true || parsed.finishReason === 'stop') {
          ws.close();
          settle();
        }
      } catch {
        // Non-JSON frame — treat as raw text chunk.
        if (str) chunks.push(str);
      }
    });

    ws.once('close', () => settle());
    ws.once('error', (err) => settle(err));
  });
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

  // Forward to Eve's OpenClaw gateway via WebSocket.
  // IP is used as sessionKey so each visitor maintains a continuous conversation.
  let eveReply: string;
  try {
    eveReply = await callOpenClaw(lastUserMessage, ip, token);
  } catch (err) {
    console.error('OpenClaw WebSocket failed:', err);
    return new Response(
      JSON.stringify({ error: 'Could not reach Eve — please try again shortly' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return textToUIMessageStreamResponse(eveReply);
}
