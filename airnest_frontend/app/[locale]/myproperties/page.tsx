'use client';

import ListClient from '@properties/list/List.Client';
import { useAddPropertyModal } from '@addProperty/hooks/useAddPropertyModal';
import { useLoginModal } from '@auth/client/modalStore';
import { useAuthStore } from '@auth/client/authStore';
import { useTranslations } from 'next-intl';

const MyPropertiesPage = () => {
  const t = useTranslations('myproperties');
  const addPropertyModal = useAddPropertyModal();
  const loginModal = useLoginModal();
  const { isAuthenticated } = useAuthStore();

  const handleAddPropertyClick = () => {
    if (isAuthenticated) {
      addPropertyModal.onOpen();
    } else {
      loginModal.open();
    }
  };

  return (
    <main className="max-w-[1500px] mx-auto px-6 pb-6">
      <div className="flex justify-between items-center my-8">
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <button
          onClick={handleAddPropertyClick}
          className="bg-airbnb hover:bg-airbnb_dark text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          {t('addNewProperty')}
        </button>
      </div>

      <ListClient initialProperties={[]} isMyProperties={true} />
    </main>
  );
};

export default MyPropertiesPage;
