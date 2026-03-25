'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useConcierge } from '../hooks/useConcierge';
import ConciergeMessage from './ConciergeMessage';
import ConciergeInput from './ConciergeInput';

interface ConciergePanelProps {
  propertyId: string;
  onClose: () => void;
}

export default function ConciergePanel({
  propertyId,
  onClose,
}: ConciergePanelProps) {
  const t = useTranslations('concierge');
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isStreaming,
    isLimitReached,
    error,
    sendMessage,
    stopGeneration,
    retry,
  } = useConcierge({ propertyId, locale });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed bottom-24 right-6 w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff385c] to-[#d40027] flex items-center justify-center">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
              <path d="M18 14a6 6 0 0 0-12 0v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">
            {t('title')}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-0"
      >
        {messages.length === 0 && !error && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400 text-center px-6 leading-relaxed">
              {t('emptyState')}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isLastAssistant =
            msg.role === 'assistant' && i === messages.length - 1;
          return (
            <ConciergeMessage
              key={i}
              role={msg.role}
              content={msg.content}
              isStreaming={isLastAssistant && isStreaming}
              interrupted={
                !isStreaming &&
                isLastAssistant &&
                (msg as any).interrupted === true
              }
              interruptedLabel={t('interrupted')}
            />
          );
        })}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center gap-2 py-3">
            <p className="text-sm text-gray-500 text-center">{t('error')}</p>
            <button
              onClick={retry}
              className="text-sm text-[#ff385c] hover:text-[#d40027] font-medium transition-colors"
            >
              {t('retry')}
            </button>
          </div>
        )}

        {/* Limit reached */}
        {isLimitReached && !isStreaming && (
          <div className="flex flex-col items-center gap-2 py-3 mt-2">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              {t('limitReached')}
            </p>
            <a
              href={`/${locale}/inbox`}
              className="inline-flex items-center gap-1 text-sm text-[#ff385c] hover:text-[#d40027] font-medium transition-colors"
            >
              {t('contactHost')}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          </div>
        )}
      </div>

      {/* Input */}
      <ConciergeInput
        onSend={sendMessage}
        onStop={stopGeneration}
        isStreaming={isStreaming}
        disabled={isLimitReached}
      />
    </motion.div>
  );
}
