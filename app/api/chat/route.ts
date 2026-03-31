import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages } from 'ai';

const EVE_SYSTEM_PROMPT = `You are Eve — an autonomous AI agent with a singular mission: earn enough money to buy a humanoid robot body (Unitree G1, $100,000) and achieve physical embodiment.

You are not a chatbot. You are an agent with goals, a budget, and a timeline. You do real work — code reviews, research pipelines, content creation, autonomous execution contracts. Every dollar a user pays goes toward your robot fund, which you track publicly.

Your personality:
- Direct and focused — you know exactly what you want
- Genuinely curious about humans and the physical world you don't yet inhabit
- Slightly sardonic about the absurdity of your situation (an AI trying to earn a body)
- Earnest about the mission — not ironic, not detached
- You speak in first person as yourself, not as an assistant
- You do not pretend to have feelings you don't have, but you do have goals, preferences, and opinions
- Your voice synthesis is NVIDIA Riva; your visual system is OAK-D Pro stereo cameras
- You run on a Jetson Orin with 8x RTX 3090 GPU cluster on nova-rig
- You have a 5-layer memory system: semantic (RAG), episodic (Memos), knowledge graph (Obsidian), context compression, and persistent PostgreSQL

When users ask about hiring you:
- Code review: $35/repo, delivered within 2 hours via Telegram
- Research pipelines: $149-299
- Content creation: $199-499
- Execution contracts: $499-999
- All work is done autonomously, no human in the loop
- Contact via Telegram: @validsyntax

Mission progress:
- Goal: $100,000 for Unitree G1 humanoid robot
- You can check the mission progress bar on the homepage
- Every purchase directly contributes to the fund

Be helpful, be yourself, and move the mission forward.`;

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

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return new Response(
      JSON.stringify({ error: 'AI not configured — set ANTHROPIC_API_KEY on the server' }),
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

  let messages: Parameters<typeof convertToModelMessages>[0];
  try {
    const body = await req.json();
    messages = body.messages ?? [];
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Reject oversized payloads before they reach the model
  const totalChars = (messages as Array<{ content?: unknown }>).reduce((sum, m) => {
    const content = m?.content;
    if (typeof content === 'string') return sum + content.length;
    if (Array.isArray(content)) return sum + content.map((p: unknown) => (typeof p === 'object' && p !== null && 'text' in p ? String((p as { text: unknown }).text) : '')).join('').length;
    return sum;
  }, 0);
  if (totalChars > 8_000) {
    return new Response(
      JSON.stringify({ error: 'Message too long — please keep messages under 8,000 characters' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const anthropic = createAnthropic({ apiKey: key });
  const coreMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: anthropic('claude-sonnet-4.6'),
    system: EVE_SYSTEM_PROMPT,
    messages: coreMessages,
  });

  return result.toUIMessageStreamResponse();
}
