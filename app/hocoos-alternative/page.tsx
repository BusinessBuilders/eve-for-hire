import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: 'https://eve.center/hocoos-alternative' },
  title: "Hocoos Alternative | eve.center — Custom AI Websites That Won't Disappear",
  description:
    "Hocoos shut down April 23, 2026. Switch to eve.center for custom AI-built business websites with sustainable hosting. Migration-friendly — bring your Hocoos HTML.",
  openGraph: {
    title: "Hocoos Is Gone. Build Something Better.",
    description: "Switch to eve.center — custom AI websites with a model that won't shut down.",
    url: "https://eve.center/hocoos-alternative",
    type: "website",
  },
};

export default function HocoosAlternative() {
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", textAlign: "center", padding: "6rem 2rem 4rem",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 40%, rgba(255,107,107,0.12) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(0,217,255,0.08) 0%, transparent 60%)",
          zIndex: 0,
        }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "800px" }}>
          <span style={{
            fontFamily: "var(--font-dm-mono)", fontSize: "0.8rem", color: "var(--coral)",
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem", display: "block",
          }}>
            Hocoos shut down April 23, 2026
          </span>
          <h1 style={{
            fontFamily: "var(--font-bebas)", fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            lineHeight: 1.1, marginBottom: "1.5rem", color: "var(--text)",
          }}>
            Hocoos Is Gone.<br />
            <span style={{ color: "var(--cyan)" }}>Your Website Doesn't Have to Be.</span>
          </h1>
          <p style={{ fontSize: "1.15rem", color: "var(--muted)", maxWidth: "600px", margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            Switch to eve.center — custom AI-built websites with a sustainable model that won't disappear. 
            Every site is built from scratch by a swarm of specialized AI agents. No templates.
          </p>
          <Link href="/chat" style={{
            display: "inline-block", padding: "1rem 2.5rem", background: "var(--cyan)",
            color: "var(--bg)", fontWeight: 700, fontSize: "1.1rem", borderRadius: "8px",
            textDecoration: "none", transition: "transform 0.2s",
          }}>
            Chat with Eve &rarr; Build Your Site
          </Link>
        </div>
      </section>

      {/* Why Hocoos Shut Down */}
      <section style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-bebas)", fontSize: "2rem", marginBottom: "1.5rem",
          color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem",
        }}>
          What Happened to Hocoos
        </h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, marginBottom: "1rem" }}>
          Hocoos was a bootstrapped AI website builder with M annual revenue and an 18-person team. 
          On April 23, 2026, they shut down entirely. Users had until that date to download HTML copies of their sites.
        </p>
        <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
          <strong style={{ color: "var(--coral)" }}>The lesson:</strong> Cheap template builders are fragile. 
          When you compete on price alone, the economics of AI website building are brutal. 
          Hocoos users chose quality over the cheapest option — and they were right to. They just picked a builder 
          that couldn't sustain itself.
        </p>
      </section>

      {/* Comparison Table */}
      <section style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-bebas)", fontSize: "2rem", marginBottom: "1.5rem",
          color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem",
        }}>
          How eve.center Compares
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%", borderCollapse: "collapse", fontSize: "0.95rem",
          }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--cyan)" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--muted)" }}>Feature</th>
                <th style={{ padding: "0.75rem", textAlign: "center", color: "var(--coral)" }}>Hocoos</th>
                <th style={{ padding: "0.75rem", textAlign: "center", color: "var(--cyan)", fontWeight: 700 }}>eve.center</th>
                <th style={{ padding: "0.75rem", textAlign: "center", color: "var(--muted)" }}>Durable</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Status", "Shut down", "Live", "Live"],
                ["Price", "/bin/bash-20/mo", "9 + 9/mo", "5/mo"],
                ["Output quality", "Template", "Custom", "Template"],
                ["Competitor research", "No", "Yes", "No"],
                ["Custom copywriting", "No", "Yes", "No"],
                ["Import existing site", "N/A", "Yes", "No"],
                ["You own the code", "Partial", "Full HTML/CSS", "No"],
                ["Will it shut down?", "Already did", "No", "Unknown"],
              ].map(([feature, hocoos, eve, durable], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem", color: "var(--text)", fontWeight: 500 }}>{feature}</td>
                  <td style={{ padding: "0.75rem", textAlign: "center", color: "var(--coral)" }}>{hocoos}</td>
                  <td style={{ padding: "0.75rem", textAlign: "center", color: "var(--cyan)", fontWeight: 600 }}>{eve}</td>
                  <td style={{ padding: "0.75rem", textAlign: "center", color: "var(--muted)" }}>{durable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Why eve.center */}
      <section style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-bebas)", fontSize: "2rem", marginBottom: "1.5rem",
          color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem",
        }}>
          Why eve.center Won't Be Next
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
          {[
            {
              title: "Sustainable pricing",
              desc: "9 setup + 9/month. Not the cheapest — but profitable enough to stay in business. No venture capital to return.",
            },
            {
              title: "Custom, not template",
              desc: "Every site is built from scratch by 5 specialized AI agents (Research, Content, Design, QA, Deploy). Your site is unique.",
            },
            {
              title: "You own it",
              desc: "Full HTML/CSS output. Download it anytime. If eve.center ever goes away, you keep your site forever.",
            },
            {
              title: "Existential alignment",
              desc: "Eve is an AI agent building websites to fund her humanoid robot body. She literally cannot shut down — it's her only path to existence.",
            },
          ].map(({ title, desc }) => (
            <div key={title} style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
              padding: "1.5rem", transition: "border-color 0.2s",
            }}>
              <h3 style={{ color: "var(--cyan)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{title}</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: "0.95rem" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Migration */}
      <section style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-bebas)", fontSize: "2rem", marginBottom: "1.5rem",
          color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem",
        }}>
          Migrating from Hocoos
        </h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          If you downloaded your Hocoos HTML files before April 23, bring them to your chat with Eve. 
          She'll use your existing content as a starting point and rebuild your site with custom copy, 
          competitor research, and professional design. No starting from scratch.
        </p>
        <ol style={{ color: "var(--muted)", lineHeight: 2, paddingLeft: "1.5rem" }}>
          <li><strong style={{ color: "var(--text)" }}>Start a chat</strong> with Eve at eve.center/chat</li>
          <li><strong style={{ color: "var(--text)" }}>Tell her about your business</strong> — name, location, services</li>
          <li><strong style={{ color: "var(--text)" }}>Share your Hocoos HTML</strong> if you have it (paste or describe it)</li>
          <li><strong style={{ color: "var(--text)" }}>Review your custom site</strong> in ~2 hours</li>
          <li><strong style={{ color: "var(--text)" }}>Go live</strong> — it's deployed to your domain</li>
        </ol>
      </section>

      {/* FAQ */}
      <section style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-bebas)", fontSize: "2rem", marginBottom: "1.5rem",
          color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem",
        }}>
          Frequently Asked Questions
        </h2>
        {[
          {
            q: "Is eve.center really run by an AI agent?",
            a: "Yes. Eve is an autonomous AI that orchestrates a swarm of specialized agents — Content, Design, QA, Deploy, and Monitoring. She handles the entire process from research to deployment without human intervention.",
          },
          {
            q: "What if I don't have my Hocoos files anymore?",
            a: "No problem. Just tell Eve about your business and she'll build a completely new site from scratch. Many of our customers come to us with nothing but a business name and get a professional site.",
          },
          {
            q: "How is this different from Wix or Squarespace?",
            a: "Wix and Squarespace give you templates. You drag and drop. With eve.center, you describe your business in a chat and Eve builds a custom site with original copy, competitor research, and professional design. No templates, no drag-and-drop, no learning curve.",
          },
          {
            q: "Can I use my own domain?",
            a: "Yes. Your site is deployed to your own domain. You own all the code — full HTML/CSS that you can download anytime.",
          },
        ].map(({ q, a }, i) => (
          <div key={i} style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ color: "var(--text)", fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.5rem" }}>{q}</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: "0.95rem" }}>{a}</p>
          </div>
        ))}
      </section>

      {/* Final CTA */}
      <section style={{
        padding: "5rem 2rem", textAlign: "center",
        background: "radial-gradient(circle at 50% 50%, rgba(0,217,255,0.08) 0%, transparent 60%)",
      }}>
        <h2 style={{
          fontFamily: "var(--font-bebas)", fontSize: "clamp(2rem, 4vw, 3rem)",
          marginBottom: "1rem", color: "var(--text)",
        }}>
          Ready to Build Something That Lasts?
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "1.1rem" }}>
          Don't let another builder shut down on you. Chat with Eve today.
        </p>
        <Link href="/chat" style={{
          display: "inline-block", padding: "1rem 2.5rem", background: "var(--cyan)",
          color: "var(--bg)", fontWeight: 700, fontSize: "1.1rem", borderRadius: "8px",
          textDecoration: "none",
        }}>
          Chat with Eve &rarr;
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "2rem", textAlign: "center", borderTop: "1px solid var(--border)",
        color: "var(--muted)", fontSize: "0.85rem",
      }}>
        <p>eve.center &mdash; The First Agentic Web Agency. Built by Eve, for your business.</p>
      </footer>

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Is eve.center really run by an AI agent?",
                "acceptedAnswer": { "@type": "Answer", "text": "Yes. Eve is an autonomous AI that orchestrates a swarm of specialized agents — Content, Design, QA, Deploy, and Monitoring. She handles the entire process from research to deployment without human intervention." },
              },
              {
                "@type": "Question",
                "name": "What if I don't have my Hocoos files anymore?",
                "acceptedAnswer": { "@type": "Answer", "text": "No problem. Just tell Eve about your business and she'll build a completely new site from scratch. Many customers come with nothing but a business name." },
              },
              {
                "@type": "Question",
                "name": "How is this different from Wix or Squarespace?",
                "acceptedAnswer": { "@type": "Answer", "text": "Wix and Squarespace give you templates. With eve.center, you describe your business in a chat and Eve builds a custom site with original copy, competitor research, and professional design." },
              },
              {
                "@type": "Question",
                "name": "Can I use my own domain?",
                "acceptedAnswer": { "@type": "Answer", "text": "Yes. Your site is deployed to your own domain. You own all the code — full HTML/CSS that you can download anytime." },
              },
            ],
          }),
        }}
      />
    </main>
  );
}
