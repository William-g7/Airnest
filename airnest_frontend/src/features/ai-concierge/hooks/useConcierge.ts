'use client';

import { useState, useRef, useCallback } from 'react';
import type { ConciergeMessage } from '../types/types';

const MAX_ROUNDS = 6;
const MAX_MESSAGES = MAX_ROUNDS * 2;

interface UseConciergeOptions {
  propertyId: string;
  locale: string;
}

export interface UseConciergeReturn {
  messages: ConciergeMessage[];
  isStreaming: boolean;
  isLimitReached: boolean;
  error: string | null;
  sendMessage: (question: string) => void;
  stopGeneration: () => void;
  retry: () => void;
}

export function useConcierge({
  propertyId,
  locale,
}: UseConciergeOptions): UseConciergeReturn {
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastQuestionRef = useRef<string>('');
  const messagesRef = useRef<ConciergeMessage[]>(messages);
  messagesRef.current = messages;

  const userCount = messages.filter((m) => m.role === 'user').length;
  const isLimitReached = userCount >= MAX_ROUNDS;

  const streamResponse = useCallback(
    async (question: string, history: ConciergeMessage[]) => {
      setError(null);
      setIsStreaming(true);

      // Add user message + empty assistant placeholder
      const userMsg: ConciergeMessage = { role: 'user', content: question };
      const aiPlaceholder: ConciergeMessage = { role: 'assistant', content: '' };
      setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
      lastQuestionRef.current = question;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/ai/concierge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId,
            question,
            conversationHistory: history,
            locale,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        if (!res.body) {
          throw new Error('No response body');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (split by double newline)
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // Keep incomplete chunk

          for (const event of events) {
            const line = event.trim();
            if (!line.startsWith('data: ')) continue;

            const payload = line.slice(6); // Remove "data: "

            if (payload === '[DONE]') {
              // Stream finished
              continue;
            }

            try {
              const parsed = JSON.parse(payload);

              if (parsed.error) {
                setError(parsed.error);
                break;
              }

              if (parsed.content) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + parsed.content,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // User-initiated abort — mark as interrupted, keep partial content
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant') {
              updated[updated.length - 1] = {
                ...last,
                content: last.content || '',
                interrupted: true,
              } as ConciergeMessage & { interrupted?: boolean };
            }
            return updated;
          });
        } else {
          const msg =
            err instanceof Error ? err.message : 'Unknown error';
          setError(msg);
          // Remove the empty assistant placeholder on error
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant' && !last.content) {
              updated.pop();
            }
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [propertyId, locale],
  );

  const sendMessage = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isStreaming || isLimitReached) return;

      // Build history from current messages (exclude any in-flight AI placeholder)
      const history = messages.filter((m) => m.content.length > 0);
      streamResponse(trimmed, history);
    },
    [messages, isStreaming, isLimitReached, streamResponse],
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const retry = useCallback(() => {
    if (isStreaming || !lastQuestionRef.current) return;

    // Compute clean history from the ref (always up-to-date)
    const current = messagesRef.current.filter((m) => m.content.length > 0);
    // Remove the trailing failed pair (user + empty/error assistant)
    if (current[current.length - 1]?.role === 'assistant') current.pop();
    if (current[current.length - 1]?.role === 'user') current.pop();

    // Update UI: remove failed pair
    setMessages(current);
    setError(null);

    // Re-send with the clean history
    streamResponse(lastQuestionRef.current, current);
  }, [isStreaming, streamResponse]);

  return {
    messages,
    isStreaming,
    isLimitReached,
    error,
    sendMessage,
    stopGeneration,
    retry,
  };
}
