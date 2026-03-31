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

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [aiError, setAiError] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
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
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
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
