'use client';

import { useAddPropertyModal } from '@addProperty/hooks/useAddPropertyModal';
import { useLoginModal } from '@auth/client/modalStore';
import { useAuthStore } from '@auth/client/authStore';
import { useTranslations } from 'next-intl';

const AddPropertyButton = () => {
  const addPropertyModal = useAddPropertyModal();
  const loginModal = useLoginModal();
  const { isAuthenticated } = useAuthStore();
  const t = useTranslations('addProperty');

  const handleClick = () => {
    if (isAuthenticated) {
      addPropertyModal.onOpen();
    } else {
      loginModal.open();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="p-2 cursor-pointer text-sm font-semibold rounded-full transition-all duration-300 hover:bg-gray-100 hover:scale-105 active:scale-95"
    >
      {t('shareYourNest')}
    </div>
  );
};

export default AddPropertyButton;
