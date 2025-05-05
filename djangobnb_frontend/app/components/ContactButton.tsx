'use client'

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserId } from "@/app/auth/session";
import apiService from "@/app/services/apiService";
import { useLoginModal } from "./hooks/useLoginModal";
import { useTranslations } from 'next-intl';

interface ContactButtonProps {
    landlordId: string;
}

const ContactButton = ({ landlordId }: ContactButtonProps) => {
    const router = useRouter();
    const loginModal = useLoginModal();
    const [userId, setUserId] = useState<string | null>(null);
    const t = useTranslations('common');

    useEffect(() => {
        const fetchUserId = async () => {
            const id = await getUserId();
            setUserId(id);
        };
        fetchUserId();
    }, []);

    const handleContact = async () => {
        if (!userId) {
            console.log('User not logged in, opening login modal');
            loginModal.onOpen();
            return;
        }

        try {
            console.log('Attempting to start conversation with landlordId:', landlordId);
            const conversation = await apiService.getwithtoken(`/api/chat/start/${landlordId}/`)
            console.log('Conversation response:', conversation);

            if (conversation.success && conversation.conversation_id) {
                console.log('Navigating to conversation:', conversation.conversation_id);
                router.push(`/inbox/${conversation.conversation_id}`)
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