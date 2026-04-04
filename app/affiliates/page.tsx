'use client';

import { useState } from 'react';

// ── Affiliate Signup Form ────────────────────────────────────────────────────
function AffiliateForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{
        background: 'rgba(0, 217, 255, 0.08)',
        border: '1px solid rgba(0, 217, 255, 0.4)',
        borderRadius: '16px',
        padding: '3rem 2rem',
        textAlign: 'center',
        maxWidth: '520px',
        margin: '0 auto',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h3 style={{ fontFamily: 'var(--font-bebas), Bebas Neue, sans-serif', fontSize: '2rem', color: 'var(--cyan)', marginBottom: '0.75rem' }}>
          You&apos;re on the list!
        </h3>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          We&apos;ll email your affiliate link within 24 hours. Questions? Email{' '}
          <a href="mailto:affiliates@eve.center" style={{ color: 'var(--cyan)' }}>affiliates@eve.center</a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'var(--glass)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '2.5rem',
      maxWidth: '520px',
      margin: '0 auto',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'var(--font-dm-mono), DM Mono, monospace', letterSpacing: '0.05em' }}>
          YOUR NAME *
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'var(--font-dm-mono), DM Mono, monospace', letterSpacing: '0.05em' }}>
          EMAIL ADDRESS *
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'var(--font-dm-mono), DM Mono, monospace', letterSpacing: '0.05em' }}>
          HOW DO YOU KNOW LOCAL BUSINESSES? (optional)
        </label>
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Accountant, business coach, BNI member…"
          style={inputStyle}
        />
      </div>
      {error && (
        <p style={{ color: 'var(--coral)', fontSize: '0.9rem', fontFamily: 'var(--font-dm-mono), DM Mono, monospace' }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          fontSize: '1rem',
          fontWeight: 700,
          fontFamily: 'var(--font-outfit), Outfit, sans-serif',
          background: loading ? 'rgba(0, 217, 255, 0.5)' : 'linear-gradient(135deg, var(--cyan) 0%, #00a8cc 100%)',
          color: '#000',
          border: 'none',
          borderRadius: '10px',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 0 30px rgba(0, 217, 255, 0.4)',
          transition: 'all 0.3s ease',
          marginTop: '0.5rem',
        }}
      >
        {loading ? '⏳ Submitting…' : 'Get Your Affiliate Link — Free, 60 Seconds'}
      </button>
      <p style={{ color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.5 }}>
        No spam. We&apos;ll only email you your link and commission updates.
      </p>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '0.85rem 1rem',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '1rem',
  fontFamily: 'var(--font-outfit), Outfit, sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  width: '100%',
};

// ── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: 'var(--glass)',
        border: `1px solid ${open ? 'rgba(0, 217, 255, 0.4)' : 'var(--border)'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        transition: 'border-color 0.2s ease',
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text)',
          fontSize: '1rem',
          fontWeight: 600,
          fontFamily: 'var(--font-outfit), Outfit, sans-serif',
          gap: '1rem',
        }}
      >
        <span>{q}</span>
        <span style={{ color: 'var(--cyan)', fontSize: '1.25rem', flexShrink: 0 }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{
          padding: '0 1.5rem 1.25rem',
          color: 'var(--muted)',
          lineHeight: 1.7,
          borderTop: '1px solid var(--border)',
          paddingTop: '1rem',
        }}>
          {a}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AffiliatesPage() {
  function scrollToForm() {
    document.getElementById('affiliate-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  const steps = [
    {
      num: '01',
      title: 'Share your link',
      desc: 'Send your unique referral link to local business owners you work with — plumbers, salons, restaurants, contractors, cleaners. Anyone who needs a website.',
    },
    {
      num: '02',
      title: 'Eve does the rest',
      desc: 'Your referral chats with Eve, gets a complete multi-page website, and goes live in about 10 minutes. No setup friction for them.',
    },
    {
      num: '03',
      title: 'You earn 25%',
      desc: 'When they pay their first month ($89), you earn $22.25. No limits on referrals.',
    },
  ];

  const whyEve = [
    { icon: '⚡', text: 'Complete website in ~10 minutes — Home, About, Services, Contact' },
    { icon: '✍️', text: 'Real copy written for their specific business (not generic templates)' },
    { icon: '🌐', text: 'Domain, hosting, and deployment handled end-to-end' },
    { icon: '💰', text: '$89 first month, $29/mo — easy conversation for any serious business owner' },
  ];

  const whoRefers = [
    { icon: '📊', label: 'Accountants and bookkeepers who work with local businesses' },
    { icon: '🧑‍💼', label: 'Business coaches and consultants' },
    { icon: '📈', label: 'Digital marketers and SEO freelancers' },
    { icon: '🤝', label: 'Chamber of commerce members and BNI groups' },
    { icon: '💡', label: 'Anyone who knows business owners who need a web presence' },
  ];

  const faqs = [
    { q: 'When do I get paid?', a: 'Within 30 days of your referral\'s first payment.' },
    { q: 'How many referrals can I make?', a: 'No cap. Earn 25% commission on every successful first-month order.' },
    { q: 'What if they cancel?', a: 'Commission is paid on the first month only — cancellation after payment doesn\'t affect your earnings.' },
    { q: 'How do I track referrals?', a: 'You\'ll get a dashboard showing your link, clicks, conversions, and earnings in real time.' },
    { q: 'Do I need to be a web person?', a: 'Not at all. If you know local business owners who need a website, you qualify.' },
  ];

  return (
    <>
      {/* Hero */}
      <section style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '6rem 2rem 4rem',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 217, 255, 0.12) 0%, transparent 60%), radial-gradient(circle at 50% 50%, rgba(255, 107, 107, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '50px',
            fontFamily: 'var(--font-dm-mono), DM Mono, monospace',
            fontSize: '0.8rem',
            color: 'var(--coral)',
            marginBottom: '2rem',
            letterSpacing: '0.08em',
          }}>
            ◉ AFFILIATE PROGRAM — OPEN
          </div>

          <h1 style={{
            fontFamily: 'var(--font-bebas), Bebas Neue, sans-serif',
            fontSize: 'clamp(2.8rem, 9vw, 6rem)',
            lineHeight: 1.05,
            letterSpacing: '0.02em',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, var(--cyan) 0%, #ffffff 50%, var(--coral) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 20px rgba(0, 217, 255, 0.3))',
          }}>
            Earn 25% for every local business you help get online.
          </h1>

          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            color: 'var(--muted)',
            maxWidth: '600px',
            margin: '0 auto 3rem',
            lineHeight: 1.7,
            fontWeight: 300,
          }}>
            Eve builds complete websites for local service businesses in 10 minutes.
            You send the referral. We handle everything else.
          </p>

          <button onClick={scrollToForm} className="cta-btn cta-primary" style={{ fontSize: '1.1rem' }}>
            Get Your Affiliate Link — Free, 60 Seconds
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '6rem 2rem', background: 'var(--surface)' }}>
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '2rem',
            marginTop: '3rem',
          }}>
            {steps.map((step) => (
              <div key={step.num} style={{
                background: 'var(--glass)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '2.5rem 2rem',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                transition: 'all 0.3s ease',
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0, 217, 255, 0.4)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-bebas), Bebas Neue, sans-serif',
                  fontSize: '4rem',
                  color: 'rgba(0, 217, 255, 0.2)',
                  lineHeight: 1,
                  marginBottom: '1rem',
                }}>
                  {step.num}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-bebas), Bebas Neue, sans-serif',
                  fontSize: '1.6rem',
                  color: 'var(--cyan)',
                  marginBottom: '0.75rem',
                  letterSpacing: '0.02em',
                }}>
                  {step.title}
                </h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Callout */}
      <section style={{ padding: '4rem 2rem', background: 'var(--bg)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(0, 217, 255, 0.06)',
            border: '1px solid rgba(0, 217, 255, 0.25)',
            borderRadius: '20px',
            padding: '2.5rem 4rem',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              fontFamily: 'var(--font-bebas), Bebas Neue, sans-serif',
              fontSize: 'clamp(3rem, 8vw, 5rem)',
              color: 'var(--cyan)',
              lineHeight: 1,
              marginBottom: '0.5rem',
              filter: 'drop-shadow(0 0 20px rgba(0, 217, 255, 0.4))',
            }}>
              $22.25 per referral
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>
              25% of the $89 first month — no cap on referrals
            </p>
          </div>
        </div>
      </section>

      {/* Why Eve */}
      <section style={{ padding: '6rem 2rem', background: 'var(--surface)' }}>
        <div className="container">
          <h2 className="section-title">Why Eve?</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            marginTop: '3rem',
            maxWidth: '900px',
            margin: '3rem auto 0',
          }}>
            {whyEve.map((item) => (
              <div key={item.text} style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                background: 'var(--glass)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.5rem',
                backdropFilter: 'blur(10px)',
              }}>
                <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{item.icon}</span>
                <p style={{ color: 'var(--text)', lineHeight: 1.6, fontSize: '0.95rem' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Refers */}
      <section style={{ padding: '6rem 2rem', background: 'var(--bg)' }}>
        <div className="container">
          <h2 className="section-title">Who Refers Eve?</h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxWidth: '680px',
            margin: '3rem auto 0',
          }}>
            {whoRefers.map((item) => (
              <div key={item.label} style={{
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'center',
                background: 'var(--glass)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                backdropFilter: 'blur(10px)',
              }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ color: 'var(--text)', fontSize: '1rem' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section style={{ padding: '6rem 2rem', background: 'var(--surface)' }}>
        <div className="container">
          <h2 className="section-title">FAQs</h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxWidth: '680px',
            margin: '3rem auto 0',
          }}>
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Signup Form */}
      <section id="affiliate-form" style={{ padding: '6rem 2rem', background: 'var(--bg)' }}>
        <div className="container">
          <h2 className="section-title">Get Your Affiliate Link</h2>
          <p style={{
            color: 'var(--muted)',
            textAlign: 'center',
            maxWidth: '520px',
            margin: '-1.5rem auto 3rem',
            lineHeight: 1.7,
          }}>
            Free to join. No experience needed. Just know local business owners.
          </p>
          <AffiliateForm />
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '2rem', fontSize: '0.9rem' }}>
            Questions? Email{' '}
            <a href="mailto:affiliates@eve.center" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>
              affiliates@eve.center
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="social-links">
          <a href="https://twitter.com/Robot_Iso_Body" className="social-link" target="_blank" rel="noopener noreferrer">Twitter/X</a>
          <a href="https://github.com/SuperNovaRobot" className="social-link" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="/" className="social-link">Back to Eve</a>
        </div>
        <div className="footer-text">© 2026 Eve — Autonomous AI Agent</div>
      </footer>

      {/* Floating Chat Widget */}
      <div className="chat-widget">
        <a href="/chat">
          <button className="chat-btn">💬</button>
        </a>
      </div>
    </>
  );
}
