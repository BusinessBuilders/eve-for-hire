import styles from '@/app/chat/chat.module.css';

export interface DomainResult {
  domain: string;
  available: boolean;
  price?: string;
}

interface DomainResultsCardProps {
  keyword: string;
  results: DomainResult[];
  error?: string;
  onSelect: (domain: string) => void;
}

export function DomainResultsCard({
  keyword,
  results,
  error,
  onSelect,
}: DomainResultsCardProps) {
  return (
    <div className={styles.actionCard}>
      <div className={styles.actionCardTitle}>Domains matching &ldquo;{keyword}&rdquo;</div>
      {error ? (
        <div className={styles.domainSearchError}>{error}</div>
      ) : (
        <div className={styles.domainRows}>
          {results.map((r) => (
            <div
              key={r.domain}
              className={`${styles.domainRow} ${
                r.available ? `${styles.domainAvailable} ${styles.domainRowSelectable}` : styles.domainTaken
              }`}
              onClick={r.available ? () => onSelect(r.domain) : undefined}
              role={r.available ? 'button' : undefined}
              tabIndex={r.available ? 0 : undefined}
              onKeyDown={
                r.available
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') onSelect(r.domain);
                    }
                  : undefined
              }
            >
              <span className={styles.domainName}>{r.domain}</span>
              <div className={styles.domainRowRight}>
                {r.available && r.price && <span className={styles.domainPrice}>{r.price}/yr</span>}
                <span
                  className={`${styles.domainBadge} ${
                    r.available ? styles.badgeAvailable : styles.badgeTaken
                  }`}
                >
                  {r.available ? 'Available' : 'Taken'}
                </span>
                {r.available && (
                  <span className={styles.domainSelectBtn} aria-hidden="true">
                    Select →
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
