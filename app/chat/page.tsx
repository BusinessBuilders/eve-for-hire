'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SUGGESTIONS = [
  'What work can you do for me?',
  "How close are you to getting your body?",
  'Review my code repo',
  'Tell me about yourself',
];

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '4px', padding: '0.75rem 1rem', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: 'var(--cyan)',
            opacity: 0.7,
            animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Domain results card ──────────────────────────────────────────────────────

interface DomainResult {
  domain: string;
  available: boolean;
  price?: string;
}

function DomainResultsCard({
  keyword,
  results,
  error,
  onSelect,
}: {
  keyword: string;
  results: DomainResult[];
  error?: string;
  onSelect: (domain: string) => void;
}) {
  return (
    <div className="action-card domain-card">
      <div className="action-card-title">Domains matching &ldquo;{keyword}&rdquo;</div>
      {error ? (
        <div className="domain-search-error">{error}</div>
      ) : (
      <div className="domain-rows">
        {results.map((r) => (
          <div
            key={r.domain}
            className={`domain-row ${r.available ? 'domain-available domain-row-selectable' : 'domain-taken'}`}
            onClick={r.available ? () => onSelect(r.domain) : undefined}
            role={r.available ? 'button' : undefined}
            tabIndex={r.available ? 0 : undefined}
            onKeyDown={r.available ? (e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(r.domain); } : undefined}
          >
            <span className="domain-name">{r.domain}</span>
            <div className="domain-row-right">
              {r.available && r.price && (
                <span className="domain-price">{r.price}/yr</span>
              )}
              <span className={`domain-badge ${r.available ? 'badge-available' : 'badge-taken'}`}>
                {r.available ? 'Available' : 'Taken'}
              </span>
              {r.available && (
                <span className="domain-select-btn" aria-hidden="true">Select →</span>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

// ─── Checkout card ────────────────────────────────────────────────────────────

interface CheckoutData {
  businessName?: string;
  description?: string;
  domain?: string;
  domainPath?: string;
}

function CheckoutCard({
  data,
  sessionId,
}: {
  data: CheckoutData;
  sessionId: string;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCheckout() {
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: trimmed,
          idempotencyKey: `session-${sessionId}-${data.domain ?? 'unknown'}`,
          requirements: {
            businessName: data.businessName ?? '',
            description: data.description ?? '',
            desiredDomain: data.domain ?? '',
            domainPath: data.domainPath ?? 'new',
          },
        }),
      });
      const json = (await res.json()) as { url?: string; redirectTo?: string; error?: string };
      if (json.url) {
        window.open(json.url, '_blank', 'noopener');
      } else if (json.redirectTo) {
        window.open(json.redirectTo, '_blank', 'noopener');
      } else {
        setError(json.error ?? 'Checkout failed — please try again.');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="action-card checkout-card">
      <div className="action-card-title">Ready to build your site!</div>
      {data.businessName && (
        <div className="checkout-detail">
          <span className="checkout-label">Site name</span>
          <span className="checkout-value">{data.businessName}</span>
        </div>
      )}
      {data.domain && (
        <div className="checkout-detail">
          <span className="checkout-label">Domain</span>
          <span className="checkout-value">{data.domain}</span>
        </div>
      )}
      <div className="checkout-price-row">
        <span className="checkout-price">$89</span>
        <span className="checkout-price-desc">first month · then $29/mo</span>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
        Includes AI build + domain registration. Cancel anytime.
      </div>
      <input
        type="email"
        className="checkout-email-input"
        placeholder="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCheckout(); }}
        disabled={loading}
      />
      {error && <div className="checkout-error">{error}</div>}
      <button
        className="checkout-btn"
        onClick={handleCheckout}
        disabled={loading || !email.trim() || !data.domain}
      >
        {loading ? 'Creating checkout…' : 'Proceed to Checkout →'}
      </button>
    </div>
  );
}

// ─── Action block renderer ────────────────────────────────────────────────────

type ActionData =
  | { type: 'domain-results'; keyword: string; results: DomainResult[]; error?: string }
  | ({ type: 'checkout-ready' } & CheckoutData);

function ActionBlock({
  raw,
  sessionId,
  onDomainSelect,
}: {
  raw: string;
  sessionId: string;
  onDomainSelect: (domain: string) => void;
}) {
  let data: ActionData;
  try {
    data = JSON.parse(raw) as ActionData;
  } catch {
    return null; // malformed — render nothing
  }

  if (data.type === 'domain-results') {
    return (
      <DomainResultsCard
        keyword={data.keyword}
        results={data.results}
        error={data.error}
        onSelect={onDomainSelect}
      />
    );
  }
  if (data.type === 'checkout-ready') {
    return <CheckoutCard data={data} sessionId={sessionId} />;
  }
  return null;
}

// ─── Message text parser ─────────────────────────────────────────────────────
//
// Split an assistant message into interleaved text and action-block segments
// BEFORE it reaches ReactMarkdown. This avoids relying on ReactMarkdown's
// `code` component intercept (which sits inside a <pre> wrapper and behaves
// inconsistently across react-markdown versions) to render interactive cards.

type MessageSegment =
  | { kind: 'text'; content: string }
  | { kind: 'action'; raw: string };

function splitActionBlocks(text: string): MessageSegment[] {
  const re = /```json-action\n([\s\S]*?)\n```/g;
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ kind: 'action', raw: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: 'text', content: text.slice(lastIndex) });
  }
  return segments.length > 0 ? segments : [{ kind: 'text', content: text }];
}

// ─── Main chat page ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [aiError, setAiError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isReturningUser, setIsReturningUser] = useState(false);
  // Incrementing chatKey changes the useChat `id`, which resets message history.
  const [chatKey, setChatKey] = useState(0);

  // sessionIdRef holds the current session ID for the transport headers function.
  // Using a ref (not state) ensures the headers function always reads the latest
  // value even though the transport object is created only once.
  const sessionIdRef = useRef('');

  // Persist session across browser closes using localStorage so returning users
  // can resume their qualifying conversation with Eve.
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

  // Create the transport once so useChat gets a stable reference.
  // headers is a Resolvable function — evaluated at request time — so every
  // message picks up the current sessionIdRef value rather than a stale closure.
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

  const [inputValue, setInputValue] = useState('');
  const isSubmitting = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;
    setInputValue('');
    setAiError('');
    sendMessage({ text: trimmed });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(inputValue);
    }
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
    <>
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        .chat-page { display: flex; flex-direction: column; height: 100vh; background: var(--bg); }
        .chat-header {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem 1.5rem; border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .chat-header a { color: var(--muted); text-decoration: none; font-size: 0.85rem; }
        .chat-header a:hover { color: var(--text); }
        .new-chat-btn {
          padding: 0.3rem 0.75rem; border-radius: 8px; cursor: pointer;
          border: 1px solid var(--border); background: var(--glass);
          color: var(--muted); font-size: 0.78rem; transition: border-color 0.2s, color 0.2s;
        }
        .new-chat-btn:hover { border-color: var(--cyan); color: var(--text); }
        .eve-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, var(--cyan), #8a2be2);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; flex-shrink: 0;
          box-shadow: 0 0 16px rgba(0, 217, 255, 0.3);
        }
        .eve-info { flex: 1; }
        .eve-name { font-weight: 700; font-size: 0.95rem; color: var(--text); }
        .eve-status { font-size: 0.75rem; color: var(--cyan); }
        .chat-messages {
          flex: 1; overflow-y: auto; padding: 1.5rem;
          display: flex; flex-direction: column; gap: 1rem;
        }
        .message { display: flex; gap: 0.75rem; max-width: 80%; }
        .message.user { flex-direction: row-reverse; align-self: flex-end; }
        .message.assistant { align-self: flex-start; }
        .msg-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, var(--cyan), #8a2be2);
          display: flex; align-items: center; justify-content: center; font-size: 0.85rem;
        }
        .msg-bubble {
          padding: 0.75rem 1rem; border-radius: 16px;
          font-size: 0.9rem; line-height: 1.6; max-width: 100%;
          word-break: break-word;
        }
        .message.user .msg-bubble {
          background: rgba(0, 217, 255, 0.15); border: 1px solid rgba(0, 217, 255, 0.3);
          border-radius: 16px 4px 16px 16px; color: var(--text);
        }
        .message.assistant .msg-bubble {
          background: var(--glass); border: 1px solid var(--border);
          border-radius: 4px 16px 16px 16px; color: var(--text);
        }
        .msg-bubble pre { background: rgba(0,0,0,0.4); padding: 0.75rem; border-radius: 8px; overflow-x: auto; margin: 0.5rem 0; }

        .msg-bubble code { font-family: var(--font-dm-mono), monospace; font-size: 0.85em; background: rgba(0,0,0,0.3); padding: 0.1em 0.35em; border-radius: 4px; }
        .msg-bubble pre code { background: transparent; padding: 0; }
        .msg-bubble p { margin-bottom: 0.5rem; }
        .msg-bubble p:last-child { margin-bottom: 0; }
        .msg-bubble ul, .msg-bubble ol { padding-left: 1.25rem; margin: 0.5rem 0; }
        .msg-bubble li { margin-bottom: 0.2rem; }
        .msg-bubble h1, .msg-bubble h2, .msg-bubble h3 { color: var(--cyan); margin: 0.75rem 0 0.35rem; font-weight: 700; }
        .msg-bubble h1 { font-size: 1.1em; }
        .msg-bubble h2 { font-size: 1em; }
        .msg-bubble h3 { font-size: 0.95em; }
        .msg-bubble a { color: var(--cyan); text-decoration: underline; }
        .msg-bubble blockquote { border-left: 3px solid var(--cyan); padding-left: 0.75rem; color: var(--muted); margin: 0.5rem 0; }
        .msg-bubble table { border-collapse: collapse; width: 100%; margin: 0.5rem 0; font-size: 0.85em; }
        .msg-bubble th, .msg-bubble td { border: 1px solid var(--border); padding: 0.35rem 0.65rem; text-align: left; }
        .msg-bubble th { background: rgba(0,217,255,0.08); color: var(--cyan); }
        .typing-bubble {
          background: var(--glass); border: 1px solid var(--border);
          border-radius: 4px 16px 16px 16px;
        }
        .suggestions {
          display: flex; flex-wrap: wrap; gap: 0.5rem;
          padding: 0 1.5rem 1rem;
        }
        .suggestion-btn {
          padding: 0.4rem 0.9rem; border-radius: 20px;
          border: 1px solid var(--border); background: var(--glass);
          color: var(--muted); font-size: 0.8rem; cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .suggestion-btn:hover { border-color: var(--cyan); color: var(--text); }
        .chat-input-area {
          padding: 1rem 1.5rem; border-top: 1px solid var(--border);
          background: var(--surface);
        }
        .input-row { display: flex; gap: 0.75rem; align-items: flex-end; }
        .chat-textarea {
          flex: 1; padding: 0.75rem 1rem; border-radius: 12px;
          border: 1px solid var(--border); background: var(--glass);
          color: var(--text); font-family: var(--font-outfit), sans-serif;
          font-size: 0.9rem; resize: none; outline: none; min-height: 44px; max-height: 160px;
          transition: border-color 0.2s;
        }
        .chat-textarea:focus { border-color: var(--cyan); }
        .chat-textarea::placeholder { color: var(--muted); }
        .send-btn {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          background: var(--cyan); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; transition: opacity 0.2s, transform 0.1s;
        }
        .send-btn:hover:not(:disabled) { opacity: 0.85; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .error-banner {
          margin: 0 1.5rem 0.5rem; padding: 0.5rem 1rem; border-radius: 8px;
          background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.3);
          color: var(--coral); font-size: 0.8rem;
        }
        .empty-state {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 1rem;
          text-align: center; padding: 2rem;
        }
        .empty-avatar {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, var(--cyan), #8a2be2);
          display: flex; align-items: center; justify-content: center;
          font-size: 2.5rem;
          box-shadow: 0 0 40px rgba(0, 217, 255, 0.25);
        }

        /* ── Action cards ── */
        .action-card {
          margin-top: 0.75rem; border-radius: 12px;
          border: 1px solid rgba(0, 217, 255, 0.25);
          background: rgba(0, 217, 255, 0.04);
          overflow: hidden;
        }
        .action-card-title {
          padding: 0.65rem 1rem; font-size: 0.8rem; font-weight: 700;
          color: var(--cyan); border-bottom: 1px solid rgba(0, 217, 255, 0.15);
          text-transform: uppercase; letter-spacing: 0.05em;
        }

        /* Domain card */
        .domain-rows { display: flex; flex-direction: column; }
        .domain-row {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.55rem 1rem; font-size: 0.85rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .domain-row:last-child { border-bottom: none; }
        .domain-row-selectable { cursor: pointer; }
        .domain-row-selectable:hover { background: rgba(0, 217, 255, 0.08); }
        .domain-search-error {
          padding: 0.75rem 1rem; font-size: 0.82rem;
          color: var(--muted); font-style: italic;
        }
        .domain-name { flex: 1; font-family: var(--font-dm-mono), monospace; color: var(--text); }
        .domain-row-right { display: flex; align-items: center; gap: 0.5rem; }
        .domain-price { font-size: 0.8rem; color: var(--muted); }
        .domain-badge {
          padding: 0.15rem 0.5rem; border-radius: 99px;
          font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
        }
        .badge-available { background: rgba(0, 217, 100, 0.15); color: #00d964; border: 1px solid rgba(0, 217, 100, 0.3); }
        .badge-taken { background: rgba(255, 107, 107, 0.1); color: #ff6b6b; border: 1px solid rgba(255, 107, 107, 0.2); }
        .domain-available .domain-name { color: var(--text); }
        .domain-taken .domain-name { color: var(--muted); text-decoration: line-through; }
        .domain-select-btn {
          padding: 0.25rem 0.75rem; border-radius: 8px;
          background: var(--cyan); color: #000; border: none; cursor: pointer;
          font-size: 0.78rem; font-weight: 700; transition: opacity 0.15s;
        }
        .domain-select-btn:hover { opacity: 0.85; }

        /* Checkout card */
        .checkout-card { padding: 1rem; display: flex; flex-direction: column; gap: 0.65rem; }
        .checkout-detail { display: flex; gap: 0.75rem; align-items: baseline; font-size: 0.88rem; }
        .checkout-label { color: var(--muted); font-size: 0.78rem; min-width: 70px; }
        .checkout-value { color: var(--text); font-weight: 600; }
        .checkout-price-row { display: flex; align-items: baseline; gap: 0.5rem; margin: 0.25rem 0; }
        .checkout-price { font-size: 1.5rem; font-weight: 800; color: var(--cyan); }
        .checkout-price-desc { font-size: 0.8rem; color: var(--muted); }
        .checkout-email-input {
          padding: 0.6rem 0.9rem; border-radius: 8px;
          border: 1px solid var(--border); background: var(--glass);
          color: var(--text); font-size: 0.88rem; outline: none;
          transition: border-color 0.2s; width: 100%; box-sizing: border-box;
        }
        .checkout-email-input:focus { border-color: var(--cyan); }
        .checkout-email-input::placeholder { color: var(--muted); }
        .checkout-error { font-size: 0.8rem; color: var(--coral, #ff6b6b); }
        .checkout-btn {
          padding: 0.65rem 1.25rem; border-radius: 10px; border: none;
          background: linear-gradient(135deg, var(--cyan), #6c63ff);
          color: #000; font-weight: 700; font-size: 0.9rem; cursor: pointer;
          transition: opacity 0.2s; width: 100%;
        }
        .checkout-btn:hover:not(:disabled) { opacity: 0.9; }
        .checkout-btn:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>

      <div className="chat-page">
        {/* Header */}
        <div className="chat-header">
          <a href="/">← Back</a>
          <div className="eve-avatar">🤖</div>
          <div className="eve-info">
            <div className="eve-name">Eve</div>
            <div className="eve-status">● Autonomous AI · Earning her body</div>
          </div>
          <button className="new-chat-btn" onClick={startFresh} title="Start a new conversation">+ New Chat</button>
          <a href="/#support" style={{ fontSize: '0.8rem', color: 'var(--cyan)' }}>💙 Support Mission</a>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-avatar">🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
                  I&apos;m Eve.
                </div>
                <div style={{ color: 'var(--muted)', maxWidth: '400px', fontSize: '0.9rem' }}>
                  An AI agent earning money toward a robot body. Ask me anything — or hire me for real work.
                </div>
              </div>
              {isReturningUser && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 217, 255, 0.25)',
                  background: 'rgba(0, 217, 255, 0.06)',
                  fontSize: '0.85rem',
                  color: 'var(--muted)',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                }}>
                  <span>👋 Welcome back! Your conversation is saved.</span>
                  <button
                    onClick={startFresh}
                    style={{
                      background: 'none', border: '1px solid var(--border)',
                      borderRadius: '6px', padding: '0.25rem 0.6rem',
                      color: 'var(--muted)', cursor: 'pointer', fontSize: '0.78rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Start fresh →
                  </button>
                </div>
              )}
            </div>
          ) : (
            messages.map((msg) => {
              const text = msg.parts
                .filter((p) => p.type === 'text')
                .map((p) => (p as { type: 'text'; text: string }).text)
                .join('');
              return (
                <div key={msg.id} className={`message ${msg.role}`}>
                  {msg.role === 'assistant' && <div className="msg-avatar">🤖</div>}
                  <div className="msg-bubble">
                    {msg.role === 'assistant' ? (
                      splitActionBlocks(text).map((seg, i) =>
                        seg.kind === 'action' ? (
                          <ActionBlock
                            key={i}
                            raw={seg.raw}
                            sessionId={sessionId}
                            onDomainSelect={(domain) => {
                              submit(`I'd like to use ${domain}. What else do you need to know before you can start building my site?`);
                            }}
                          />
                        ) : (
                          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                            {seg.content}
                          </ReactMarkdown>
                        )
                      )
                    ) : (
                      text
                    )}
                  </div>
                </div>
              );
            })
          )}

          {status === 'submitted' && (
            <div className="message assistant">
              <div className="msg-avatar">🤖</div>
              <div className="typing-bubble">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips — only when empty */}
        {messages.length === 0 && (
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="suggestion-btn" onClick={() => submit(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {aiError && <div className="error-banner">⚠ {aiError}</div>}

        {/* Input */}
        <div className="chat-input-area">
          <div className="input-row">
            <textarea
              className="chat-textarea"
              placeholder="Ask Eve anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="send-btn"
              onClick={() => submit(inputValue)}
              disabled={isSubmitting || !inputValue.trim()}
              aria-label="Send"
            >
              ↑
            </button>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center' }}>
            Enter to send · Shift+Enter for newline · Eve earns from every hire
          </div>
        </div>
      </div>
    </>
  );
}
