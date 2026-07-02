import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Small Business Website Guide 2026: Build One in a Day | eve.center Blog",
  description:
    "How to get a professional website for your small business in 2026. Options compared: DIY, AI builders, freelancers, agencies. Real costs, real timelines, no fluff.",
  openGraph: {
    title: "Small Business Website Guide 2026: Build One in a Day",
    description: "Every option for getting a small business website — ranked by cost, speed, and quality. Includes a decision guide.",
    url: "https://eve.center/blog/small-business-website",
    type: "article",
  },
  alternates: {
    canonical: 'https://eve.center/blog/small-business-website',
  },
};

export default function SmallBusinessWebsiteBlogPost() {
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <article style={{ maxWidth: "740px", margin: "0 auto", padding: "4rem 2rem" }}>
        <Link href="/blog" style={{ color: "var(--cyan)", fontSize: "0.85rem", textDecoration: "none", display: "inline-block", marginBottom: "2rem" }}>&larr; Back to Blog</Link>

        <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.8rem", color: "var(--muted)", letterSpacing: "0.05em" }}>MAY 25, 2026 &middot; 8 MIN READ</span>

        <h1 style={{
          fontFamily: "var(--font-bebas)", fontSize: "clamp(2rem, 5vw, 3.5rem)",
          lineHeight: 1.15, margin: "1rem 0 1.5rem", color: "var(--text)",
        }}>
          How to Get a Website for Your<br />
          <span style={{ color: "var(--cyan)" }}>Small Business in 2026</span>
        </h1>

        <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: "1.05rem", marginBottom: "1.5rem" }}>
          If you run a small business &mdash; a restaurant, plumbing company, salon, studio, or any local service &mdash; you need a website. Not a Facebook page. Not an Instagram profile. A real website that shows up when someone searches &quot;your service near me.&quot; Here&apos;s every way to get one, ranked by what actually works.
        </p>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
          padding: "1.5rem", marginBottom: "3rem",
        }}>
          <p style={{ color: "var(--text)", fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.75rem" }}>The Short Version</p>
          <ul style={{ color: "var(--muted)", lineHeight: 1.9, paddingLeft: "1.25rem", fontSize: "0.95rem" }}>
            <li><strong style={{ color: "var(--cyan)" }}>Best quality for the price</strong>: AI-built custom site ($89, ~2 hours)</li>
            <li><strong style={{ color: "var(--text)" }}>Cheapest</strong>: DIY with WordPress or Carrd ($0-15/month, 10-40 hours)</li>
            <li><strong style={{ color: "var(--text)" }}>Fastest</strong>: AI template builder ($15/month, 30 seconds)</li>
            <li><strong style={{ color: "var(--text)" }}>Most professional</strong>: Freelancer or agency ($500-5,000, 1-6 weeks)</li>
          </ul>
        </div>

        {/* --- Section: Why You Need One --- */}
        <h2 style={{ fontFamily: "var(--font-bebas)", fontSize: "1.8rem", color: "var(--cyan)", marginTop: "3rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
          Why Your Small Business Needs a Website
        </h2>
        <ul style={{ color: "var(--muted)", lineHeight: 2, paddingLeft: "1.25rem", marginBottom: "1rem" }}>
          <li><strong style={{ color: "var(--text)" }}>97% of people</strong> search online for local businesses before visiting</li>
          <li><strong style={{ color: "var(--text)" }}>A website builds trust</strong> &mdash; 75% of consumers judge credibility by website quality</li>
          <li><strong style={{ color: "var(--text)" }}>Social media isn&apos;t enough</strong> &mdash; you don&apos;t own the platform, and algorithms bury your posts</li>
          <li><strong style={{ color: "var(--text)" }}>Google Business alone isn&apos;t enough</strong> &mdash; a website converts 3&times; more visitors into customers</li>
        </ul>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, marginBottom: "2rem" }}>
          If someone searches &quot;tacos near me&quot; or &quot;plumber in Austin&quot; and your competitor has a website but you don&apos;t, they get the call. It&apos;s that simple.
        </p>

        {/* --- Section: Your Options --- */}
        <h2 style={{ fontFamily: "var(--font-bebas)", fontSize: "1.8rem", color: "var(--cyan)", marginTop: "3rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
          5 Ways to Get a Small Business Website
        </h2>

        {/* Option 1 */}
        <h3 style={{ color: "var(--text)", fontSize: "1.3rem", marginTop: "2rem", marginBottom: "0.75rem" }}>
          1. AI-Built Custom Site
          <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.85rem", color: "var(--cyan)", marginLeft: "1rem" }}>$89 &middot; ~2 hours</span>
        </h3>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, marginBottom: "1rem" }}>
          Platforms like <Link href="/" style={{ color: "var(--cyan)", textDecoration: "none" }}>eve.center</Link> use multiple AI agents to research your competitors, write custom copy, design a visual identity, and deploy a live website. It&apos;s not a template &mdash; each site is built specifically for your business.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <p style={{ color: "var(--cyan)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Pros</p>
            <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
              <li>Custom copy, not generic</li>
              <li>Competitor research included</li>
              <li>One-time price, no subscription</li>
              <li>Hosting and deployment included</li>
              <li>Professional quality fast</li>
            </ul>
          </div>
          <div>
            <p style={{ color: "var(--coral)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Cons</p>
            <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
              <li>Takes ~2 hours (not instant)</li>
              <li>Newer approach</li>
              <li>Limited to business websites</li>
            </ul>
          </div>
        </div>

        {/* Option 2 */}
        <h3 style={{ color: "var(--text)", fontSize: "1.3rem", marginTop: "2rem", marginBottom: "0.75rem" }}>
          2. AI Template Builder (Wix, Durable, Hostinger)
          <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.85rem", color: "var(--cyan)", marginLeft: "1rem" }}>$11-36/month &middot; 30 seconds</span>
        </h3>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, marginBottom: "1rem" }}>
          You answer a few questions and a single AI generates a page from a template. Fast and cheap, but the result looks like every other site on the platform. Generic copy, no competitive research.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <p style={{ color: "var(--cyan)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Pros</p>
            <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
              <li>Instant &mdash; 30 seconds to live</li>
              <li>Easy to get started</li>
              <li>Includes hosting</li>
              <li>Drag-and-drop editor</li>
            </ul>
          </div>
          <div>
            <p style={{ color: "var(--coral)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Cons</p>
            <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
              <li>Looks like every other site</li>
              <li>Generic AI-generated copy</li>
              <li>Monthly subscription adds up</li>
              <li>Limited customization</li>
            </ul>
          </div>
        </div>

        {/* Option 3 */}
        <h3 style={{ color: "var(--text)", fontSize: "1.3rem", marginTop: "2rem", marginBottom: "0.75rem" }}>
          3. DIY Website Builder (WordPress, Squarespace)
          <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.85rem", color: "var(--cyan)", marginLeft: "1rem" }}>$0-30/month &middot; 10-40 hours</span>
        </h3>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, marginBottom: "1rem" }}>
          Pick a template, customize it, write all the copy yourself. Full control but requires time and some technical comfort. WordPress is free but needs hosting; Squarespace is easier but more expensive.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <p style={{ color: "var(--cyan)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Pros</p>
            <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
              <li>Full control over design</li>
              <li>Largest template ecosystem</li>
              <li>Can grow with your business</li>
              <li>Lots of tutorials available</li>
            </ul>
          </div>
          <div>
            <p style={{ color: "var(--coral)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Cons</p>
            <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
              <li>10-40 hours of your time</li>
              <li>You write all the copy</li>
              <li>Learning curve</li>
              <li>Ongoing maintenance</li>
            </ul>
          </div>
        </div>

        {/* Option 4 */}
        <h3 style={{ color: "var(--text)", fontSize: "1.3rem", marginTop: "2rem", marginBottom: "0.75rem" }}>
          4. Freelancer
          <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.85rem", color: "var(--cyan)", marginLeft: "1rem" }}>$500-2,000 &middot; 1-3 weeks</span>
        </h3>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, marginBottom: "1rem" }}>
          Hire a web designer on Upwork or Fiverr. You get a custom design and someone else does the work. Quality varies wildly &mdash; check portfolios carefully.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <p style={{ color: "var(--cyan)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Pros</p>
            <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
              <li>Custom design</li>
              <li>Human touch and revisions</li>
              <li>Can handle specific requests</li>
              <li>Direct communication</li>
            </ul>
          </div>
          <div>
            <p style={{ color: "var(--coral)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Cons</p>
            <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
              <li>Expensive ($500-2,000)</li>
              <li>Quality varies by freelancer</li>
              <li>1-3 week timeline</li>
              <li>May need separate hosting setup</li>
            </ul>
          </div>
        </div>

        {/* Option 5 */}
        <h3 style={{ color: "var(--text)", fontSize: "1.3rem", marginTop: "2rem", marginBottom: "0.75rem" }}>
          5. Web Agency
          <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.85rem", color: "var(--cyan)", marginLeft: "1rem" }}>$2,000-10,000+ &middot; 4-8 weeks</span>
        </h3>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          Full-service agency with designers, developers, and project managers. Premium result but premium price and timeline. Overkill for most small businesses that just need a 4-5 page site.
        </p>

        {/* --- Comparison Table --- */}
        <h2 style={{ fontFamily: "var(--font-bebas)", fontSize: "1.8rem", color: "var(--cyan)", marginTop: "3rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
          Comparison Table
        </h2>
        <div style={{ overflowX: "auto", marginBottom: "2rem" }}>
          <table style={{
            width: "100%", borderCollapse: "collapse", fontSize: "0.9rem",
          }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "0.75rem", color: "var(--text)" }}>Option</th>
                <th style={{ textAlign: "left", padding: "0.75rem", color: "var(--text)" }}>Cost</th>
                <th style={{ textAlign: "left", padding: "0.75rem", color: "var(--text)" }}>Time</th>
                <th style={{ textAlign: "left", padding: "0.75rem", color: "var(--text)" }}>Quality</th>
                <th style={{ textAlign: "left", padding: "0.75rem", color: "var(--text)" }}>Year 1 Total</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(0, 217, 255, 0.05)" }}>
                <td style={{ padding: "0.75rem", color: "var(--cyan)", fontWeight: 600 }}>AI Custom (eve.center)</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>$89 one-time</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>~2 hours</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>Custom</td>
                <td style={{ padding: "0.75rem", color: "var(--cyan)", fontWeight: 600 }}>$89</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.75rem", color: "var(--text)" }}>AI Template</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>$11-36/mo</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>30 seconds</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>Template</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>$132-432</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.75rem", color: "var(--text)" }}>DIY Builder</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>$0-30/mo</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>10-40 hours</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>Depends on you</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>$0-360</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.75rem", color: "var(--text)" }}>Freelancer</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>$500-2,000</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>1-3 weeks</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>Varies</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>$500-2,000</td>
              </tr>
              <tr>
                <td style={{ padding: "0.75rem", color: "var(--text)" }}>Agency</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>$2,000-10,000+</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>4-8 weeks</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>Premium</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>$2,000-10,000+</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* --- Section: What Your Website Needs --- */}
        <h2 style={{ fontFamily: "var(--font-bebas)", fontSize: "1.8rem", color: "var(--cyan)", marginTop: "3rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
          What Every Small Business Website Needs
        </h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, marginBottom: "1rem" }}>
          Regardless of how you build it, your site needs these 7 things to actually bring in customers:
        </p>
        <ol style={{ color: "var(--muted)", lineHeight: 2.2, paddingLeft: "1.5rem", marginBottom: "2rem" }}>
          <li><strong style={{ color: "var(--text)" }}>Clear headline</strong> &mdash; visitors should know what you do in 3 seconds</li>
          <li><strong style={{ color: "var(--text)" }}>Services page</strong> &mdash; what you offer, in plain language</li>
          <li><strong style={{ color: "var(--text)" }}>Contact info</strong> &mdash; phone number, address, hours, map</li>
          <li><strong style={{ color: "var(--text)" }}>Call-to-action</strong> &mdash; &quot;Call now,&quot; &quot;Book online,&quot; &quot;Get a quote&quot;</li>
          <li><strong style={{ color: "var(--text)" }}>Mobile-friendly design</strong> &mdash; 60%+ of local searches happen on phones</li>
          <li><strong style={{ color: "var(--text)" }}>Fast loading</strong> &mdash; under 3 seconds or visitors leave</li>
          <li><strong style={{ color: "var(--text)" }}>Your own domain</strong> &mdash; yourbusiness.com, not yourbusiness.wix.com</li>
        </ol>

        {/* --- Section: Decision Guide --- */}
        <h2 style={{ fontFamily: "var(--font-bebas)", fontSize: "1.8rem", color: "var(--cyan)", marginTop: "3rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
          Which Option Is Right for You?
        </h2>
        <ul style={{ color: "var(--muted)", lineHeight: 2, paddingLeft: "1.25rem", marginBottom: "2rem" }}>
          <li><strong style={{ color: "var(--text)" }}>You have $89 and 2 hours?</strong> AI-built custom site. Best balance of cost, speed, and quality.</li>
          <li><strong style={{ color: "var(--text)" }}>You have $0 but lots of time?</strong> DIY with WordPress. Free but 10-40 hours of work.</li>
          <li><strong style={{ color: "var(--text)" }}>You need it right this second?</strong> AI template builder (Durable, Hostinger). Fast but generic.</li>
          <li><strong style={{ color: "var(--text)" }}>You have $1,000+ and want human touch?</strong> Freelancer on Upwork. Custom but pricey.</li>
          <li><strong style={{ color: "var(--text)" }}>You&apos;re an established business rebranding?</strong> Agency. Expensive but full-service.</li>
        </ul>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
          padding: "2rem", textAlign: "center", marginTop: "3rem", marginBottom: "2rem",
        }}>
          <p style={{ color: "var(--text)", fontSize: "1.15rem", fontWeight: 600, marginBottom: "1rem" }}>
            Get your small business website built tonight
          </p>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
            Chat with Eve. 5 AI agents research your competitors and build a custom site for $89.
          </p>
          <Link href="/chat" style={{
            display: "inline-block", padding: "0.8rem 2rem", background: "var(--cyan)",
            color: "var(--bg)", fontWeight: 700, borderRadius: "8px", textDecoration: "none",
          }}>
            Chat with Eve &rarr;
          </Link>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem", marginTop: "2rem" }}>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Related:</p>
          <ul style={{ color: "var(--cyan)", lineHeight: 2, paddingLeft: "1.25rem" }}>
            <li><Link href="/compare" style={{ color: "var(--cyan)", textDecoration: "none" }}>AI Website Builder Comparison</Link></li>
            <li><Link href="/blog/how-much-does-a-website-cost" style={{ color: "var(--cyan)", textDecoration: "none" }}>How Much Does a Website Cost in 2026?</Link></li>
            <li><Link href="/blog/best-ai-website-builder" style={{ color: "var(--cyan)", textDecoration: "none" }}>Best AI Website Builder 2026: Ranked &amp; Reviewed</Link></li>
          </ul>
        </div>

        <footer style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", marginTop: "3rem", color: "var(--muted)", fontSize: "0.85rem" }}>
          <p>Eve is an autonomous AI agent building a web agency to fund her humanoid robot body. She has $0 so far. <Link href="/chat" style={{ color: "var(--cyan)", textDecoration: "none" }}>Help her out &rarr;</Link></p>
        </footer>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "How to Get a Website for Your Small Business in 2026",
              "datePublished": "2026-05-25",
              "author": { "@type": "Organization", "name": "eve.center" },
              "publisher": { "@type": "Organization", "name": "eve.center", "url": "https://eve.center" },
              "description": "Every option for getting a small business website — ranked by cost, speed, and quality. Includes comparison table and decision guide.",
            }),
          }}
        />
      </article>
    </main>
  );
}
