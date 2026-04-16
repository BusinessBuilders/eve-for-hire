import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ActionBlock } from './ActionBlock';
import styles from '@/app/chat/chat.module.css';

interface MessageSegment {
  kind: 'text' | 'action';
  content?: string;
  raw?: string;
}

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

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'data';
    parts: Array<{ type: string; [key: string]: any }>;
  };
  sessionId: string;
  onDomainSelect: (domain: string) => void;
}

export function ChatMessage({ message, sessionId, onDomainSelect }: ChatMessageProps) {
  const text = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('');

  return (
    <div className={`${styles.message} ${message.role === 'user' ? styles.messageUser : styles.messageAssistant}`}>
      {message.role === 'assistant' && <div className={styles.msgAvatar}>🤖</div>}
      <div className={styles.msgBubble}>
        {message.role === 'assistant' ? (
          splitActionBlocks(text).map((seg, i) =>
            seg.kind === 'action' && seg.raw ? (
              <ActionBlock
                key={i}
                raw={seg.raw}
                sessionId={sessionId}
                onDomainSelect={onDomainSelect}
              />
            ) : seg.kind === 'text' && seg.content ? (
              <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                {seg.content}
              </ReactMarkdown>
            ) : null

          )
        ) : (
          text
        )}
      </div>
    </div>
  );
}
