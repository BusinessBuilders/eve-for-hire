/**
 * Site Content Generator
 *
 * Uses AI SDK (Anthropic) to produce structured copy for a customer's landing page.
 * Input: OrderRequirements — the qualifying chat summary, business type, domain, style prefs.
 * Output: SiteContent — typed copy ready to be injected into the HTML template.
 */

import { generateText } from 'ai';
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
  servicesPage: z
    .object({
      intro: z.string().describe('One sentence intro for the services page'),
      items: z
        .array(
          z.object({
            icon: z.string().describe('A single relevant emoji'),
            title: z.string().describe('Service name, 2-5 words'),
            description: z.string().describe('One sentence describing this service'),
            price: z.string().optional().describe('Price or price range, e.g. "From $99"'),
          }),
        )
        .min(1)
        .max(8),
    })
    .optional()
    .describe('Content for the dedicated Services page'),
  aboutPage: z
    .object({
      story: z.string().describe('2-3 sentences telling the business origin story'),
      mission: z.string().describe('1-2 sentence mission statement'),
    })
    .optional()
    .describe('Extended content for the dedicated About page'),
  contactPage: z
    .object({
      address: z.string().optional().describe('Street address if applicable'),
      phone: z.string().optional().describe('Phone number if applicable'),
      hours: z.string().optional().describe('Business hours, e.g. "Mon–Fri 9am–5pm"'),
    })
    .optional()
    .describe('Contact details for the Contact page'),
  howItWorks: z
    .array(
      z.object({
        title: z.string().describe('Step title, e.g. "Initial Consultation"'),
        description: z.string().describe('Short description of what happens in this step'),
      }),
    )
    .min(3)
    .max(4)
    .optional()
    .describe('3-4 steps explaining how the service works'),
  trustBadges: z
    .array(
      z.object({
        icon: z.string().describe('A single relevant emoji'),
        label: z.string().describe('Badge label, e.g. "5-Star Rated"'),
      }),
    )
    .min(2)
    .max(4)
    .optional()
    .describe('Trust badges for social proof'),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .describe('Dominant brand hex color, e.g. #2563eb. Must be vivid enough to pass 3:1 contrast.'),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .describe('Secondary accent hex color that complements the primary'),
  backgroundColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .describe('Optional background color for the site, defaults to #ffffff'),
  softBackgroundColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .describe('Optional soft background color for sections, defaults to #f9fafb'),
  contactEmail: z.string().email().optional().describe('Contact email if derivable from requirements'),
  theme: z.enum(['classic', 'cinematic']).default('classic').describe('The visual theme for the site'),
  pricing: z
    .object({
      title: z.string().describe('Section title, e.g. "Simple Pricing"'),
      description: z.string().describe('One sentence subtitle'),
      tiers: z.array(
        z.object({
          name: z.string().describe('Tier name, e.g. "Basic"'),
          price: z.string().describe('Price string, e.g. "$99"'),
          features: z.array(z.string()).describe('List of features included'),
          featured: z.boolean().optional().describe('True if this tier should be highlighted'),
        }),
      ),
    })
    .optional()
    .describe('Structured pricing tiers'),
  faq: z
    .array(
      z.object({
        question: z.string().describe('The question text'),
        answer: z.string().describe('The answer text'),
      }),
    )
    .optional()
    .describe('Frequently asked questions'),
});

export type SiteContent = z.infer<typeof SiteContentSchema>;

// ─── Generator ────────────────────────────────────────────────────────────────

/**
 * Generate structured landing page content from a customer's requirements.
 * Routes through Vercel AI Gateway — no provider API key needed.
 * Auth via OIDC (VERCEL_OIDC_TOKEN) or AI_GATEWAY_API_KEY env var.
 */
export async function generateSiteContent(
  requirements: OrderRequirements,
): Promise<SiteContent> {
  const prompt = buildPrompt(requirements);

  const { text } = await generateText({
    model: 'anthropic/claude-sonnet-4.6',
    prompt,
    system: SYSTEM_PROMPT,
    maxOutputTokens: 1500,
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
  parts.push(`Return a single valid JSON object with exactly these fields:
{
  "businessName": string — short business name used in the logo and title,
  "tagline": string — one-line tagline under the business name,
  "headline": string — punchy hero headline, max 10 words, benefit-led,
  "subheadline": string — 1-2 sentences expanding the headline,
  "ctaText": string — call-to-action button label (e.g. "Book a Call"),
  "features": [
    { "icon": string (single emoji), "title": string (2-4 words), "description": string (1 sentence) },
    ... (3 to 6 items)
  ],
  "about": string — 2-3 sentence paragraph for the About Us section,
  "servicesPage": {
    "intro": string — one sentence intro for the services page,
    "items": [
      { "icon": string, "title": string (2-5 words), "description": string (1 sentence), "price"?: string (optional, e.g. "From $99") },
      ... (1 to 8 services)
    ]
  },
  "aboutPage": {
    "story": string — 2-3 sentences telling the business origin story,
    "mission": string — 1-2 sentence mission statement
  },
  "contactPage": {
    "address"?: string — street address if known,
    "phone"?: string — phone number if known,
    "hours"?: string — business hours if known (e.g. "Mon–Fri 9am–5pm")
  },
  "howItWorks": [
    { "title": string, "description": string },
    ... (3 to 4 steps)
  ],
  "trustBadges": [
    { "icon": string (emoji), "label": string },
    ... (2 to 4 badges)
  ],
  "primaryColor": string — dominant brand hex color (e.g. "#2563eb"), vivid enough for 3:1 contrast,
  "accentColor": string — secondary accent hex color that complements the primary,
  "contactEmail": string (optional) — contact email if derivable from the requirements,
  "theme": "classic" | "cinematic" — select "cinematic" if the style preference is "luxury", "modern", "dark", or "premium". Use "classic" for traditional, professional, or reliable vibes,
  "pricing": {
    "title": string,
    "description": string,
    "tiers": [
      { "name": string, "price": string, "features": string[], "featured"?: boolean },
      ... (1 to 3 tiers)
    ]
  },
  "faq": [
    { "question": string, "answer": string },
    ... (3 to 6 items)
  ]
}`);

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

  const styleLower = (req.style || '').toLowerCase();
  const theme = (raw.theme === 'cinematic' || styleLower.includes('luxury') || styleLower.includes('premium')) ? 'cinematic' : 'classic';

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
    howItWorks: Array.isArray(raw.howItWorks)
      ? (raw.howItWorks as SiteContent['howItWorks'])
      : [
          { title: 'Book a Call', description: 'Schedule a time that works for you.' },
          { title: 'Get a Plan', description: 'We create a custom strategy for your needs.' },
          { title: 'See Results', description: 'Watch your business grow with our help.' },
        ],
    trustBadges: Array.isArray(raw.trustBadges)
      ? (raw.trustBadges as SiteContent['trustBadges'])
      : [
          { icon: '⭐', label: '5-Star Service' },
          { icon: '✅', label: 'Verified Quality' },
        ],
    primaryColor:
      typeof raw.primaryColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.primaryColor)
        ? raw.primaryColor
        : '#2563eb',
    accentColor:
      typeof raw.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.accentColor)
        ? raw.accentColor
        : '#7c3aed',
    backgroundColor:
      typeof raw.backgroundColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.backgroundColor)
        ? (raw.backgroundColor as string)
        : undefined,
    softBackgroundColor:
      typeof raw.softBackgroundColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.softBackgroundColor)
        ? (raw.softBackgroundColor as string)
        : undefined,
    contactEmail:
      typeof raw.contactEmail === 'string' && raw.contactEmail.includes('@')
        ? raw.contactEmail
        : undefined,
    theme,
  };
}


const defaultFeatures: SiteContent['features'] = [
  { icon: '⚡', title: 'Fast & Reliable', description: 'Built for speed and dependability.' },
  { icon: '🎯', title: 'Results Focused', description: 'We deliver measurable outcomes.' },
  { icon: '🤝', title: 'Personal Service', description: 'A dedicated team behind every project.' },
];
