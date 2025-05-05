'use client'

import PropertyList from "@/app/components/properties/PropertyList";
import { useAddPropertyModal } from '@/app/components/hooks/useAddPropertyModal';
import { useTranslations } from 'next-intl';

const MyPropertiesPage = () => {
    const t = useTranslations('myproperties');
    const addPropertyModal = useAddPropertyModal();

    return (
        <main className="max-w-[1500px] mx-auto px-6 pb-6">
            <div className="flex justify-between items-center my-8">
                <h1 className="text-3xl font-semibold">{t('title')}</h1>
                <button
                    onClick={addPropertyModal.onOpen}
                    className="bg-airbnb hover:bg-airbnb_dark text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                    {t('addNewProperty')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                <PropertyList isMyProperties={true} />
            </div>
        </main>
    );
};

export default MyPropertiesPage; 