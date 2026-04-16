import styles from '@/app/chat/chat.module.css';

export function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '4px', padding: '0.75rem 1rem', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`${styles.typingDot} ${styles[`typingDot${i}` as keyof typeof styles]}`}
        />
      ))}
    </div>
  );
}
