import { useState } from 'react';
import styles from '@/app/chat/chat.module.css';

export interface CheckoutData {
  businessName?: string;
  description?: string;
  domain?: string;
  domainPath?: string;
}

interface CheckoutCardProps {
  data: CheckoutData;
  sessionId: string;
}

export function CheckoutCard({ data, sessionId }: CheckoutCardProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCheckout() {
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: trimmed,
          idempotencyKey: `session-${sessionId}-${data.domain ?? 'unknown'}`,
          requirements: {
            businessName: data.businessName ?? '',
            description: data.description ?? '',
            desiredDomain: data.domain ?? '',
            domainPath: data.domainPath ?? 'new',
          },
        }),
      });
      const json = (await res.json()) as { url?: string; redirectTo?: string; error?: string };
      if (json.url) {
        window.open(json.url, '_blank', 'noopener');
      } else if (json.redirectTo) {
        window.open(json.redirectTo, '_blank', 'noopener');
      } else {
        setError(json.error ?? 'Checkout failed — please try again.');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${styles.actionCard} ${styles.checkoutCard}`}>
      <div className={styles.actionCardTitle}>Ready to build your site!</div>
      {data.businessName && (
        <div className={styles.checkoutDetail}>
          <span className={styles.checkoutLabel}>Site name</span>
          <span className={styles.checkoutValue}>{data.businessName}</span>
        </div>
      )}
      {data.domain && (
        <div className={styles.checkoutDetail}>
          <span className={styles.checkoutLabel}>Domain</span>
          <span className={styles.checkoutValue}>{data.domain}</span>
        </div>
      )}
      <div className={styles.checkoutPriceRow}>
        <span className={styles.checkoutPrice}>$89</span>
        <span className={styles.checkoutPriceDesc}>first month · then $29/mo</span>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
        Includes AI build + domain registration. Cancel anytime.
      </div>
      <input
        type="email"
        className={styles.checkoutEmailInput}
        placeholder="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCheckout();
        }}
        disabled={loading}
      />
      {error && <div className={styles.checkoutError}>{error}</div>}
      <button
        className={styles.checkoutBtn}
        onClick={handleCheckout}
        disabled={loading || !email.trim() || !data.domain}
      >
        {loading ? 'Creating checkout…' : 'Proceed to Checkout →'}
      </button>
    </div>
  );
}
