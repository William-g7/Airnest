'use client';

import { useRouter } from 'next/navigation';
import { ConversationType } from "@/app/[locale]/inbox/page";
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';

interface ConversationProps {
    conversation: ConversationType;
    userId: string;
}

const Conversation: React.FC<ConversationProps> = ({
    conversation,
    userId
}) => {
    const router = useRouter();
    const otherUser = conversation.users.find((user) => user.id != userId);
    const t = useTranslations('inbox');
    const locale = useLocale();

    const handleClick = () => {
        router.push(`/${locale}/inbox/${conversation.id}`);
    };

    return (
        <div
            onClick={handleClick}
            className="px-6 py-4 cursor-pointer border border-gray-300 rounded-xl hover:shadow-md transition-shadow"
        >
            <div className="flex items-center gap-3 mb-3">
                {otherUser?.avatar_url ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image
                            src={otherUser.avatar_url}
                            alt={otherUser?.name || ''}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600">
                            {otherUser?.name?.charAt(0) || '?'}
                        </span>
                    </div>
                )}
                <p className="text-lg font-medium">{otherUser?.name}</p>
            </div>

            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                    {t('viewConversation')}
                </p>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-airbnb"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>
        </div>
    );
};

export default Conversation;