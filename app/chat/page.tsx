'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { CinematicBackground } from '@/components/chat/CinematicBackground';
import { EmptyState } from '@/components/chat/EmptyState';
import { Suggestions } from '@/components/chat/Suggestions';
import styles from './chat.module.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const gsap: any;

const SUGGESTIONS = [
  'Build me a website',
  'Search for a domain',
  'How does the agent swarm work?',
  'How much does a website cost?',
];

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [aiError, setAiError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [paywallHit, setPaywallHit] = useState<{ used: number; limit: number; upgradeUrl: string } | null>(null);
  const [freeMessagesUsed, setFreeMessagesUsed] = useState(0);
  const FREE_LIMIT = 10;

  const sessionIdRef = useRef('');
  const resumeChatIdRef = useRef('');

  useEffect(() => {
    // Resume mode: ?resume=<sessionKey> restores a saved session
    const resumeKey = searchParams.get('resume');
    if (resumeKey) {
      resumeChatIdRef.current = resumeKey;
      const id = resumeKey;
      localStorage.setItem('eve-session', id);
      sessionIdRef.current = id;
      setSessionId(id);
      setIsReturningUser(true);
      return;
    }

    const existing = localStorage.getItem('eve-session');
    const id = existing ?? crypto.randomUUID();
    if (!existing) {
      localStorage.setItem('eve-session', id);
    } else {
      setIsReturningUser(true);
    }
    sessionIdRef.current = id;
    setSessionId(id);
  }, [searchParams]);

  const transportRef = useRef(
    new DefaultChatTransport({
      api: '/api/chat',
      fetch: async (url, options) => {
        const fetchHeaders = new Headers(options?.headers || {});
        if (sessionIdRef.current) {
          fetchHeaders.set('x-eve-session', sessionIdRef.current);
        }
        if (resumeChatIdRef.current) {
          fetchHeaders.set('x-eve-chat-id', resumeChatIdRef.current);
        }
        const res = await fetch(url, { ...options, headers: fetchHeaders });
        if (res.status === 402) {
          const data = await res.json().catch(() => ({}));
          setPaywallHit({
            used: data.used ?? 0,
            limit: data.limit ?? 10,
            upgradeUrl: data.upgradeUrl ?? '/#hire',
          });
          throw new Error(data.message ?? 'Free message limit reached');
        }
        return res;
      },
    }),
  );

  const { messages, sendMessage, status } = useChat({
    id: String(chatKey),
    transport: transportRef.current,
    onError: (err) => setAiError(err.message ?? 'Connection error'),
  });

  const isSubmitting = status === 'submitted' || status === 'streaming';
  const userMessageCount = messages.filter((m) => m.role === 'user').length;

  useEffect(() => {
    setFreeMessagesUsed(userMessageCount);
  }, [userMessageCount]);

  // Show auth prompt after first message in anonymous mode
  useEffect(() => {
    const userMsgs = messages.filter((m) => m.role === 'user');
    if (userMsgs.length === 1 && !showAuthPrompt) {
      // Check if user is already authenticated (has session cookie)
      // If not, show the prompt after a short delay
      const timer = setTimeout(() => setShowAuthPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [messages, showAuthPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // GSAP Entry Animations
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof gsap !== 'undefined') {
        gsap.from(`.${styles.header}`, { opacity: 0, y: -20, duration: 1, ease: 'power3.out' });
        gsap.from(`.${styles.inputArea}`, { opacity: 0, y: 20, duration: 1, delay: 0.2, ease: 'power3.out' });
        gsap.from(`.${styles.suggestionBtn}`, {
          opacity: 0,
          scale: 0.9,
          duration: 0.8,
          delay: 0.4,
          stagger: 0.1,
          ease: 'back.out(1.7)'
        });
      }
    }, 100); // Small delay to ensure GSAP script from CDN is ready
    return () => clearTimeout(timer);
  }, [chatKey]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;
    setInputValue('');
    setAiError('');
    setShowAuthPrompt(false);
    sendMessage({ text: trimmed });
  }

  function startFresh() {
    const id = crypto.randomUUID();
    localStorage.setItem('eve-session', id);
    sessionIdRef.current = id;
    setSessionId(id);
    setIsReturningUser(false);
    setAiError('');
    setShowAuthPrompt(false);
    setPaywallHit(null);
    resumeChatIdRef.current = '';
    setChatKey((k) => k + 1);
  }

  return (
    <div className={styles.chatPage}>
      <CinematicBackground />
      <ChatHeader onStartFresh={startFresh} />

      <div className={styles.messages}>
        {messages.length === 0 ? (
          <EmptyState
            isReturningUser={isReturningUser}
            onStartFresh={startFresh}
          />
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg as any}
              sessionId={sessionId}
              onDomainSelect={(domain) => {
                submit(`I'd like to use ${domain}. What else do you need to know before you can start building my site?`);
              }}
            />
          ))
        )}

        {status === 'submitted' && (
          <div className={`${styles.message} ${styles.messageAssistant}`}>
            <div className={styles.msgAvatar}>🤖</div>
            <div className={styles.typingBubble}>
              <TypingIndicator />
            </div>
          </div>
        )}

        {showAuthPrompt && (
          <div className={styles.message} style={{ justifyContent: 'center' }}>
            <div style={{
              textAlign: 'center',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              background: 'rgba(0, 217, 255, 0.05)',
              maxWidth: '400px',
            }}>
              <p style={{ color: 'var(--fg)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                Want to save this conversation?
              </p>
              <a
                href="/api/auth/signin/github"
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--cyan), var(--coral))',
                  color: 'white',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                }}
              >
                Sign in to save
              </a>
              <button
                onClick={() => setShowAuthPrompt(false)}
                style={{
                  display: 'block',
                  margin: '0.5rem auto 0',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Continue without saving
              </button>
            </div>
          </div>
        )}

        {paywallHit && (
          <div className={styles.message} style={{ justifyContent: 'center' }}>
            <div style={{
              textAlign: 'center',
              padding: '1.5rem 2rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 107, 107, 0.4)',
              background: 'rgba(255, 107, 107, 0.08)',
              maxWidth: '420px',
            }}>
              <p style={{ color: 'var(--fg)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Free messages used up
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                You&apos;ve used all {paywallHit.limit} free messages with Eve.
                Sign up or upgrade to keep building.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href={paywallHit.upgradeUrl}
                  style={{
                    display: 'inline-block',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--cyan), var(--coral))',
                    color: 'white',
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                  }}
                >
                  Get a website — $89/mo
                </a>
                <a
                  href="/api/auth/signin/github"
                  style={{
                    display: 'inline-block',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 217, 255, 0.4)',
                    color: 'var(--cyan)',
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                  }}
                >
                  Sign in
                </a>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length === 0 && (
        <Suggestions
          suggestions={SUGGESTIONS}
          onSelect={submit}
        />
      )}

      <div style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
        {aiError && <div className={styles.errorBanner}>⚠ {aiError}</div>}

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={submit}
          isSubmitting={isSubmitting}
        />

        {!paywallHit && messages.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '0.35rem 0',
            fontSize: '0.7rem',
            color: freeMessagesUsed >= FREE_LIMIT - 2 ? 'var(--coral)' : 'var(--muted)',
          }}>
            {freeMessagesUsed}/{FREE_LIMIT} free messages
          </div>
        )}
      </div>
    </div>
  );
}
