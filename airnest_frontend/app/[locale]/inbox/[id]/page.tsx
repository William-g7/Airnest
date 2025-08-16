import { getUserId, getAccessToken } from '@/app/auth/session';
import React from 'react';
import apiService from '@/app/services/apiService';
import ConversationDetail from '@/app/components/inbox/ConversationDetail';
import { UserType } from '../page';
import { getTranslations } from 'next-intl/server';

export type MessageType = {
  id: string;
  name: string;
  body: string;
  conversationId: string;
  sent_to: UserType;
  created_by: UserType;
};

interface PageProps {
  params: {
    id: string;
    locale: string;
  };
}

const ConversationPage = async ({ params }: PageProps) => {
  const userId = await getUserId();
  const token = await getAccessToken();
  const conversationId = await params.id;
  const t = await getTranslations('inbox');

  if (!userId || !token) {
    return (
      <main className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-md">
          <p className="text-center text-lg">{t('authRequired')}</p>
        </div>
      </main>
    );
  }

  const conversation = await apiService.getwithtoken(`/api/chat/${conversationId}/`);

  const otherUser = conversation.conversation.users?.find((user: UserType) => user.id !== userId);
  const landlordName = otherUser?.name || t('host');

  return (
    <main className="w-full h-[calc(100vh-64px)] bg-white">
      <div className="max-w-[1500px] mx-auto h-full flex flex-col">
        <div className="border-b border-gray-200 py-3 px-6">
          <h1 className="text-xl font-semibold">{t('conversationWith', { name: landlordName })}</h1>
        </div>
        <div className="flex-1 h-full overflow-hidden">
          <ConversationDetail
            token={token}
            userId={userId}
            messages={conversation.messages}
            conversation={conversation.conversation}
          />
        </div>
      </div>
    </main>
  );
};

export default ConversationPage;
