'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface ConciergeInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
}

export default function ConciergeInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
}: ConciergeInputProps) {
  const t = useTranslations('concierge');
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue('');
    // Refocus after sending
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value, isStreaming, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="border-t border-gray-100 px-3 py-2.5 bg-white">
      {isStreaming ? (
        <button
          onClick={onStop}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-50"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          {t('stop')}
        </button>
      ) : (
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? '' : t('inputPlaceholder')}
            disabled={disabled}
            rows={1}
            maxLength={500}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c]/20 disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-400 max-h-20 overflow-y-auto"
            style={{ minHeight: '36px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 80) + 'px';
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-[#ff385c] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d40027] transition-colors"
            aria-label={t('send')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
