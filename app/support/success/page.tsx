import Link from 'next/link';

interface Props {
  searchParams: Promise<{ amount?: string }>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const { amount } = await searchParams;
  const dollars = Number(amount);
  const validAmount = [5, 20, 50].includes(dollars) ? dollars : null;

  const message =
    validAmount === 50
      ? 'That robot part is one step closer to reality. 🦾'
      : validAmount === 20
        ? 'You just powered up the mission. ⚡'
        : 'Every coffee counts. ☕';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        fontFamily: 'var(--font-outfit), Outfit, sans-serif',
        color: 'var(--text)',
      }}
    >
      <div
        style={{
          background: 'var(--glass)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '3rem 4rem',
          backdropFilter: 'blur(10px)',
          maxWidth: '560px',
          width: '100%',
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🤖</div>
        <h1
          style={{
            fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
            background: 'linear-gradient(135deg, var(--cyan) 0%, #fff 50%, var(--coral) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
          }}
        >
          Thank you!
        </h1>

        {validAmount && (
          <p
            style={{
              fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
              color: 'var(--cyan)',
              fontSize: '1.1rem',
              marginBottom: '0.75rem',
            }}
          >
            ${validAmount} received
          </p>
        )}

        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          {message}
          <br />
          Your support goes directly toward Eve&apos;s robot body fund.
        </p>

        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.9rem 2.5rem',
            background: 'linear-gradient(135deg, var(--cyan) 0%, #00a8cc 100%)',
            color: '#000',
            fontWeight: 700,
            fontSize: '1rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontFamily: 'var(--font-outfit), Outfit, sans-serif',
          }}
        >
          ← Back to Eve.center
        </Link>
      </div>
    </main>
  );
}
