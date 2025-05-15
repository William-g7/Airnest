'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import apiService from '../../services/apiService';
import PropertyListItem from './PropertyListItem';
import { PropertyType } from '@/app/constants/propertyType';
import { useSearchStore } from '@/app/stores/searchStore';
import { useSearchParams } from 'next/navigation';
import { useTranslate } from '@/app/hooks/useTranslate';
import { useLocaleStore } from '@/app/stores/localeStore';
import { motion } from 'framer-motion';
import { useIntersectionObserver } from '@/app/hooks/useIntersectionObserver';

const PropertySkeleton = ({ index }: { index: number }) => (
  <motion.div
    className="bg-white rounded-xl overflow-hidden shadow-sm"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
  >
    <div className="relative overflow-hidden aspect-square rounded-t-xl bg-gray-200 animate-pulse" />
    <div className="p-3">
      <div className="h-6 bg-gray-200 rounded-md animate-pulse mb-2" />
      <div className="h-4 bg-gray-200 rounded-md animate-pulse w-3/4 mb-2" />
      <div className="flex gap-2 mt-2">
        <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>
  </motion.div>
);

interface TranslationContext {
  titles: Record<string, string>;
  cities: Record<string, string>;
  countries: Record<string, string>;
}

interface PropertyListProps {
  isMyProperties?: boolean;
  isWishlist?: boolean;
}

const PropertyList = ({ isMyProperties, isWishlist }: PropertyListProps) => {
  const t = useTranslations('properties');
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [visibleProperties, setVisibleProperties] = useState<PropertyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastSearchParams, setLastSearchParams] = useState('');
  const [initialBatchSize, setInitialBatchSize] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersectionObserver(loadMoreRef, { rootMargin: '300px' });

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationContext, setTranslationContext] = useState<TranslationContext>({
    titles: {},
    cities: {},
    countries: {},
  });

  const { translateGrouped } = useTranslate();
  const { locale } = useLocaleStore();

  const { location, checkIn, checkOut, guests, category } = useSearchStore();
  const searchParams = useSearchParams();
  const serializedParams = searchParams.toString();

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setInitialBatchSize(4);
      } else if (width < 768) {
        setInitialBatchSize(6);
      } else if (width < 1024) {
        setInitialBatchSize(9);
      } else if (width < 1280) {
        setInitialBatchSize(12);
      } else {
        setInitialBatchSize(15);
      }
    };

    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  useEffect(() => {
    if (properties.length > 0) {
      setVisibleProperties(properties.slice(0, initialBatchSize));
    }
  }, [properties, initialBatchSize]);

  useEffect(() => {
    if (isLoadMoreVisible && visibleProperties.length < properties.length && !isLoading) {
      const nextBatch = properties.slice(0, visibleProperties.length + initialBatchSize);
      setVisibleProperties(nextBatch);
    }
  }, [isLoadMoreVisible, visibleProperties.length, properties, initialBatchSize, isLoading]);

  const getProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      let endpoint = '/api/properties/';

      if (isMyProperties) {
        endpoint = '/api/properties/my/';
      } else if (isWishlist) {
        endpoint = '/api/properties/wishlist/';
      } else {
        const params = new URLSearchParams();

        const locationParam = searchParams.get('location');
        const checkInParam = searchParams.get('check_in');
        const checkOutParam = searchParams.get('check_out');
        const guestsParam = searchParams.get('guests');
        const categoryParam = searchParams.get('category');

        if (locationParam) params.append('location', locationParam);
        if (checkInParam) params.append('check_in', checkInParam);
        if (checkOutParam) params.append('check_out', checkOutParam);
        if (guestsParam && parseInt(guestsParam) > 1) params.append('guests', guestsParam);
        if (categoryParam) params.append('category', categoryParam);

        if (
          params.toString() === '' &&
          (location || checkIn || checkOut || guests > 1 || category)
        ) {
          if (location) params.append('location', location);
          if (checkIn) params.append('check_in', checkIn);
          if (checkOut) params.append('check_out', checkOut);
          if (guests > 1) params.append('guests', guests.toString());
          if (category) params.append('category', category);
        }

        const queryString = params.toString();
        if (queryString) {
          endpoint = `/api/properties/?${queryString}`;
        }

        console.log(`Fetching properties with endpoint: ${endpoint}`);
      }

      const data =
        isMyProperties || isWishlist
          ? await apiService.getwithtoken(endpoint)
          : await apiService.get(endpoint);

      setProperties(data);
      setVisibleProperties(data.slice(0, initialBatchSize));
    } catch (error) {
      setError(t('loadError'));
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isMyProperties, isWishlist, searchParams, location, checkIn, checkOut, guests, category, t, initialBatchSize]);

  useEffect(() => {
    getProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (serializedParams !== lastSearchParams) {
      console.log(`Search params changed from "${lastSearchParams}" to "${serializedParams}"`);
      setLastSearchParams(serializedParams);
      getProperties();
    }
  }, [serializedParams, lastSearchParams, getProperties]);

  useEffect(() => {
    setTranslationContext({
      titles: {},
      cities: {},
      countries: {},
    });

    if (locale !== 'en' && properties.length > 0 && !isLoading) {
      translateAllProperties();
    }
  }, [locale, properties, isLoading]);

  const translateAllProperties = async () => {
    if (locale === 'en' || properties.length === 0 || isTranslating) {
      return;
    }

    setIsTranslating(true);
    console.log(`Begin translating ${properties.length} properties`);

    try {
      const titles: string[] = [];
      const cities: string[] = [];
      const countries: string[] = [];

      properties.forEach(property => {
        if (property.title) titles.push(property.title);
        if (property.city) cities.push(property.city);
        if (property.country) countries.push(property.country);
      });

      const translationsResult = await translateGrouped(
        {
          titles,
          cities,
          countries,
        },
        locale
      );

      setTranslationContext({
        titles: translationsResult.titles || {},
        cities: translationsResult.cities || {},
        countries: translationsResult.countries || {},
      });

      console.log(`Trnaslation success, translated ${properties.length} properties`);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <>
      {/* If it is loading, show the skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
          {[...Array(initialBatchSize)].map((_, index) => (
            <PropertySkeleton key={index} index={index} />
          ))}
        </div>
      ) : error ? (
        <>
          {/* If there is an error, show the error message */}
          <div className="w-full text-center p-8 rounded-lg bg-red-50 border border-red-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-red-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-red-700 mb-2">{error}</h3>
            <p className="text-red-600">{t('tryAgainLater')}</p>
          </div>
        </>
      ) : properties.length === 0 ? (
        <>
          {/* If there are no properties, show the no properties found message */}
          <div className="w-full text-center py-16 px-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400 mb-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('noPropertiesFound')}</h3>

            {/* If it is my properties page, show the no listed properties message */}
            {isMyProperties && (
              <p className="text-gray-600 max-w-md mx-auto mb-8">{t('noListedProperties')}</p>
            )}

            {/* If it is not my properties and not wishlist page, show the no properties match message */}
            {!isMyProperties &&
              !isWishlist &&
              (searchParams.get('location') ||
                searchParams.get('check_in') ||
                searchParams.get('check_out') ||
                searchParams.get('guests') ||
                searchParams.get('category') ||
                location ||
                checkIn ||
                checkOut ||
                guests > 1 ||
                category) && (
                <p className="text-gray-600 max-w-md mx-auto mb-8">{t('noPropertiesMatch')}</p>
              )}

            <div className="bg-gray-50 p-4 rounded-xl inline-block">
              <p className="text-gray-700 font-medium">{t('searchTips')}</p>
              <ul className="text-left text-sm text-gray-600 mt-2 space-y-2">
                <li>• {t('tryDifferentDates')}</li>
                <li>• {t('removeFilters')}</li>
                <li>• {t('searchOtherLocation')}</li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* If there are properties, show the properties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
            {isTranslating && (
              <div className="col-span-full mb-4 p-2 bg-blue-50 text-blue-700 text-sm rounded-lg">
                {t('translationInProgress')}
              </div>
            )}

            {visibleProperties.map((property, index) => (
              <PropertyListItem
                key={property.id}
                property={property}
                translations={{
                  title: translationContext.titles[property.title || ''] || '',
                  city: translationContext.cities[property.city || ''] || '',
                  country: translationContext.countries[property.country || ''] || '',
                }}
              />
            ))}
          </div>
          
          {/* Load more indicator */}
          {visibleProperties.length < properties.length && (
            <div 
              ref={loadMoreRef} 
              className="w-full py-8 flex justify-center"
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="loading flex items-center justify-center"
              >
                <div className="w-3 h-3 bg-gray-400 rounded-full mx-1 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-gray-400 rounded-full mx-1 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-gray-400 rounded-full mx-1 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default PropertyList;
