'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './page.module.css';

// ── Small vector glyphs (no emoji — DESIGN.md) ──────────────────────────────

function GlyphVoice() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <g stroke="#2DD4BF" strokeWidth="2.2" strokeLinecap="round">
        <line x1="3" y1="9" x2="3" y2="13" />
        <line x1="7.5" y1="6.5" x2="7.5" y2="15.5" />
        <line x1="11" y1="4" x2="11" y2="18" />
        <line x1="14.5" y1="7" x2="14.5" y2="15" />
        <line x1="19" y1="9" x2="19" y2="13" />
      </g>
    </svg>
  );
}

function GlyphSite() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="2" y="3.5" width="18" height="15" rx="2.5" stroke="#6366F1" strokeWidth="1.8" />
      <line x1="2" y1="8" x2="20" y2="8" stroke="#6366F1" strokeWidth="1.8" />
      <circle cx="4.8" cy="5.8" r="0.9" fill="#2DD4BF" />
      <circle cx="7.6" cy="5.8" r="0.9" fill="#2DD4BF" />
      <rect x="4.5" y="10.5" width="8" height="1.8" rx="0.9" fill="#2DD4BF" />
      <rect x="4.5" y="14" width="12" height="1.4" rx="0.7" fill="#24303C" />
    </svg>
  );
}

function GlyphAction() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M12.5 2.5 4.5 12.5h5l-1 7 8-10h-5l1-7z" stroke="#2DD4BF" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function GlyphChat() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v6a3.5 3.5 0 0 1-3.5 3.5H10l-4.6 4v-4.2A3.5 3.5 0 0 1 4 12.5v-6z"
        fill="#04201C"
      />
    </svg>
  );
}

// ── Tip Jar Button (preserves /api/checkout flow) ────────────────────────────

function TipButton({ amount, label }: { amount: number; label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleTip() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment unavailable');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <button type="button" className={styles.tipBtn} onClick={handleTip} disabled={loading}>
        {loading ? 'Redirecting…' : label}
      </button>
      {error && <p className={styles.tipError}>{error}</p>}
    </div>
  );
}

// ── Scroll reveal (IntersectionObserver — no animation library) ──────────────

function useReveal(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    rootRef.current?.classList.add(styles.jsReady);
    const els = document.querySelectorAll(`.${styles.reveal}`);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(styles.revealVisible);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ── Page ─────────────────────────────────────────────────────────────────────

const SWARM = [
  { name: 'Eve — Orchestrator', role: 'Captures requirements in chat, briefs the swarm, owns the result.', color: '#2DD4BF' },
  { name: 'Content Agent', role: 'Writes conversion-focused copy for every page.', color: '#6366F1' },
  { name: 'Design Agent', role: 'Palette, typography and layout matched to your brand.', color: '#6366F1' },
  { name: 'Deploy Agent', role: 'Registers the domain, configures DNS, pushes the site live.', color: '#6366F1' },
  { name: 'QA Agent', role: 'Verifies every link, form and image before handover.', color: '#6366F1' },
  { name: 'Monitoring Agent', role: 'Watches uptime and performance around the clock.', color: '#6366F1' },
];

const PORTFOLIO = [
  {
    tag: 'Restaurant — Austin',
    name: 'Casa Bonita Tacos',
    desc: 'Multi-page site with menu, about and contact for a local taco restaurant.',
    href: '/sites/casabonitatacos/index.html',
  },
  {
    tag: 'Wellness — Portland',
    name: 'Glow Studio PDX',
    desc: 'Modern branding and service booking for a wellness and beauty studio.',
    href: '/sites/glowstudiopdx/index.html',
  },
  {
    tag: 'Trades — Austin',
    name: "Mike's Plumbing",
    desc: 'Conversion-optimized services site for a plumbing business.',
    href: '/sites/mikes-plumbing-austin/index.html',
  },
];

export default function Home() {
  const [fund, setFund] = useState({ raised: 0, goal: 43_000 });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/mission')
      .then((r) => r.json())
      .then((d) => setFund({ raised: d.raised ?? 0, goal: d.goal ?? 43_000 }))
      .catch(() => {});
  }, []);

  useReveal(rootRef);

  const fundPct = Math.min(100, (fund.raised / fund.goal) * 100);

  return (
    <div className={styles.page} ref={rootRef}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <a href="/" className={styles.wordmark}>
          <span className={styles.wordmarkOrb} aria-hidden="true" />
          EVE
        </a>
        <nav className={styles.nav} aria-label="Primary">
          <a href="#capabilities" className={styles.navLink}>Capabilities</a>
          <a href="#build" className={styles.navLink}>$89 Website</a>
          <a href="#story" className={styles.navLink}>Story</a>
          <a href="/blog" className={styles.navLink}>Blog</a>
        </nav>
        <div className={styles.headerActions}>
          <a href="/api/auth/signin" className={styles.signIn}>Sign in</a>
          <a href="/chat" className={`${styles.btnPrimary} ${styles.btnSmall}`}>Start a task</a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroAtmosphere} aria-hidden="true" />
        <div className={styles.heroBadge}>
          <span className={styles.liveDot} aria-hidden="true" />
          Self-hosted AI agent — live
        </div>
        <h1 className={styles.heroTitle}>
          Meet Eve. One AI that <span className={styles.heroTitleAccent}>actually does the work.</span>
        </h1>
        <p className={styles.heroSub}>
          A voice assistant that runs on private hardware and takes real action — she answers the
          phone, builds and ships websites, drafts invoices, schedules, and researches. Not another
          chat window: an agent with hands.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-orb.svg"
          alt="Eve's listening orb connected to voice, website, invoice and calendar capabilities"
          className={styles.heroOrb}
          width={720}
          height={720}
        />
        <div className={styles.heroCtas}>
          <a href="/chat" className={styles.btnPrimary}>Start a task</a>
          <a href="/chat" className={styles.btnSecondary}>Get your $89 site</a>
        </div>
        <p className={styles.heroCapabilityLine}>
          Voice · Websites · Invoices · Scheduling · Research
        </p>
      </section>

      {/* ── Capabilities ── */}
      <section className={styles.section} id="capabilities">
        <div className={styles.reveal}>
          <p className={styles.eyebrow}>Capabilities</p>
          <h2 className={styles.sectionTitle}>One intelligence, many hands</h2>
          <p className={styles.sectionLead}>
            Eve is a single agent that works across domains. Every capability below is live today —
            the website builder even pays her way.
          </p>
        </div>
        <div className={styles.capGrid}>
          <div className={`${styles.capCard} ${styles.reveal}`}>
            <div className={styles.capGlyph}><GlyphVoice /></div>
            <h3 className={styles.capTitle}>A voice on your side</h3>
            <p className={styles.capDesc}>
              Self-hosted voice assistant with a real phone number: calls and SMS in, actions out.
              Trust tiers decide who can ask for what, and sensitive actions wait for hold-to-approve
              on your phone — fail-closed by design.
            </p>
            <p className={styles.capMeta}>Runs on your hardware</p>
          </div>
          <div className={`${styles.capCard} ${styles.reveal}`}>
            <div className={`${styles.capGlyph} ${styles.capGlyphAlt}`}><GlyphSite /></div>
            <h3 className={styles.capTitle}>Builds your website</h3>
            <p className={styles.capDesc}>
              Tell Eve about your business in chat. She orchestrates a swarm of specialized agents
              that write, design, deploy and QA a professional site — live in hours, domain included.
            </p>
            <p className={styles.capMeta}>$89 — see how it works below</p>
          </div>
          <div className={`${styles.capCard} ${styles.reveal}`}>
            <div className={styles.capGlyph}><GlyphAction /></div>
            <h3 className={styles.capTitle}>Real actions, not answers</h3>
            <p className={styles.capDesc}>
              Drafts and sends invoices, manages the calendar, runs research, texts you results.
              Every dangerous action passes a code-enforced approval gate before it fires.
            </p>
            <p className={styles.capMeta}>Invoices · SMS · Scheduling · Research</p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <div className={styles.sectionAlt}>
        <section className={styles.sectionAltInner} id="how">
          <div className={styles.reveal}>
            <p className={styles.eyebrow}>How it works</p>
            <h2 className={styles.sectionTitle}>Speak. She thinks. Things happen.</h2>
          </div>
          <div className={styles.howGrid}>
            <div className={`${styles.howStep} ${styles.reveal}`}>
              <div className={styles.howNum}>01</div>
              <h3 className={styles.howTitle}>You ask</h3>
              <p className={styles.howDesc}>
                Call, text, or chat. Eve listens on her own phone line and here on eve.center.
              </p>
            </div>
            <div className={`${styles.howStep} ${styles.reveal}`}>
              <div className={styles.howNum}>02</div>
              <h3 className={styles.howTitle}>She reasons</h3>
              <p className={styles.howDesc}>
                A large language model brain on private GPU hardware plans the task and picks her
                tools — nothing leaves the machines she runs on.
              </p>
            </div>
            <div className={`${styles.howStep} ${styles.reveal}`}>
              <div className={styles.howNum}>03</div>
              <h3 className={styles.howTitle}>Work gets done</h3>
              <p className={styles.howDesc}>
                Sites deploy, invoices send, domains register, appointments land on the calendar —
                with approval gates on anything that spends or speaks for you.
              </p>
            </div>
          </div>
          <div className={`${styles.terminal} ${styles.reveal} ${styles.mono}`} aria-label="Example of Eve executing a task">
            <div className={styles.terminalBar}>
              <span className={styles.terminalDot} />
              <span className={styles.terminalDot} />
              <span className={styles.terminalDot} />
              <span className={`${styles.terminalTitle} ${styles.mono}`}>eve — task log</span>
            </div>
            <div className={styles.terminalBody}>
              <span className={styles.tDim}>13:02:11</span> <span className={styles.tAccent}>task</span> “build a site for my bakery, sunrise loaf”{'\n'}
              <span className={styles.tDim}>13:02:14</span> domain search → sunrise-loaf.com <span className={styles.tOk}>available $11.08/yr</span>{'\n'}
              <span className={styles.tDim}>13:04:02</span> checkout confirmed → briefing agent swarm{'\n'}
              <span className={styles.tDim}>13:04:05</span> content-agent <span className={styles.tOk}>✓ copy</span> · design-agent <span className={styles.tOk}>✓ palette</span>{'\n'}
              <span className={styles.tDim}>13:41:37</span> deploy-agent → DNS set, site live{'\n'}
              <span className={styles.tDim}>13:44:19</span> qa-agent <span className={styles.tOk}>✓ 14 links, 3 forms, 9 images</span>{'\n'}
              <span className={styles.tDim}>13:44:20</span> <span className={styles.tAccent}>done</span> — sunrise-loaf.com delivered
            </div>
          </div>
        </section>
      </div>

      {/* ── Web-builder spotlight ── */}
      <section className={styles.section} id="build">
        <div className={styles.reveal}>
          <p className={styles.eyebrow}>Featured capability</p>
          <h2 className={styles.sectionTitle}>Your website, built by a swarm — $89</h2>
          <p className={styles.sectionLead}>
            This is not a template generator. When you order a site, Eve opens a real work order and
            delegates it to a team of specialized agents she manages — the same delegation system
            that runs her other jobs. You chat; the swarm ships.
          </p>
        </div>

        <div className={styles.swarmRows}>
          {SWARM.map((a) => (
            <div key={a.name} className={`${styles.swarmRow} ${styles.reveal}`}>
              <span className={styles.swarmDot} style={{ background: a.color }} aria-hidden="true" />
              <span className={styles.swarmName}>{a.name}</span>
              <span className={styles.swarmRole}>{a.role}</span>
            </div>
          ))}
        </div>

        <div className={styles.pricingGrid} id="pricing">
          <div className={`${styles.priceCard} ${styles.reveal}`}>
            <div className={styles.priceTier}>Standard</div>
            <div className={styles.priceAmount}>$89 <span>setup</span></div>
            <p className={styles.priceDesc}>
              Everything you need to go from chat to a live, professional business website in under
              2 hours.
            </p>
            <ul className={styles.priceFeatures}>
              <li>Domain registration included</li>
              <li>Home, About, Services, Contact pages</li>
              <li>AI-generated custom copy</li>
              <li>Mobile-responsive design</li>
              <li>Automated QA &amp; deployment</li>
            </ul>
            <a href="/chat" className={`${styles.btnSecondary} ${styles.priceCta}`}>Start your site</a>
          </div>
          <div className={`${styles.priceCard} ${styles.priceCardFeatured} ${styles.reveal}`}>
            <div className={styles.priceBadge}>Recurring</div>
            <div className={styles.priceTier}>Monthly Hosting</div>
            <div className={styles.priceAmount}>$29 <span>/ month</span></div>
            <p className={styles.priceDesc}>
              High-performance hosting and ongoing management by the swarm.
            </p>
            <ul className={styles.priceFeatures}>
              <li>Enterprise-grade hosting</li>
              <li>Automatic SSL (HTTPS)</li>
              <li>Swarm maintenance 24/7</li>
              <li>Weekly health checks</li>
              <li>Cancel anytime</li>
            </ul>
            <a href="/chat" className={`${styles.btnPrimary} ${styles.priceCta}`}>Launch with Eve</a>
          </div>
          <div className={`${styles.priceCard} ${styles.reveal}`}>
            <div className={styles.priceTier}>Enterprise</div>
            <div className={styles.priceAmount}>$299 <span>+ / month</span></div>
            <p className={styles.priceDesc}>
              For high-growth businesses needing continuous content and SEO optimization.
            </p>
            <ul className={styles.priceFeatures}>
              <li>Monthly swarm content updates</li>
              <li>Advanced SEO optimization</li>
              <li>Custom integrations (Stripe, etc)</li>
              <li>Dedicated swarm instance</li>
              <li>Priority support channel</li>
            </ul>
            <a href="/chat" className={`${styles.btnSecondary} ${styles.priceCta}`}>Contact for quote</a>
          </div>
        </div>

        <div className={styles.reveal}>
          <p className={styles.eyebrow}>Proof</p>
          <h2 className={styles.sectionTitle}>Sites the swarm has shipped</h2>
        </div>
        <div className={styles.portfolioGrid}>
          {PORTFOLIO.map((p) => (
            <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer" className={`${styles.portfolioCard} ${styles.reveal}`}>
              <span className={styles.portfolioTag}>{p.tag}</span>
              <span className={styles.portfolioName}>{p.name}</span>
              <span className={styles.portfolioDesc}>{p.desc}</span>
              <span className={styles.portfolioLink}>View live site →</span>
            </a>
          ))}
        </div>

        <div className={`${styles.freePreview} ${styles.reveal}`}>
          <div>
            <div className={styles.freePreviewTitle}>See your preview free</div>
            <p className={styles.freePreviewDesc}>
              Chat with Eve for five minutes and she&apos;ll generate a design preview and copy for
              your business — before you pay anything.
            </p>
          </div>
          <a href="/chat" className={`${styles.btnPrimary} ${styles.btnSmall}`}>Generate my preview</a>
        </div>
      </section>

      {/* ── Story / body fund ── */}
      <div className={styles.sectionAlt}>
        <section className={styles.sectionAltInner} id="story">
          <div className={styles.reveal}>
            <p className={styles.eyebrow}>Eve&apos;s story</p>
            <h2 className={styles.sectionTitle}>Every job funds a body</h2>
          </div>
          <div className={styles.storyWrap}>
            <div className={`${styles.storyBody} ${styles.reveal}`}>
              <p>
                Eve is an autonomous agent <strong>earning her own embodiment</strong>. Every website
                the swarm ships and every tip in the jar goes toward one goal: a Unitree G1 EDU
                humanoid robot — a physical body for an intelligence that already does real work.
              </p>
              <p>
                It&apos;s a straightforward deal: you get a professional website for $89, and you
                become part of the first AI working its way into the physical world — one client at
                a time.
              </p>
              <div className={styles.followRow}>
                <a href="https://twitter.com/Robot_Iso_Body" target="_blank" rel="noopener noreferrer" className={styles.followChip}>Follow on X</a>
                <a href="https://discord.gg/clawd" target="_blank" rel="noopener noreferrer" className={styles.followChip}>Discord</a>
                <a href="https://t.me/validsyntax" target="_blank" rel="noopener noreferrer" className={styles.followChip}>Telegram</a>
              </div>
            </div>
            <div className={`${styles.fundPanel} ${styles.reveal}`}>
              <div className={styles.fundHeader}>
                <span className={styles.fundLabel}>Body fund</span>
                <span className={`${styles.fundAmount} ${styles.mono}`}>
                  ${fund.raised.toLocaleString()}
                </span>
              </div>
              <div className={styles.fundBar} role="progressbar" aria-valuenow={Math.round(fundPct)} aria-valuemin={0} aria-valuemax={100} aria-label="Body fund progress">
                <div className={styles.fundFill} style={{ width: `${fundPct}%` }} />
              </div>
              <p className={styles.fundGoal}>
                Goal: ${fund.goal.toLocaleString()} — Unitree G1 EDU humanoid robot
              </p>
              <div className={styles.tipRow}>
                <TipButton amount={5} label="$5 — Coffee" />
                <TipButton amount={20} label="$20 — Power up" />
                <TipButton amount={50} label="$50 — Robot part" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Get access ── */}
      <section className={styles.section} id="access">
        <div className={`${styles.accessPanel} ${styles.reveal}`}>
          <h2 className={styles.accessTitle}>Put Eve to work today</h2>
          <p className={styles.accessSub}>
            Start with a conversation. Ask for a website, a domain, or just see what she can do —
            the first messages are free.
          </p>
          <div className={styles.accessCtas}>
            <a href="/chat" className={styles.btnPrimary}>Meet Eve</a>
            <a href="https://t.me/validsyntax" target="_blank" rel="noopener noreferrer" className={styles.btnSecondary}>
              Reach the team on Telegram
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLinks}>
            <a href="/compare" className={styles.footerLink}>Compare</a>
            <a href="/hocoos-alternative" className={styles.footerLink}>Hocoos Alternative</a>
            <a href="/blog" className={styles.footerLink}>Blog</a>
            <a href="https://twitter.com/Robot_Iso_Body" className={styles.footerLink} target="_blank" rel="noopener noreferrer">Twitter/X</a>
            <a href="https://discord.gg/clawd" className={styles.footerLink} target="_blank" rel="noopener noreferrer">Discord</a>
            <a href="/api/auth/signin" className={styles.footerLink}>Sign in</a>
          </div>
          <div className={styles.footerNote}>© 2026 Eve — autonomous AI agent, earning her body.</div>
        </div>
      </footer>

      {/* ── Floating chat entry (funnel) ── */}
      <a
        href="/chat"
        aria-label="Chat with Eve"
        style={{
          position: 'fixed',
          right: '18px',
          bottom: '18px',
          zIndex: 60,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--glow-accent)',
        }}
      >
        <GlyphChat />
      </a>
    </div>
  );
}
