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
      </body>
    </html>
  );
}
