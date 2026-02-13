'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import useWebSocket from 'react-use-websocket';
import { dedupMerge } from '@chat/utils/message';
import type { ClientSendPayload, Message, ServerEnvelope, User } from '@chat/types/types';

function wsOriginPath(conversationId: string) {
    const base = process.env.NEXT_PUBLIC_WS_HOST;
    if (base) {
      const wsBase = base.replace(/^http/i, 'ws');
      return `${wsBase.replace(/\/+$/, '')}/ws/${conversationId}/`;
    }
    const origin = window.location.origin.replace(/^http/i, 'ws');
    return `${origin}/ws/${conversationId}/`;
  }

export function useChatSocket(opts: {
  conversationId: string;
  me: User;
  other: User;
  initial: Message[];
}) {
  const { conversationId, me, other, initial } = opts;

  const [messages, setMessages] = useState<Message[]>(initial);
  const [unseen, setUnseen] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const url = useMemo(() => wsOriginPath(conversationId), [conversationId]);

  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(url, {
    share: false,
    shouldReconnect: () => true,
  });

  // 处理服务器推送
  useEffect(() => {
    if (!lastMessage?.data) return;
    let data: ServerEnvelope;
    try { 
      data = JSON.parse(lastMessage.data); 
    } catch { 
      return; 
    }
    if (data.type !== 'message.created') return;

    const { id, body, created_by_id, created_at, clientId } = data.payload;
    const isMine = created_by_id === me.id;

    setMessages(prev => {
      // 1) 优先用 clientId 命中并“就地升级”为已送达
      if (clientId) {
        const index = prev.findIndex(message => message.clientId === clientId);
        if (index >= 0) {
          const next = [...prev];
          next[index] = {
            ...next[index],
            id,
            created_at,
            status: 'sent',
          };
          return next;
        }
      }

      // 2) 没找到（比如对方发的消息 / 首次加载），补一条
      const newMsg: Message = {
        id,
        clientId,
        body,
        created_at,
        created_by: isMine ? me : other,
        sent_to: isMine ? other : me,
        status: 'sent',
      };
      return dedupMerge(prev, [newMsg]);
    });

    // 只有“对方发的消息”且当前不在底部时，才加未读
    const nearBottom = listRef.current ? (listRef.current.scrollHeight - listRef.current.scrollTop - listRef.current.clientHeight <= 80) : true;
    if (!isMine && !nearBottom) setUnseen(unread => unread + 1);
  }, [lastMessage, me, other]);

  const send = useCallback((body: string) => {
    const clientId = crypto.randomUUID(); //注意每条消息都会生成一个clientID, 而不是一个会话级id

    const optimistic: Message = {
      clientId,
      body,
      created_by: me,
      sent_to: other,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => dedupMerge(prev, [optimistic]));

    const payload: ClientSendPayload = {
      body,
      name: me.name,
      sent_to_id: other.id,
      conversation_id: conversationId,
      clientId,
    };
    sendJsonMessage({ event: 'chat_message', data: payload });
  }, [conversationId, me, other, sendJsonMessage]);

  const bindListRef = useCallback((el: HTMLDivElement | null) => { listRef.current = el; }, []);

  const resetUnseen = useCallback(() => setUnseen(0), []);

  return {
    messages,
    send,
    bindListRef,
    unseen,
    resetUnseen,
    readyState,
  };
}
