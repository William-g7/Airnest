'use client';

import { useEffect, useRef } from 'react';
import { ReadyState } from 'react-use-websocket';
import { useChatSocket } from '@chat/ws/useChatSocket';
import type { Conversation, Message, User } from '@chat/types/types';
import { isNearBottom } from '@chat/utils/message';

export default function ChatWindow(props: {
  me: User;
  other: User;
  conversation: Conversation;
  initialMessages: Message[];
}) {
  const { me, other, conversation, initialMessages } = props;
  const {
    messages, send, bindListRef, unseen, resetUnseen, readyState,
  } = useChatSocket({
    conversationId: conversation.id,
    me,
    other,
    initial: initialMessages,
  });

  const listDiv = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listDiv.current && isNearBottom(listDiv.current)) {
      listDiv.current.scrollTo({ top: listDiv.current.scrollHeight, behavior: 'auto' }); //如果已经在底部附近，就自动吸底
      resetUnseen();
    }
  }, [messages, resetUnseen]);

  return (
    <div className="flex flex-col h-[calc(100vh-150px)]">
      <div ref={(el) => { listDiv.current = el; bindListRef(el); }} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => {
          const isMine = m.created_by.id === me.id;
          const avatar = isMine ? me.avatar_url : other.avatar_url;
          return (
            <div key={m.id ?? m.clientId} className={`flex items-start gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
              {!isMine && (
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <img src={avatar || '/profile_pic_1.jpg'} alt="" className="object-cover w-full h-full" />
                </div>
              )}
              <div className={`max-w-[70%] py-3 px-4 rounded-2xl ${isMine ? 'bg-airbnb text-white rounded-tr-none' : 'bg-gray-200 rounded-tl-none'}`}>
                <p className="break-words">{m.body}</p>
                {m.status === 'pending' && <span className="ml-2 opacity-60 text-xs">…</span>}
                {m.status === 'failed' && <span className="ml-2 text-red-500 text-xs">failed</span>}
              </div>
              {isMine && (
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <img src={avatar || '/profile_pic_1.jpg'} alt="" className="object-cover w-full h-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {unseen > 0 && (
        <button
          type="button"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 rounded-full px-3 py-2 text-sm shadow bg-airbnb hover:bg-airbnb-dark text-white"
          onClick={() => {
            if (listDiv.current) {
              listDiv.current?.scrollTo({ top: listDiv.current.scrollHeight, behavior: 'smooth' });
            }
            resetUnseen();
          }}
          aria-label="Scroll to newest"
          title="New messages"
        >
          ↓ {unseen}
        </button>
      )}

      <div className="sticky bottom-0 bg-white px-4 py-4 border-t border-gray-200 z-10">
        <ChatInput onSend={send} disabled={readyState !== ReadyState.OPEN} />
      </div>
    </div>
  );
}

function ChatInput({ onSend, disabled }: { onSend: (v: string) => void; disabled: boolean; }) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <div className="flex items-center space-x-2 max-w-[1500px] mx-auto">
      <input
        ref={ref}
        type="text"
        placeholder="Type a message"
        className="flex-1 py-3 px-4 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-airbnb"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const val = ref.current?.value?.trim();
            if (val) { 
              onSend(val); 
              if (ref.current) ref.current.value = ''; 
            }
          }
        }}
      />
      <button
        onClick={() => { const val = ref.current?.value?.trim(); 
          if (val) { 
            onSend(val); 
            if (ref.current) ref.current.value=''; 
          } 
        }}
        disabled={disabled}
        className="p-3 bg-airbnb text-white rounded-full disabled:opacity-50 hover:bg-airbnb_dark transition-colors"
        title={disabled ? 'Connecting...' : ''}
      >
        ➤
      </button>
    </div>
  );
}
