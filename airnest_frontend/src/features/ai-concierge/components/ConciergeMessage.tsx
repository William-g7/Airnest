'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface ConciergeMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  interrupted?: boolean;
  interruptedLabel?: string;
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="my-1">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  h3: ({ children }) => <p className="font-semibold my-1">{children}</p>,
  h4: ({ children }) => <p className="font-semibold my-1">{children}</p>,
  code: ({ children, className }) => {
    // Block code (has language className) vs inline code
    const isBlock = !!className;
    return isBlock ? (
      <pre className="bg-gray-200 rounded px-2 py-1.5 my-1 text-xs overflow-x-auto">
        <code>{children}</code>
      </pre>
    ) : (
      <code className="bg-gray-200 rounded px-1 py-0.5 text-xs">{children}</code>
    );
  },
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#ff385c] underline">
      {children}
    </a>
  ),
};

export default memo(function ConciergeMessage({
  role,
  content,
  isStreaming,
  interrupted,
  interruptedLabel,
}: ConciergeMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff385c] to-[#d40027] flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
            <path d="M18 14a6 6 0 0 0-12 0v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4z" />
          </svg>
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-[#ff385c] text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}
      >
        {isUser ? (
          <p>{content}</p>
        ) : (
          <div>
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {content}
              </ReactMarkdown>
            ) : null}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 animate-pulse rounded-sm align-text-bottom" />
            )}
          </div>
        )}
        {interrupted && (
          <p className="text-xs text-gray-400 mt-1 italic">{interruptedLabel}</p>
        )}
      </div>
    </div>
  );
});
