import { getTranslations } from 'next-intl/server';
import { checkBFFSession } from '@auth/server/session';
import Conversation from '@chat/components/Conversation';
import { listConversations } from '@chat/api/queries';

export type UserType = { id: string; name: string; avatar_url?: string | null };
export type ConversationType = { id: string; users: UserType[] };

const InboxPage = async () => {
  const t = await getTranslations('inbox');
  const session = await checkBFFSession();

  if (!session.valid || !session.userId) {
    return (
      <main className="max-w-[1500px] max-auto px-6 py-12">
        <p>{t('authRequired')}</p>
      </main>
    );
  }

  const list = await listConversations();

  return (
    <main className="max-w-[1500px] mx-auto px-6 pb-6 space-y-4">
      <h1 className="my-6 text-2xl">{t('title')}</h1>

      {list.length > 0 ? (
        <div className="space-y-4">
          <p className="text-gray-500">{t('conversations')}</p>
          {list.map((conversation) => (
            <Conversation userId={session.userId!} key={conversation.id} conversation={conversation as any} />
          ))}
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
