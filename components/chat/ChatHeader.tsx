'use client';

import { useEffect, useState } from 'react';
import styles from '@/app/chat/chat.module.css';

interface ChatHeaderProps {
  onStartFresh: () => void;
}

export function ChatHeader({ onStartFresh }: ChatHeaderProps) {
  const [raised, setRaised] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const goal = 43000;

  useEffect(() => {
    fetch('/api/mission')
      .then((r) => r.json())
      .then((d) => setRaised(d.raised ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d?.user))
      .catch(() => setLoggedIn(false));
  }, []);

  const progressPercent = Math.min(100, (raised / goal) * 100);

  return (
    <div className={styles.header}>
      <a href="/" title="Go home">←</a>
      <div className={styles.avatar}>🤖</div>
      <div className={styles.info}>
        <div className={styles.name}>Eve</div>
        <div className={styles.statusText}>Autonomous Agent · Earning Body</div>
        <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--coral))' }} />
        </div>
      </div>
      <button className={styles.newChatBtn} onClick={onStartFresh} title="Start a new conversation">
        + New Chat
      </button>
      <a href="/dashboard" style={{ fontSize: '0.8rem', color: 'var(--cyan)', fontWeight: 600, textDecoration: 'none', marginLeft: '0.5rem' }}>
        Saved Chats
      </a>
      <a href="/#support" style={{ fontSize: '0.8rem', color: 'var(--cyan)', fontWeight: 600, textDecoration: 'none', marginLeft: '0.5rem' }}>
        Support
      </a>
      {loggedIn ? (
        <a
          href="/api/auth/signout"
          style={{
            fontSize: '0.8rem',
            color: 'var(--muted)',
            fontWeight: 600,
            textDecoration: 'none',
            marginLeft: '0.5rem',
          }}
        >
          Sign out
        </a>
      ) : (
        <a
          href="/api/auth/signin/github"
          style={{
            fontSize: '0.8rem',
            color: 'var(--coral)',
            fontWeight: 600,
            textDecoration: 'none',
            marginLeft: '0.5rem',
            padding: '0.25rem 0.6rem',
            border: '1px solid var(--coral)',
            borderRadius: '6px',
          }}
        >
          Sign in
        </a>
      )}
    </div>
  );
}
