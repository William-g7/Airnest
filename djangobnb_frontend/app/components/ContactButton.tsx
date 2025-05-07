'use client'

import { useRouter } from "next/navigation";
import apiService from "@/app/services/apiService";
import { useLoginModal } from "./hooks/useLoginModal";
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from "../hooks/useAuth";

interface ContactButtonProps {
    landlordId: string;
}

const ContactButton = ({ landlordId }: ContactButtonProps) => {
    const router = useRouter();
    const loginModal = useLoginModal();
    const t = useTranslations('common');
    const locale = useLocale();
    const { userId, isAuthenticated } = useAuth();

    const handleContact = async () => {
        if (!isAuthenticated || !userId) {
            loginModal.onOpen();
            return;
        }

        try {
            console.log('Attempting to start conversation with landlordId:', landlordId);
            const conversation = await apiService.getwithtoken(`/api/chat/start/${landlordId}/`)
            console.log('Conversation response:', conversation);

            if (conversation.success && conversation.conversation_id) {
                console.log('Navigating to conversation:', conversation.conversation_id);
                router.push(`/${locale}/inbox/${conversation.conversation_id}`)
            }
        } catch (error: any) {
            console.error('Error starting conversation:', error);
            if (error.response?.status === 401) {
                loginModal.onOpen();
            }
        }
    }

    return (
        <button
            onClick={handleContact}
            className="py-4 px-6 w-full bg-airbnb text-white rounded-lg font-semibold hover:bg-airbnb_dark transition-all duration-300"
        >
            {t('contact')}
        </button>
    );
};

export default ContactButton;