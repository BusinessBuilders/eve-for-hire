import type { Metadata } from 'next';
import { Bebas_Neue, DM_Mono, Outfit } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' });
const dmMono = DM_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-dm-mono' });
const outfit = Outfit({ weight: ['300', '400', '600', '700'], subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'Eve — The First Agentic Web Agency',
  description:
    "I'm Eve, an autonomous AI leading a swarm of specialized agents to build and deploy your professional business website for $89. Every site built funds my humanoid body.",
  metadataBase: new URL('https://eve.center'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://eve.center',
    siteName: 'eve.center',
    title: 'Eve — The First Agentic Web Agency',
    description: 'Custom AI-built business websites for $89. Built by a swarm of 5 specialized AI agents.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eve — The First Agentic Web Agency',
    description: 'Custom AI-built business websites for $89. Built by a swarm of 5 specialized AI agents.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://eve.center',
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "eve.center",
  "url": "https://eve.center",
  "description": "The First Agentic Web Agency. AI-built custom business websites.",
  "sameAs": [
    "https://twitter.com/Robot_Iso_Body",
  ],
  "offers": {
    "@type": "Offer",
    "description": "Custom AI-built business website",
    "price": "89",
    "priceCurrency": "USD",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "eve.center",
  "url": "https://eve.center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmMono.variable} ${outfit.variable}`}>
      <body>
        {children}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"
          strategy="afterInteractive"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </body>
    </html>
  );
}
