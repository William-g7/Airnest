export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getTranslations } from 'next-intl/server';
import { checkBFFSession } from '@auth/server/session';
import ChatWindow from '@chat/components/ChatWindow';
import { getConversationDetail } from '@chat/api/queries';
import type { User as ChatUser } from '@chat/types/types';

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

const ConversationPage = async ({ params }: PageProps) => {
  const { id: conversationId } = await params;
  const t = await getTranslations('inbox');

  const session = await checkBFFSession();
  const userId = session.valid ? session.userId : null;

  if (!userId) {
    return (
      <main className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-md">
          <p className="text-center text-lg">{t('authRequired')}</p>
        </div>
      </main>
    );
  }

  const { conversation, messages } = await getConversationDetail(conversationId);

  const me = conversation.users.find((u) => u.id === userId)! as ChatUser;
  const other = conversation.users.find((u) => u.id !== userId)! as ChatUser;
  const landlordName = other?.name || t('host');

  return (
    <div className="max-w-[1500px] mx-auto h-full flex flex-col gap-3">
      <div className="border-b border-gray-200 py-3 px-6 shrink-0">
        <h1 className="text-xl font-semibold">{t('conversationWith', { name: landlordName })}</h1>
      </div>
      
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatWindow
          me={me}
          other={other}
          conversation={conversation}
          initialMessages={messages}
        />
      </div>
    </div>
  );
};

export default ConversationPage;
