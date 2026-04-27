'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './preview.module.css';

interface DraftResponse {
  businessName: string;
  tagline?: string | null;
  category?: string | null;
  primaryColor?: string | null;
  heroHtml: string;
  viewCount: number;
  ctaClicked: boolean;
  expiresAt: string;
}

export default function DraftPreviewPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [ctaDone, setCtaDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Invalid draft token.');
      return;
    }
    let cancelled = false;

    async function loadDraft() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/draft/${encodeURIComponent(token)}`);
        const json = (await res.json()) as DraftResponse | { error?: string };
        if (!res.ok) {
          throw new Error('error' in json && json.error ? json.error : 'Could not load draft preview.');
        }
        if (!cancelled) {
          setDraft(json as DraftResponse);
          setCtaDone((json as DraftResponse).ctaClicked);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load draft preview.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDraft();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const expiresLabel = useMemo(() => {
    if (!draft?.expiresAt) return '';
    const parsed = new Date(draft.expiresAt);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString();
  }, [draft?.expiresAt]);

  const handleCta = useCallback(async () => {
    if (!token || ctaLoading || ctaDone) return;
    setCtaLoading(true);
    try {
      const res = await fetch(`/api/draft/${encodeURIComponent(token)}/cta`, {
        method: 'POST',
      });
      if (res.ok) {
        setCtaDone(true);
      }
    } finally {
      setCtaLoading(false);
    }
  }, [ctaDone, ctaLoading, token]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Draft Preview</h1>
        <p className={styles.subtitle}>Review your generated hero section before checkout.</p>
      </header>

      {loading && <p className={styles.status}>Loading preview…</p>}

      {!loading && error && (
        <section className={styles.card}>
          <p className={styles.error}>{error}</p>
          <Link href="/chat" className={styles.secondaryBtn}>
            Back to Chat
          </Link>
        </section>
      )}

      {!loading && draft && (
        <>
          <section className={styles.metaRow}>
            <article className={styles.card}>
              <h2 className={styles.cardTitle}>{draft.businessName}</h2>
              {draft.tagline && <p className={styles.tagline}>{draft.tagline}</p>}
              <dl className={styles.metaList}>
                {draft.category && (
                  <div>
                    <dt>Category</dt>
                    <dd>{draft.category}</dd>
                  </div>
                )}
                <div>
                  <dt>Views</dt>
                  <dd>{draft.viewCount}</dd>
                </div>
                {expiresLabel && (
                  <div>
                    <dt>Expires</dt>
                    <dd>{expiresLabel}</dd>
                  </div>
                )}
              </dl>
            </article>

            <article className={styles.card}>
              <h2 className={styles.cardTitle}>Next Step</h2>
              <p className={styles.helpText}>
                If this direction looks right, continue in chat to finalize your build and checkout.
              </p>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleCta}
                disabled={ctaLoading || ctaDone}
              >
                {ctaLoading ? 'Saving…' : ctaDone ? 'Saved ✓' : 'Looks Good'}
              </button>
              <Link href="/chat" className={styles.secondaryBtn}>
                Continue in Chat
              </Link>
            </article>
          </section>

          <section className={styles.previewFrameWrap} aria-label="Draft hero preview">
            <iframe
              title="Draft preview"
              className={styles.previewFrame}
              srcDoc={draft.heroHtml}
              sandbox="allow-same-origin"
            />
          </section>
        </>
      )}
    </main>
  );
}
