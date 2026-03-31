/**
 * Site Content Generator
 *
 * Uses AI SDK (Anthropic) to produce structured copy for a customer's landing page.
 * Input: OrderRequirements — the qualifying chat summary, business type, domain, style prefs.
 * Output: SiteContent — typed copy ready to be injected into the HTML template.
 */

import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { OrderRequirements } from '@/lib/order/types';

// ─── Output schema ────────────────────────────────────────────────────────────

export const SiteContentSchema = z.object({
  businessName: z.string().describe('Short business name used in title and logo text'),
  tagline: z.string().describe('One-line tagline shown under the business name'),
  headline: z.string().describe('Main hero headline — punchy, benefit-led, max 10 words'),
  subheadline: z
    .string()
    .describe('One or two sentences expanding on the headline — what they do and for whom'),
  ctaText: z.string().describe('Call-to-action button label, e.g. "Get Started" or "Book a Call"'),
  features: z
    .array(
      z.object({
        icon: z.string().describe('A single relevant emoji for this feature'),
        title: z.string().describe('Feature title, 2-4 words'),
        description: z.string().describe('One sentence explaining this feature or benefit'),
      }),
    )
    .min(3)
    .max(6)
    .describe('Key features or benefits of the business'),
  about: z
    .string()
    .describe(
      '2-3 sentence paragraph about the business for the "About Us" section',
    ),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .describe('Dominant brand hex color, e.g. #2563eb. Must be vivid enough to pass 3:1 contrast.'),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .describe('Secondary accent hex color that complements the primary'),
  contactEmail: z.string().email().optional().describe('Contact email if derivable from requirements'),
});

export type SiteContent = z.infer<typeof SiteContentSchema>;

// ─── Generator ────────────────────────────────────────────────────────────────

/**
 * Generate structured landing page content from a customer's requirements.
 * Calls Anthropic claude-sonnet-4-6 with Output.object() for typed output.
 */
export async function generateSiteContent(
  requirements: OrderRequirements,
): Promise<SiteContent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const anthropic = createAnthropic({ apiKey });

  const prompt = buildPrompt(requirements);

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4.6'),
    prompt,
    system: SYSTEM_PROMPT,
    maxOutputTokens: 1024,
  });

  // Parse the JSON block from the response.
  return parseContentFromText(text, requirements);
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are a professional copywriter and web designer. You create compelling, conversion-focused
landing page content for small businesses. Your copy is clear, benefit-led, and authentic.

Always respond with a single valid JSON object matching the SiteContent schema.
Do not include any text outside the JSON object.
`.trim();

function buildPrompt(req: OrderRequirements): string {
  const parts: string[] = [
    `Generate landing page content for a business with these details:`,
    `Business type: ${req.businessType}`,
    `Purpose / goals: ${req.purpose}`,
    `Desired domain: ${req.desiredDomain}`,
  ];

  if (req.style) parts.push(`Style preferences: ${req.style}`);
  if (req.chatSummary) parts.push(`Conversation summary: ${req.chatSummary}`);

  parts.push('');
  parts.push('Return a JSON object with these fields:');
  parts.push(JSON.stringify(SiteContentSchema.shape, null, 2));

  return parts.join('\n');
}

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseContentFromText(text: string, req: OrderRequirements): SiteContent {
  // Strip markdown code fences if present.
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI did not return valid JSON: ${cleaned.slice(0, 200)}`);
  }

  const result = SiteContentSchema.safeParse(parsed);
  if (result.success) return result.data;

  // Attempt to salvage: fill in required fields with fallbacks.
  console.warn('[content-generator] AI output failed full schema validation — applying fallbacks');
  return applyFallbacks(parsed as Record<string, unknown>, req);
}

function applyFallbacks(
  raw: Record<string, unknown>,
  req: OrderRequirements,
): SiteContent {
  const domainSlug = req.desiredDomain.replace(/\.(com|net|org|io|co)$/, '').replace(/-/g, ' ');
  const businessName =
    typeof raw.businessName === 'string' ? raw.businessName : domainSlug;

  return {
    businessName,
    tagline: typeof raw.tagline === 'string' ? raw.tagline : 'Professional services you can trust',
    headline:
      typeof raw.headline === 'string'
        ? raw.headline
        : `Welcome to ${businessName}`,
    subheadline:
      typeof raw.subheadline === 'string'
        ? raw.subheadline
        : `We help you with ${req.purpose}.`,
    ctaText: typeof raw.ctaText === 'string' ? raw.ctaText : 'Get in Touch',
    features: Array.isArray(raw.features)
      ? (raw.features as SiteContent['features']).slice(0, 6)
      : defaultFeatures,
    about:
      typeof raw.about === 'string'
        ? raw.about
        : `${businessName} is dedicated to providing excellent service to our customers.`,
    primaryColor:
      typeof raw.primaryColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.primaryColor)
        ? raw.primaryColor
        : '#2563eb',
    accentColor:
      typeof raw.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.accentColor)
        ? raw.accentColor
        : '#7c3aed',
    contactEmail:
      typeof raw.contactEmail === 'string' && raw.contactEmail.includes('@')
        ? raw.contactEmail
        : undefined,
  };
}

const defaultFeatures: SiteContent['features'] = [
  { icon: '⚡', title: 'Fast & Reliable', description: 'Built for speed and dependability.' },
  { icon: '🎯', title: 'Results Focused', description: 'We deliver measurable outcomes.' },
  { icon: '🤝', title: 'Personal Service', description: 'A dedicated team behind every project.' },
];
