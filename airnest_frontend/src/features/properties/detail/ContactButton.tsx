'use client';

import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';

import apiService, { ApiError } from '@auth/client/clientApiService';
import { useLoginModal } from '@auth/client/modalStore';
import { useAuth } from '@auth/hooks/useAuth';

interface ContactButtonProps {
  landlordId: string; 
}

type StartConversationResponse = {
  success: boolean;
  conversation_id?: string;
};

export default function ContactButton({ landlordId }: ContactButtonProps) {
  const router = useRouter();
  const loginModal = useLoginModal();
  const t = useTranslations('common');
  const locale = useLocale();
  const { userId, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleContact = async () => {
    if (!isAuthenticated || !userId) {
      loginModal.open();
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const conversation = await apiService.get<StartConversationResponse>(
        `/api/chat/start/${landlordId}/`
      );

      if (conversation?.success && conversation.conversation_id) {
        router.push(`/${locale}/inbox/${conversation.conversation_id}`);
      } else {
        console.warn('Start conversation returned unexpected payload:', conversation);
      }
    } catch (err) {
      const error = err as ApiError;
      if (error.statusCode === 401) {
        loginModal.open();
      } else {
        console.error('Error starting conversation:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleContact}
      disabled={loading}
      className="py-4 px-6 w-full bg-airbnb text-white rounded-lg font-semibold hover:bg-airbnb_dark disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
    >
      {loading ? t('loading') : t('contact')}
    </button>
  );
}
