'use client';

import { useEffect, useState } from 'react';
import PropertyList from '@/app/components/properties/PropertyList';
import apiService from '@/app/services/apiService';
import { PropertyType } from '@/app/constants/propertyType';
import { useTranslations } from 'next-intl';

const MyWishlistsPage = () => {
  const t = useTranslations('mywishlists');
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWishlists = async () => {
      try {
        const response = await apiService.getwithtoken('/api/properties/wishlist/');
        setProperties(response);
      } catch (error) {
        setError(t('loadError'));
        console.error('Error fetching wishlists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlists();
  }, [t]);

  if (isLoading) {
    return (
      <main className="max-w-[1500px] mx-auto px-6 pb-6">
        <h1 className="text-3xl font-semibold my-8">{t('title')}</h1>
        <div className="text-center">{t('loading')}</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-[1500px] mx-auto px-6 pb-6">
        <h1 className="text-3xl font-semibold my-8">{t('title')}</h1>
        <div className="text-red-500 text-center">{error}</div>
      </main>
    );
  }

  return (
    <main className="max-w-[1500px] mx-auto px-6 pb-6">
      <h1 className="text-3xl font-semibold my-8">{t('title')}</h1>
      {properties.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-semibold">{t('noSavedProperties')}</h3>
          <p className="text-gray-500 mt-2">{t('propertiesWillAppearHere')}</p>
        </div>
      ) : (
        <PropertyList isWishlist={true} />
      )}
    </main>
  );
};

export default MyWishlistsPage;
