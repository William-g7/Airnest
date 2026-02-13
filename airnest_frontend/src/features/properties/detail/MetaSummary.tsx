'use client';

import { useTranslations } from 'next-intl';
import type { PropertyType } from '@properties/types/Property';

export default function MetaSummary({ property }: { property: PropertyType }) {
  const t = useTranslations('property');
  const categoriesT = useTranslations('categories');

  const getTranslatedCategory = () => {
    if (!property.category) return '';
    try {
      return categoriesT(property.category.toLowerCase()) || property.category;
    } catch {
      return property.category;
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 text-lg text-gray-600 mb-2">
        <span>👤 {property.guests} {t('guests')}</span>
        <span>·</span>
        <span>🛏️ {property.bedrooms} {t('bedrooms')}</span>
        <span>·</span>
        <span>🛌 {property.beds} {t('beds')}</span>
        <span>·</span>
        <span>🛁 {property.bathrooms} {t('bathrooms')}</span>
      </div>

      <div className="text-lg text-gray-600 mb-6">
        {property.place_type === 'entire' && <p>🏠 {t('entirePlace', { category: getTranslatedCategory() })}</p>}
        {property.place_type === 'room' && <p>🛏️ {t('privateRoom', { category: getTranslatedCategory() })}</p>}
        {property.place_type === 'shared' && <p>🛏️ {t('sharedRoom')}</p>}
      </div>
    </>
  );
}
