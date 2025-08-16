import { getUserId } from '@/app/auth/session';
import apiService from '@/app/services/apiService';
import React from 'react';
import Conversation from '@/app/components/inbox/Conversation';
import { getTranslations } from 'next-intl/server';

export type UserType = {
  id: string;
  name: string;
  avatar_url: string;
};

export type ConversationType = {
  id: string;
  users: UserType[];
};

const InboxPage = async ({ params }: { params: Promise<{ locale: string }> }) => {
  const userId = await getUserId();
  const t = await getTranslations('inbox');

  if (!userId) {
    return (
      <main className="max-w-[1500px] max-auto px-6 py-12">
        <p>{t('authRequired')}</p>
      </main>
    );
  }

  const conversations = await apiService.getwithtoken('/api/chat/');

  return (
    <main className="max-w-[1500px] mx-auto px-6 pb-6 space-y-4">
      <h1 className="my-6 text-2xl">{t('title')}</h1>

      {conversations.length > 0 ? (
        <div className="space-y-4">
          <p className="text-gray-500">{t('conversations')}</p>
          {conversations.map((conversation: ConversationType) => {
            return (
              <Conversation userId={userId} key={conversation.id} conversation={conversation} />
            );
          })}
        </div>
      ) : (
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-lg font-medium mb-2">{t('noConversations')}</p>
          <p className="text-gray-500">{t('startConversation')}</p>
        </div>
      )}
    </main>
  );
};

export default InboxPage;
