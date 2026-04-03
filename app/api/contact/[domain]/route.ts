/**
 * Contact Form API
 *
 * Receives form submissions from generated customer sites and forwards
 * the visitor's message to the business owner via SMTP email.
 *
 * CORS is open (*) so static customer sites can POST from their own domain.
 * Rate limit: 5 requests per IP per hour (stricter than chat, prevents spam).
 *
 * Required env vars for email forwarding:
 *   SMTP_HOST  — SMTP server hostname (e.g. smtp.sendgrid.net)
 *   SMTP_PORT  — SMTP port, default 587
 *   SMTP_USER  — SMTP username
 *   SMTP_PASS  — SMTP password or API key
 *   SMTP_FROM  — Sender display+address, e.g. "Eve <hello@eve.center>"
 *
 * If SMTP env vars are absent, the endpoint still returns 200 (graceful degradation).
 */

import { type NextRequest } from 'next/server';
import nodemailer from 'nodemailer';
import { orderStore } from '@/lib/order/store';

// ─── Rate limiting ────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

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

// ─── Domain validation ────────────────────────────────────────────────────────

const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
): Promise<Response> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: 'Too many requests — please try again later' },
      { status: 429, headers: CORS },
    );
  }

  const { domain } = await params;

  if (!DOMAIN_RE.test(domain)) {
    return Response.json({ error: 'Invalid domain' }, { status: 400, headers: CORS });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS });
  }

  const { name, email, message } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof email !== 'string' || !email.includes('@') ||
    typeof message !== 'string' || !message.trim()
  ) {
    return Response.json(
      { error: 'name, email, and message are required' },
      { status: 400, headers: CORS },
    );
  }

  // Look up the business owner's email. Return 200 regardless to avoid
  // leaking whether a domain is registered with eve.center.
  const order = await orderStore.findByDomain(domain);
  if (!order) {
    console.warn(`[contact] no order found for domain ${domain} — discarding submission`);
    return Response.json({ ok: true }, { headers: CORS });
  }

  // Forward via SMTP if configured.
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM ?? 'Eve <hello@eve.center>';

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: order.customerEmail,
        replyTo: `${name.trim()} <${email.trim()}>`,
        subject: `New contact from ${name.trim()} via ${domain}`,
        text: [
          `You received a new message on your website ${domain}:`,
          '',
          `From: ${name.trim()} <${email.trim()}>`,
          '',
          'Message:',
          message.trim(),
          '',
          '---',
          'Sent via Eve for Business (eve.center)',
        ].join('\n'),
      });

      console.log(`[contact] forwarded message from ${email} to ${order.customerEmail} for ${domain}`);
    } catch (err) {
      // Log but don't expose SMTP errors to the caller.
      console.error(`[contact] email send failed for ${domain}:`, err);
    }
  } else {
    console.warn('[contact] SMTP not configured — skipping email forwarding');
  }

  return Response.json({ ok: true }, { headers: CORS });
}
