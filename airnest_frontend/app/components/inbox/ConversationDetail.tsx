'use client';

import { useEffect, useState, useRef } from 'react';
import { ConversationType } from '@/app/[locale]/inbox/page';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { MessageType } from '@/app/[locale]/inbox/[id]/page';
import { UserType } from '@/app/[locale]/inbox/page';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

interface ConversationDetailProps {
  token: string;
  userId: string;
  conversation: ConversationType;
  messages: MessageType[];
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({
  userId,
  token,
  messages,
  conversation,
}) => {
  const messagesDiv = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const myUser = conversation.users?.find(user => user.id == userId);
  const otherUser = conversation.users?.find(user => user.id != userId);
  const [realtimeMessages, setRealtimeMessages] = useState<MessageType[]>([]);

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    `${process.env.NEXT_PUBLIC_WS_HOST}/ws/${conversation.id}/?token=${token}`,
    {
      share: false,
      shouldReconnect: () => true,
    }
  );

  useEffect(() => {
    console.log('Connection state changed', readyState);
  }, [readyState]);

  useEffect(() => {
    if (
      lastJsonMessage &&
      typeof lastJsonMessage === 'object' &&
      'name' in lastJsonMessage &&
      'body' in lastJsonMessage
    ) {
      const message: MessageType = {
        id: '',
        name: lastJsonMessage.name as string,
        body: lastJsonMessage.body as string,
        sent_to: otherUser as UserType,
        created_by: myUser as UserType,
        conversationId: conversation.id,
      };

      setRealtimeMessages(realtimeMessages => [...realtimeMessages, message]);
    }

    scrollToBottom();
  }, [lastJsonMessage]);

  useEffect(() => {
    console.log('Messages:', messages);
    console.log('Realtime Messages:', realtimeMessages);
    scrollToBottom();
  }, [messages, realtimeMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      sendJsonMessage({
        event: 'chat_message',
        data: {
          body: newMessage,
          name: myUser?.name,
          sent_to_id: otherUser?.id,
          conversation_id: conversation.id,
        },
      });

      setNewMessage('');

      setTimeout(() => {
        scrollToBottom();
      }, 50);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('messageSentError'));
    }
  };

  const scrollToBottom = () => {
    if (messagesDiv.current) {
      messagesDiv.current.scrollTop = messagesDiv.current.scrollHeight;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const t = useTranslations('inbox');

  return (
    <div className="flex flex-col h-[calc(100vh-150px)]">
      {/* Chat messages area - fixed height with scroll */}
      <div ref={messagesDiv} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isMyMessage = message.created_by.name === myUser?.name;
          return (
            <div
              key={`message-${index}`}
              className={`flex items-start gap-3 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
            >
              {!isMyMessage && (
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={message.created_by.avatar_url || '/profile_pic_1.jpg'}
                    alt={message.created_by.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div
                className={`max-w-[70%] py-3 px-4 rounded-2xl ${
                  isMyMessage
                    ? 'bg-airbnb text-white rounded-tr-none'
                    : 'bg-gray-200 rounded-tl-none'
                }`}
              >
                <p className="break-words">{message.body}</p>
              </div>

              {isMyMessage && (
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={message.created_by.avatar_url || '/profile_pic_1.jpg'}
                    alt={message.created_by.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          );
        })}

        {realtimeMessages.map((message, index) => {
          const isMyMessage = message.name === myUser?.name;
          return (
            <div
              key={`realtime-${index}`}
              className={`flex items-start gap-3 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
            >
              {!isMyMessage && (
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={otherUser?.avatar_url || '/profile_pic_1.jpg'}
                    alt={message.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div
                className={`max-w-[70%] py-3 px-4 rounded-2xl ${
                  isMyMessage
                    ? 'bg-airbnb text-white rounded-tr-none'
                    : 'bg-gray-200 rounded-tl-none'
                }`}
              >
                <p className="break-words">{message.body}</p>
              </div>

              {isMyMessage && (
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={myUser?.avatar_url || '/profile_pic_1.jpg'}
                    alt={message.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fixed input area at the bottom */}
      <div className="sticky bottom-0 bg-white px-4 py-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 max-w-[1500px] mx-auto">
          <input
            type="text"
            placeholder={t('typeMessage')}
            className="flex-1 py-3 px-4 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-airbnb"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-airbnb text-white rounded-full disabled:opacity-50 hover:bg-airbnb_dark transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetail;
