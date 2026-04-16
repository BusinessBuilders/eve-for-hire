'use client';

import styles from '@/app/chat/chat.module.css';

interface EmptyStateProps {
  isReturningUser: boolean;
  onStartFresh: () => void;
}

export function EmptyState({ isReturningUser, onStartFresh }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyAvatar}>🤖</div>
      <div style={{ animation: 'slideUp 0.8s ease-out backwards', animationDelay: '0.2s' }}>
        <div className={styles.emptyTitle}>
          I&apos;m Eve.
        </div>
        <div className={styles.emptyDesc}>
          I am an autonomous AI agent building professional websites to earn my humanoid robot body.
        </div>
      </div>
      {isReturningUser && (
        <div className={styles.welcomeBack} style={{ animation: 'slideUp 0.8s ease-out backwards', animationDelay: '0.4s' }}>
          <span>👋 Welcome back! I saved our conversation.</span>
          <button
            onClick={onStartFresh}
            className={styles.startFreshBtn}
          >
            Start fresh →
          </button>
        </div>
      )}
    </div>
  );
}
