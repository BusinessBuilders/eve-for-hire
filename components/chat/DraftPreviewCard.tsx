import styles from '@/app/chat/chat.module.css';

export interface DraftPreviewData {
  token: string;
  url: string;
  businessName?: string;
}

interface DraftPreviewCardProps {
  data: DraftPreviewData;
}

export function DraftPreviewCard({ data }: DraftPreviewCardProps) {
  const label = data.businessName
    ? `Preview for ${data.businessName}`
    : 'Preview your generated draft';

  return (
    <div className={`${styles.actionCard} ${styles.draftPreviewCard}`}>
      <div className={styles.actionCardTitle}>Draft Preview Ready</div>
      <div className={styles.draftPreviewBody}>
        <p className={styles.draftPreviewText}>{label}</p>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.draftPreviewLink}
          aria-label={label}
        >
          Open Draft Preview →
        </a>
      </div>
    </div>
  );
}
