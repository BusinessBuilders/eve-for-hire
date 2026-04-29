'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

interface ChatSession {
  id: string;
  sessionKey: string;
  title: string | null;
  summary: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/chat/sessions')
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function formatDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function handleResume(sessionKey: string) {
    router.push(`/chat?resume=${encodeURIComponent(sessionKey)}`);
  }

  return (
    <div className={styles.dashboardPage}>
      <div className={styles.dashboardHeader}>
        <h1>DASHBOARD</h1>
        <a href="/chat" className={styles.backLink}>
          Back to Chat
        </a>
      </div>

      <div className={styles.section}>
        <h2>Saved Conversations</h2>

        {loading ? (
          <div className={styles.emptyState}>Loading...</div>
        ) : sessions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No saved conversations yet.</p>
            <p style={{ marginTop: '0.5rem' }}>
              <a
                href="/chat"
                style={{
                  color: 'var(--cyan)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Start a conversation with Eve
              </a>{' '}
              to get started.
            </p>
          </div>
        ) : (
          <div className={styles.chatList}>
            {sessions.map((s) => (
              <div
                key={s.id}
                className={styles.chatCard}
                onClick={() => handleResume(s.sessionKey)}
              >
                <div className={styles.chatInfo}>
                  <div className={styles.chatTitle}>
                    {s.title || 'Untitled Chat'}
                  </div>
                  <div className={styles.chatPreview}>
                    {s.summary || `${s.messageCount} messages`}
                  </div>
                </div>
                <div className={styles.chatMeta}>
                  <div className={styles.chatDate}>
                    {formatDate(s.lastMessageAt ?? s.createdAt)}
                  </div>
                  <div className={styles.chatCount}>
                    {s.messageCount} msg{s.messageCount !== 1 ? 's' : ''}
                  </div>
                  <button
                    className={styles.resumeBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResume(s.sessionKey);
                    }}
                  >
                    Resume
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
