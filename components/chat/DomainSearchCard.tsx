'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '@/app/chat/chat.module.css';
import { DomainResultsCard, type DomainResult } from './DomainResultsCard';

interface DomainSearchCardProps {
  keyword: string;
  onSelect: (domain: string) => void;
}

type SearchState =
  | { phase: 'checking' }
  | { phase: 'done'; results: DomainResult[] }
  | { phase: 'error'; message: string; retryable: boolean };

/**
 * Renders a `domain-search-pending` action block: shows a live "checking"
 * state while the server sweeps Porkbun (rate-limited ~1 req/10s, so a
 * 3-TLD sweep takes ~20s), then swaps in the results card. The fetch joins
 * the sweep the chat turn already started server-side, so no extra Porkbun
 * quota is spent.
 */
export function DomainSearchCard({ keyword, onSelect }: DomainSearchCardProps) {
  const [state, setState] = useState<SearchState>({ phase: 'checking' });
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async () => {
    setState({ phase: 'checking' });
    setElapsed(0);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(keyword)}`, {
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && Array.isArray(data.results)) {
        setState({ phase: 'done', results: data.results });
        return;
      }

      if (res.status === 503) {
        setState({
          phase: 'error',
          message:
            'Domain search is not configured right now. You can still continue — Eve will sort out the domain with you before building.',
          retryable: false,
        });
        return;
      }

      setState({
        phase: 'error',
        message:
          typeof data.error === 'string'
            ? data.error
            : 'Domain search hit a snag — give it another try.',
        retryable: true,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState({
        phase: 'error',
        message: 'Domain search timed out — please try again.',
        retryable: true,
      });
    }
  }, [keyword]);

  useEffect(() => {
    runSearch();
    return () => abortRef.current?.abort();
  }, [runSearch]);

  // Elapsed-seconds ticker so the ~20s wait reads as progress, not a hang.
  useEffect(() => {
    if (state.phase !== 'checking') return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state.phase]);

  if (state.phase === 'done') {
    return <DomainResultsCard keyword={keyword} results={state.results} onSelect={onSelect} />;
  }

  if (state.phase === 'error') {
    return (
      <div className={styles.actionCard}>
        <div className={styles.actionCardTitle}>Domains matching &ldquo;{keyword}&rdquo;</div>
        <div className={styles.domainSearchError}>{state.message}</div>
        {state.retryable && (
          <button type="button" className={styles.domainRetryBtn} onClick={runSearch}>
            Retry search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.actionCard} aria-live="polite">
      <div className={styles.actionCardTitle}>Domains matching &ldquo;{keyword}&rdquo;</div>
      <div className={styles.domainChecking}>
        <span className={styles.domainCheckingDot} />
        <span>
          Checking availability across .com, .co and .io — registrar rate limits make this take
          about 20 seconds{elapsed > 0 ? ` (${elapsed}s)` : ''}…
        </span>
      </div>
    </div>
  );
}
