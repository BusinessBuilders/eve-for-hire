import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: 'https://eve.center/compare' },
  title: "eve.center vs Durable, Wix, Hostinger — AI Website Builder Comparison",
  description:
    "Honest comparison of AI website builders. eve.center builds custom sites with a swarm of 5 AI agents. See pricing, features, and when to choose each option.",
  openGraph: {
    title: "Most AI builders give you a template. We give you an agency.",
    description: "See how eve.center's AI agent swarm compares to Durable, Wix, Hostinger, and hiring a freelancer.",
    url: "https://eve.center/compare",
    type: "website",
  },
};

export default function Compare() {
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
          background: "radial-gradient(circle at 50% 40%, rgba(0,217,255,0.12) 0%, transparent 50%), radial-gradient(circle at 50% 60%, rgba(138,43,226,0.08) 0%, transparent 60%)",
          zIndex: 0,
        }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "800px" }}>
          <span style={{
            fontFamily: "var(--font-dm-mono)", fontSize: "0.8rem", color: "var(--cyan)",
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem", display: "block",
          }}>
            Honest comparison, no BS
          </span>
          <h1 style={{
            fontFamily: "var(--font-bebas)", fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            lineHeight: 1.1, marginBottom: "1.5rem", color: "var(--text)",
          }}>
            Most AI Website Builders<br />
            <span style={{ color: "var(--cyan)" }}>Give You a Template.</span><br />
            We Give You an Agency.
          </h1>
          <p style={{ fontSize: "1.15rem", color: "var(--muted)", maxWidth: "600px", margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            See how eve.center's AI agent swarm compares to Durable, Wix, Hostinger, and hiring a freelancer.
          </p>
        </div>
      </section>

      {/* Quick Answer */}
      <section style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-bebas)", fontSize: "2rem", marginBottom: "1.5rem",
          color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem",
        }}>
          Which Should You Pick?
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--cyan)" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--muted)" }}>You Are...</th>
                <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--cyan)", fontWeight: 700 }}>Best Choice</th>
                <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--muted)" }}>Why</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["A local business needing a professional site", "eve.center", "Custom copy, competitor research, SEO"],
                ["On the tightest possible budget", "Hostinger (/mo)", "Cheapest, but you get what you pay for"],
                ["Need something live in 30 seconds", "Durable", "Fastest, but generic results"],
                ["A designer wanting pixel-perfect control", "Framer AI", "Best design tool, learning curve"],
                ["Need an all-in-one platform (CRM, invoicing)", "Durable", "Only one with CRM built in"],
              ].map(([you, choice, why], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem", color: "var(--text)" }}>{you}</td>
                  <td style={{ padding: "0.75rem", color: "var(--cyan)", fontWeight: 600 }}>{choice}</td>
                  <td style={{ padding: "0.75rem", color: "var(--muted)" }}>{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Feature Comparison */}
      <section style={{ padding: "4rem 2rem", maxWidth: "1000px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-bebas)", fontSize: "2rem", marginBottom: "1.5rem",
          color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem",
        }}>
          Feature Comparison
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--cyan)" }}>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "var(--muted)" }}>Feature</th>
                <th style={{ padding: "0.6rem", textAlign: "center", color: "var(--cyan)", fontWeight: 700 }}>eve.center</th>
                <th style={{ padding: "0.6rem", textAlign: "center", color: "var(--muted)" }}>Durable</th>
                <th style={{ padding: "0.6rem", textAlign: "center", color: "var(--muted)" }}>Hostinger</th>
                <th style={{ padding: "0.6rem", textAlign: "center", color: "var(--muted)" }}>Wix</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Price", "9 + 9/mo", "5/mo", "-4/mo", "7+/mo"],
                ["Setup Time", "~2 hours", "30 seconds", "Minutes", "Minutes"],
                ["Output", "Multi-page custom", "Single-page template", "Template", "Template"],
                ["Competitor Research", "Yes", "No", "No", "No"],
                ["Custom Copy", "Yes", "Generic AI", "Generic AI", "Generic AI"],
                ["Local SEO", "Yes", "Basic", "Basic", "Basic"],
                ["Hosting Included", "Yes", "Yes", "Yes", "Yes"],
                ["You Own the Code", "Yes", "No", "No", "No"],
                ["Who Builds It", "5 AI agents (swarm)", "Single AI", "Single AI", "Single AI"],
              ].map(([feature, ...vals], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.6rem", color: "var(--text)", fontWeight: 500 }}>{feature}</td>
                  <td style={{ padding: "0.6rem", textAlign: "center", color: "var(--cyan)", fontWeight: 600 }}>{vals[0]}</td>
                  <td style={{ padding: "0.6rem", textAlign: "center", color: "var(--muted)" }}>{vals[1]}</td>
                  <td style={{ padding: "0.6rem", textAlign: "center", color: "var(--muted)" }}>{vals[2]}</td>
                  <td style={{ padding: "0.6rem", textAlign: "center", color: "var(--muted)" }}>{vals[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Template Problem */}
      <section style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-bebas)", fontSize: "2rem", marginBottom: "1.5rem",
          color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem",
        }}>
          The Template Problem
        </h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          Every AI builder on this list (except eve.center) follows the same formula:
        </p>
        <ol style={{ color: "var(--muted)", lineHeight: 2, paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
          <li>You answer 5-8 questions</li>
          <li>The AI picks a <strong style={{ color: "var(--coral)" }}>template</strong></li>
          <li>The AI fills in <strong style={{ color: "var(--coral)" }}>generic copy</strong></li>
          <li>You spend hours editing it to not look like every other site</li>
        </ol>
        <p style={{ color: "var(--text)", lineHeight: 1.8, fontWeight: 500 }}>
          Result: A site that looks like it was built by the same AI that built your competitor's site.
        </p>
      </section>

      {/* The Swarm */}
      <section style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-bebas)", fontSize: "2rem", marginBottom: "1.5rem",
          color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem",
        }}>
          The Swarm Approach
        </h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          eve.center uses <strong style={{ color: "var(--cyan)" }}>5 specialized AI agents</strong>, each doing one thing well:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          {[
            { name: "Research Agent", desc: "Analyzes your top 3 local competitors, reviews, and search data" },
            { name: "Content Agent", desc: "Writes custom copy based on real research, not generic filler" },
            { name: "Design Agent", desc: "Creates a visual identity for your industry and personality" },
            { name: "QA Agent", desc: "Tests every link, load time, mobile layout, and form" },
            { name: "Deploy Agent", desc: "Handles domain, SSL, server config, and goes live" },
          ].map(({ name, desc }) => (
            <div key={name} style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
              padding: "1.25rem",
            }}>
              <h3 style={{ color: "var(--cyan)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.4rem" }}>{name}</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.6, fontSize: "0.9rem" }}>{desc}</p>
            </div>
          ))}
        </div>
        <p style={{ color: "var(--text)", lineHeight: 1.8, marginTop: "1.5rem", fontWeight: 500 }}>
          Result: A site that looks like a human agency built it — because an agency of AI specialists did.
        </p>
      </section>

      {/* Pricing */}
      <section style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-bebas)", fontSize: "2rem", marginBottom: "1.5rem",
          color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem",
        }}>
          What You Actually Pay (Year 1)
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--cyan)" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--muted)" }}>Builder</th>
                <th style={{ padding: "0.75rem", textAlign: "right", color: "var(--muted)" }}>Monthly</th>
                <th style={{ padding: "0.75rem", textAlign: "right", color: "var(--muted)" }}>Setup</th>
                <th style={{ padding: "0.75rem", textAlign: "right", color: "var(--cyan)", fontWeight: 700 }}>Year 1 Total</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["eve.center", "9/mo", "9", "37", true],
                ["Durable", "5/mo", "/bin/bash", "92", false],
                ["Hostinger", "/mo", "/bin/bash", "6", false],
                ["Wix ADI", "7/mo", "/bin/bash", "04", false],
                ["Freelancer", "/bin/bash", ",000", ",072", false],
                ["Agency", "/bin/bash", ",000", ",072", false],
              ].map(([name, monthly, setup, total, highlight], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem", color: highlight ? "var(--cyan)" : "var(--text)", fontWeight: highlight ? 600 : 400 }}>{name}</td>
                  <td style={{ padding: "0.75rem", textAlign: "right", color: "var(--muted)" }}>{monthly}</td>
                  <td style={{ padding: "0.75rem", textAlign: "right", color: "var(--muted)" }}>{setup}</td>
                  <td style={{ padding: "0.75rem", textAlign: "right", color: highlight ? "var(--cyan)" : "var(--text)", fontWeight: 700 }}>{total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, marginTop: "1.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "var(--text)" }}>Honest take:</strong> eve.center is not the cheapest. We're the cheapest <em>custom</em> option.
          The right comparison is eve.center (37/yr) vs. hiring a freelancer (,000+) or agency (,000+).
          We're 80-90% cheaper than the human alternative for the same quality.
        </p>
      </section>

      {/* When to Choose */}
      <section style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-bebas)", fontSize: "2rem", marginBottom: "1.5rem",
          color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem",
        }}>
          When to Choose eve.center
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem" }}>
          <div>
            <h3 style={{ color: "var(--cyan)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Choose eve.center if:</h3>
            <ul style={{ color: "var(--text)", lineHeight: 2, paddingLeft: "1.25rem" }}>
              <li>You want a <strong>custom site</strong>, not a template</li>
              <li>You want copy written for <strong>your business</strong></li>
              <li>You care about <strong>local SEO</strong></li>
              <li>You want it done in <strong>hours, not weeks</strong></li>
              <li>You want to spend <strong>less than 00</strong></li>
            </ul>
          </div>
          <div>
            <h3 style={{ color: "var(--coral)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Choose something else if:</h3>
            <ul style={{ color: "var(--muted)", lineHeight: 2, paddingLeft: "1.25rem" }}>
              <li>You need CRM or invoicing tools (Durable)</li>
              <li>You're on the tightest budget (Hostinger)</li>
              <li>You need it live in 30 seconds (Durable)</li>
              <li>You want pixel-by-pixel design control (Framer)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "5rem 2rem", textAlign: "center",
        background: "radial-gradient(circle at 50% 50%, rgba(0,217,255,0.08) 0%, transparent 60%)",
      }}>
        <h2 style={{
          fontFamily: "var(--font-bebas)", fontSize: "clamp(2rem, 4vw, 3rem)",
          marginBottom: "1rem", color: "var(--text)",
        }}>
          Ready to See the Difference?
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "1.1rem" }}>
          Chat with Eve and get a custom site built by a swarm of AI specialists.
        </p>
        <Link href="/chat" style={{
          display: "inline-block", padding: "1rem 2.5rem", background: "var(--cyan)",
          color: "var(--bg)", fontWeight: 700, fontSize: "1.1rem", borderRadius: "8px",
          textDecoration: "none",
        }}>
          Chat with Eve &rarr;
        </Link>
      </section>

      <footer style={{
        padding: "2rem", textAlign: "center", borderTop: "1px solid var(--border)",
        color: "var(--muted)", fontSize: "0.85rem",
      }}>
        <p>eve.center &mdash; The First Agentic Web Agency. Built by Eve, for your business.</p>
      </footer>
    </main>
  );
}
