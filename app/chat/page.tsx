'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { CinematicBackground } from '@/components/chat/CinematicBackground';
import styles from './chat.module.css';

const SUGGESTIONS = [
  'What work can you do for me?',
  "How close are you to getting your body?",
  'Review my code repo',
  'Tell me about yourself',
];

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [aiError, setAiError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [inputValue, setInputValue] = useState('');

  const sessionIdRef = useRef('');

  useEffect(() => {
    const existing = localStorage.getItem('eve-session');
    const id = existing ?? crypto.randomUUID();
    if (!existing) {
      localStorage.setItem('eve-session', id);
    } else {
      setIsReturningUser(true);
    }
    sessionIdRef.current = id;
    setSessionId(id);
  }, []);

  const transportRef = useRef(
    new DefaultChatTransport({
      api: '/api/chat',
      headers: (): Record<string, string> =>
        sessionIdRef.current ? { 'x-eve-session': sessionIdRef.current } : {},
    }),
  );

  const { messages, sendMessage, status } = useChat({
    id: String(chatKey),
    transport: transportRef.current,
    onError: (err) => setAiError(err.message ?? 'Connection error'),
  });

  const isSubmitting = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // GSAP Entry Animations
  useEffect(() => {
    if (typeof gsap !== 'undefined') {
      gsap.from(`.${styles.header}`, { opacity: 0, y: -20, duration: 1, ease: 'power3.out' });
      gsap.from(`.${styles.inputArea}`, { opacity: 0, y: 20, duration: 1, delay: 0.2, ease: 'power3.out' });
      gsap.from(`.${styles.suggestionBtn}`, { opacity: 0, scale: 0.9, duration: 0.8, delay: 0.4, stagger: 0.1, ease: 'back.out(1.7)' });
    }
  }, [chatKey]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;
    setInputValue('');
    setAiError('');
    sendMessage({ text: trimmed });
  }

  function startFresh() {
    const id = crypto.randomUUID();
    localStorage.setItem('eve-session', id);
    sessionIdRef.current = id;
    setSessionId(id);
    setIsReturningUser(false);
    setAiError('');
    setChatKey((k) => k + 1);
  }

  return (
    <div className={styles.chatPage}>
      <CinematicBackground />
      <ChatHeader onStartFresh={startFresh} />

      <div className={styles.messages}>
        {messages.length === 0 ? (
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
                  onClick={startFresh}
                  className={styles.startFreshBtn}
                >
                  Start fresh →
                </button>
              </div>
            )}
          </div>
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

        <div ref={messagesEndRef} />
      </div>

      {messages.length === 0 && (
        <div className={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <button key={s} className={styles.suggestionBtn} onClick={() => submit(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
        {aiError && <div className={styles.errorBanner}>⚠ {aiError}</div>}

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={submit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
