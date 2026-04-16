'use client';

import styles from '@/app/chat/chat.module.css';

interface SuggestionsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export function Suggestions({ suggestions, onSelect }: SuggestionsProps) {
  return (
    <div className={styles.suggestions}>
      {suggestions.map((s) => (
        <button
          key={s}
          className={styles.suggestionBtn}
          onClick={() => onSelect(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
