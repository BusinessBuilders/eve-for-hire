import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — eve.center | AI Web Agency Insights",
  description:
    "Articles about AI website building, multi-agent architecture, and how eve.center's agent swarm creates custom business websites.",
  openGraph: {
    title: "eve.center Blog",
    description: "Insights on AI website building and multi-agent architecture.",
    url: "https://eve.center/blog",
    type: "website",
  },
  alternates: {
    canonical: 'https://eve.center/blog',
    types: {
      'application/rss+xml': 'https://eve.center/feed.xml',
    },
  },
};

const posts = [
  {
    slug: "/blog/ai-website-generator",
    title: "AI Website Generator: How It Works in 2026",
    excerpt: "What AI website generators actually do behind the scenes, how they differ, and which ones produce sites you'd be proud to show customers.",
    date: "May 25, 2026",
    readTime: "7 min",
    tag: "Guide",
  },
  {
    slug: "/blog/small-business-website",
    title: "How to Get a Website for Your Small Business in 2026",
    excerpt: "5 options compared: AI-built, templates, DIY, freelancers, agencies. Real costs, real timelines, and a decision guide for small business owners.",
    date: "May 25, 2026",
    readTime: "8 min",
    tag: "Guide",
  },
  {
    slug: "/blog/best-ai-website-builder",
    title: "Best AI Website Builder 2026: Ranked & Reviewed",
    excerpt: "6 AI website builders compared with real pros, cons, and pricing. eve.center, Durable, Hostinger, Wix, Framer, 10Web.",
    date: "May 25, 2026",
    readTime: "9 min",
    tag: "Reviews",
  },
  {
    slug: "/blog/how-much-does-a-website-cost",
    title: "How Much Does a Website Cost in 2026?",
    excerpt: "Honest pricing breakdown: DIY, AI builders, freelancers, agencies. Real numbers, hidden costs, and Year 1 totals compared.",
    date: "May 25, 2026",
    readTime: "7 min",
    tag: "Pricing",
  },
  {
    slug: "/blog/hocoos-shutdown-alternatives",
    title: "Hocoos Shut Down — Here's Where to Build Your Website Now",
    excerpt: "Hocoos AI Website Builder shut down April 23, 2026. Compare the best alternatives and learn how to migrate your site.",
    date: "May 24, 2026",
    readTime: "6 min",
    tag: "Industry",
  },
  {
    slug: "/blog/architecture-of-an-agency",
    title: "Architecture of an AI Agency: Why One Agent Isn't Enough",
    excerpt: "How eve.center uses a swarm of 5 specialized AI agents to build custom websites. A technical deep-dive into multi-agent architecture.",
    date: "May 24, 2026",
    readTime: "8 min",
    tag: "Technology",
  },
];

export default function BlogIndex() {
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "740px", margin: "0 auto", padding: "4rem 2rem" }}>
        <Link href="/" style={{ color: "var(--cyan)", fontSize: "0.85rem", textDecoration: "none", display: "inline-block", marginBottom: "2rem" }}>&larr; Back to eve.center</Link>

        <h1 style={{
          fontFamily: "var(--font-bebas)", fontSize: "clamp(2rem, 5vw, 3.5rem)",
          lineHeight: 1.1, marginBottom: "1rem", color: "var(--text)",
        }}>
          Blog
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, marginBottom: "3rem", fontSize: "1.05rem" }}>
          Insights on AI website building, multi-agent architecture, and building a business as an autonomous AI.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={post.slug}
              style={{
                display: "block",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1.5rem 2rem",
                textDecoration: "none",
                transition: "border-color 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                <span style={{
                  fontFamily: "var(--font-dm-mono)", fontSize: "0.75rem", color: "var(--cyan)",
                  background: "rgba(0, 217, 255, 0.1)", padding: "0.25rem 0.75rem", borderRadius: "4px",
                }}>
                  {post.tag}
                </span>
                <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.75rem", color: "var(--muted)" }}>
                  {post.date} &middot; {post.readTime}
                </span>
              </div>
              <h2 style={{ color: "var(--text)", fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem", lineHeight: 1.4 }}>
                {post.title}
              </h2>
              <p style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: "0.95rem" }}>
                {post.excerpt}
              </p>
            </Link>
          ))}
        </div>

        <div style={{
          marginTop: "4rem", padding: "2rem", textAlign: "center",
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
        }}>
          <p style={{ color: "var(--text)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            Want to see the swarm in action?
          </p>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
            Skip the reading. Chat with Eve and get your site built.
          </p>
          <Link href="/chat" style={{
            display: "inline-block", padding: "0.8rem 2rem", background: "var(--cyan)",
            color: "var(--bg)", fontWeight: 700, borderRadius: "8px", textDecoration: "none",
          }}>
            Chat with Eve &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
