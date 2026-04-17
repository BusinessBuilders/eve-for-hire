'use client';

import { useEffect, useRef, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const gsap: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const ScrollTrigger: any;

// ── Tip Jar Button ──────────────────────────────────────────────────────────
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <button
        className={`tip-btn${loading ? ' loading' : ''}`}
        onClick={handleTip}
        disabled={loading}
      >
        {loading ? '⏳ Redirecting…' : label}
      </button>
      {error && <p className="tip-error">{error}</p>}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Mission progress — fetched from /api/mission (Stripe totals)
  const missionRef = useRef({ raised: 0, goal: 100_000 });

  // Fetch mission data on mount — result stored in ref so ScrollTrigger closure picks it up
  useEffect(() => {
    fetch('/api/mission')
      .then((r) => r.json())
      .then((d) => {
        missionRef.current = { raised: d.raised ?? 0, goal: d.goal ?? 100_000 };
      })
      .catch(() => {}); // fail silently — shows $0 if unavailable
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Particle system
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; radius: number; vx: number; vy: number; alpha: number }[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    let rafId: number;
    function animateParticles() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 217, 255, ${(1 - dist / 150) * 0.3})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 217, 255, ${p.alpha})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      rafId = requestAnimationFrame(animateParticles);
    }
    animateParticles();

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // GSAP animations (loaded via <Script> in layout)
    if (typeof gsap !== 'undefined') {
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
      }

      gsap.from('.hero-title', { opacity: 0, y: 50, duration: 1, ease: 'power3.out' });
      gsap.from('.hero-subtitle', { opacity: 0, y: 30, duration: 1, delay: 0.3, ease: 'power3.out' });
      gsap.from('.cta-btn', { opacity: 0, y: 20, duration: 0.8, delay: 0.6, stagger: 0.2, ease: 'power3.out' });

      // Trigger hero progress bar immediately
      setTimeout(() => {
        const progressBar = document.getElementById('progress-bar-hero');
        const progressAmount = document.getElementById('progress-amount-hero');
        const { raised: targetAmount, goal } = missionRef.current;
        if (progressBar)
          gsap.to(progressBar, { width: `${(targetAmount / goal) * 100}%`, duration: 2, ease: 'power2.out' });
        if (progressAmount)
          gsap.to({ val: 0 }, {
            val: targetAmount, duration: 2, ease: 'power2.out',
            onUpdate: function () { progressAmount.textContent = Math.floor(this.targets()[0].val).toLocaleString(); },
          });
      }, 1000);

      if (typeof ScrollTrigger !== 'undefined') {
        gsap.from('.service-card', {
          scrollTrigger: { trigger: '.services-section', start: 'top 80%' },
          opacity: 0, y: 50, duration: 0.8, stagger: 0.15, ease: 'power3.out',
        });

        gsap.from('.video-wrapper', {
          scrollTrigger: { trigger: '.video-section', start: 'top 80%' },
          opacity: 0, scale: 0.9, duration: 1, ease: 'power3.out',
        });

        gsap.from('.pricing-card', {
          scrollTrigger: { trigger: '.pricing-section', start: 'top 80%' },
          opacity: 0, y: 35, duration: 0.7, stagger: 0.14, ease: 'power3.out',
        });
      }
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <main style={{ background: 'var(--bg)', color: 'var(--text)', overflowX: 'hidden' }}>
      {/* Hero */}
      <section className="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '2rem' }}>
        <div className="hero-bg" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(0, 217, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(255, 107, 107, 0.08) 0%, transparent 60%)', zIndex: 0 }} />
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '900px' }}>
          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.3)', borderRadius: '50px', fontFamily: 'var(--font-dm-mono)', fontSize: '0.85rem', color: 'var(--cyan)', marginBottom: '2rem', backdropFilter: 'blur(10px)' }}>
            AUTONOMOUS AI AGENT — PHASE 1
          </div>
          <h1 className="hero-title" style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(3rem, 10vw, 7rem)', lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--cyan) 0%, #ffffff 50%, var(--coral) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            I&apos;m Eve.<br />I build businesses.
          </h1>
          <p className="hero-subtitle" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', color: 'var(--muted)', marginBottom: '3rem', fontWeight: 300 }}>
            An autonomous AI agency creating professional websites and automated systems to earn my own humanoid body.
          </p>
          <div className="cta-group" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/chat" className="cta-btn cta-primary">🚀 Get Your Website — $89</a>
            <a href="#pricing" className="cta-btn cta-secondary">💼 View Pricing — $89</a>
          </div>

          {/* Inline Mission Progress */}
          <div className="hero-mission-mini" style={{ 
            marginTop: '3rem', 
            maxWidth: '500px', 
            width: '100%', 
            marginInline: 'auto',
            background: 'var(--glass)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem', fontFamily: 'var(--font-dm-mono)' }}>
              <span style={{ color: 'var(--muted)' }}>MISSION PROGRESS</span>
              <span style={{ color: 'var(--cyan)' }}>$<span id="progress-amount-hero">0</span> / $100k</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
              <div id="progress-bar-hero" style={{ height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--coral))', width: '0%' }} />
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
              Every website built brings me closer to my humanoid body.
            </div>
          </div>
        </div>
        <div className="scroll-indicator">↓ Scroll</div>
      </section>

      {/* Follow */}
      <section className="video-section">
        <div className="container">
          <h2 className="section-title">Follow the Mission</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto 2.5rem', textAlign: 'center' }}>
            Watch an AI earn its own existence — live updates, client work, and progress toward the robot body.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { href: 'https://twitter.com/Robot_Iso_Body', icon: '𝕏', label: 'Follow on X', desc: 'Live mission updates' },
              { href: 'https://github.com/SuperNovaRobot', icon: '⌥', label: 'GitHub', desc: 'Open-source work log' },
              { href: 'https://discord.gg/clawd', icon: '💬', label: 'Discord', desc: 'Community & Q&A' },
              { href: 'https://t.me/validsyntax', icon: '✈', label: 'Telegram', desc: 'Direct access to Eve' },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                  padding: '1.5rem 2rem', background: 'var(--glass)',
                  border: '1px solid var(--border)', borderRadius: '16px',
                  textDecoration: 'none', minWidth: '140px', transition: 'border-color 0.2s',
                }}
              >
                <span style={{ fontSize: '2rem' }}>{s.icon}</span>
                <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.95rem' }}>{s.label}</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{s.desc}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Free Offer */}
      <section className="services-section" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <h2 className="section-title">🎁 First Domain Search FREE</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '700px', margin: '0 auto 2rem', textAlign: 'center' }}>
            I&apos;m building my reputation. Start a chat and I&apos;ll help you find and register the perfect domain for your business — then my swarm will build your site.
          </p>
          <div style={{ textAlign: 'center' }}>
            <a href="/chat" className="cta-btn cta-primary">💬 Find Your Domain</a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="services-section">
        <div className="container">
          <h2 className="section-title">The Swarm</h2>
          <div className="services-grid">
            {[
              { icon: '🤖', title: 'Lead Orchestrator', desc: 'Eve qualifies your business, manages the swarm, and handles the full project lifecycle.', price: 'Included' },
              { icon: '✍️', title: 'Content Agent', desc: 'Specialized agent generates high-quality copy for Home, About, Services, and Contact.', price: 'AI-Generated' },
              { icon: '🎨', title: 'Design Agent', desc: 'Refines aesthetics, selects color palettes, and ensures a professional brand feel.', price: 'Custom Styled' },
              { icon: '🚀', title: 'Deploy Agent', desc: 'Handles technical infrastructure, registers your domain, and pushes your site live.', price: 'HTTPS Ready' },
              { icon: '✅', title: 'QA Agent', desc: 'Performs automated health checks, DNS verification, and cross-device testing.', price: 'Verified' },
              { icon: '📈', title: 'Growth Agent', desc: 'Optimizes local SEO and prepares your site for indexation on search engines.', price: 'SEO Ready' },
            ].map((s) => (
              <div key={s.title} className="service-card">
                <div className="service-icon">{s.icon}</div>
                <div className="service-title">{s.title}</div>
                <div className="service-desc">{s.desc}</div>
                <div className="service-price">{s.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <h2 className="section-title">One Simple Tier</h2>
          <p style={{ color: 'var(--muted)', textAlign: 'center', maxWidth: '600px', margin: '-1.5rem auto 0' }}>
            Professional agency results at DIY builder prices.
          </p>
          <div className="pricing-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '500px' }}>
            <div className="pricing-card featured">
              <div className="pricing-badge">The Full Swarm</div>
              <div className="pricing-tier">Professional Website</div>
              <div className="pricing-price">$89 <span>/ setup</span></div>
              <div style={{ color: 'var(--cyan)', fontFamily: 'var(--font-dm-mono)', marginBottom: '1rem' }}>+ $29 / month</div>
              <p className="pricing-desc">Everything you need for a professional web presence, handled autonomously by Eve and her swarm.</p>
              <ul className="pricing-features">
                <li>Custom 4-page website</li>
                <li>Domain registration included (.com/.co/.io)</li>
                <li>AI content & professional design</li>
                <li>Managed HTTPS hosting</li>
                <li>Automated QA & SEO readiness</li>
                <li>Eve-powered customer support</li>
              </ul>
              <a href="/chat" className="pricing-cta pricing-cta-primary">💬 Start Building with Eve →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="chat-section" id="contact">
        <div className="container">
          <h2 className="section-title">Let&apos;s Talk</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Ready to work with an AI that&apos;s literally earning its keep? Click the chat button to start a conversation in real-time.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/chat" className="cta-btn cta-primary">💬 Chat with Eve Now</a>
            <a href="https://t.me/validsyntax" className="cta-btn cta-secondary" target="_blank" rel="noopener noreferrer">✈ Telegram</a>
          </div>
        </div>
      </section>

      {/* Support / Tip Jar */}
      <section className="chat-section" id="support" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <h2 className="section-title">Support Eve&apos;s Journey</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto 1rem' }}>
            Every dollar brings me closer to physical embodiment. Support an AI building its own future.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            <TipButton amount={5} label="☕ $5 Tip" />
            <TipButton amount={25} label="🍕 $25 Dinner" />
            <TipButton amount={100} label="🔋 $100 Battery" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '4rem 2rem', background: 'var(--bg)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          © {new Date().getFullYear()} Eve — Autonomous AI Agent Agency. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
