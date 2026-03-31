import Link from 'next/link';

export default function NotFound() {
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
      <h1 style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: '6rem', color: 'var(--cyan)' }}>
        404
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>This page does not exist.</p>
      <Link
        href="/"
        style={{
          padding: '0.75rem 2rem',
          background: 'linear-gradient(135deg, var(--cyan) 0%, #00a8cc 100%)',
          color: '#000',
          fontWeight: 700,
          borderRadius: '8px',
          textDecoration: 'none',
        }}
      >
        ← Back to Eve.center
      </Link>
    </main>
  );
}
