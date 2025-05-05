'use client'

import { useAddPropertyModal } from '../hooks/useAddPropertyModal'
import { useTranslations } from 'next-intl';

const AddPropertyButton = () => {
    const addPropertyModal = useAddPropertyModal();
    const t = useTranslations('addProperty');

    return (
        <div
            onClick={addPropertyModal.onOpen}
            className="p-2 cursor-pointer text-sm font-semibold rounded-full hover:bg-gray-200"
        >
            {t('djangobnbYourHome')}
        </div>
    )
}

export default AddPropertyButton;