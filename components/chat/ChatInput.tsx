import styles from '@/app/chat/chat.module.css';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
}

export function ChatInput({ value, onChange, onSubmit, isSubmitting }: ChatInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(value);
    }
  }

  return (
    <div className={styles.inputArea}>
      <div className={styles.inputRow}>
        <textarea
          className={styles.textarea}
          placeholder="Ask Eve anything..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className={styles.sendBtn}
          onClick={() => onSubmit(value)}
          disabled={isSubmitting || !value.trim()}
          aria-label="Send"
        >
          ↑
        </button>
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center' }}>
        Enter to send · Shift+Enter for newline · Eve earns from every hire
      </div>
    </div>
  );
}
