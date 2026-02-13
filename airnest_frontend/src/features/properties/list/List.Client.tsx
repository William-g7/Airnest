'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePropertyList } from '@properties/list/hooks/usePropertyList';
import ListSkeleton from '@properties/list/List.Skeleton';
import PropertyCardCSR from '@properties/card/PropertyCard.CSR';
import type { PropertyType } from '@properties/types/Property';
import type { SearchParams } from '@properties/utils/searchParams';
import type { UserContextData } from '@auth/server/session';

interface PropertyListClientProps {
  initialProperties: PropertyType[];
  searchParams?: SearchParams;
  isMyProperties?: boolean;
  isWishlist?: boolean;
  serverRenderedCount?: number;
  renderInParentGrid?: boolean;
  userContext?: UserContextData;
  initialUserWishlist?: string[];
}

function Content({
  initialProperties,
  searchParams,
  isMyProperties,
  isWishlist,
  serverRenderedCount = 0,
  renderInParentGrid = false,
  initialUserWishlist = [],
}: PropertyListClientProps) {
  const t = useTranslations('properties');

  const {
    properties,
    visibleProperties,
    visibleCount,
    isLoading,
    error,
    isTranslating,
    loadMoreRef,
    getTranslationsFor,
  } = usePropertyList({
    initialProperties,
    searchParams,
    isMyProperties,
    isWishlist,
    serverRenderedCount,
  });

  if (isLoading) {
    if (renderInParentGrid) {
      return (
        <>
          {Array.from({ length: 15 }).map((_, index) => (
            <div key={index} className="animate-pulse bg-gray-200 h-64 rounded-xl" />
          ))}
        </>
      );
    }
    return <ListSkeleton count={15} />;
  }

  if (error) {
    return (
      <div className="w-full text-center p-8 rounded-lg bg-red-50 border border-red-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto text-red-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-semibold text-red-700 mb-2">{error}</h3>
        <p className="text-red-600">{t('tryAgainLater')}</p>
      </div>
    );
  }

  if (properties.length === 0 && (isMyProperties || isWishlist)) {
    return (
      <div className="w-full text-center py-16 px-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 mx-auto text-gray-400 mb-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('noPropertiesFound')}</h3>
        {isMyProperties && (
          <p className="text-gray-600 max-w-md mx-auto mb-8">{t('noListedProperties')}</p>
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
    );
  }

  // 渲染（父网格 或 自带网格）
  const cards = visibleProperties.map((property, index) => (
    <PropertyCardCSR
      key={`client-${property.id}`}
      property={property}
      isFirstScreen={!renderInParentGrid && index < 5}
      isInitiallyFavorited={initialUserWishlist.includes(property.id)}
      translations={getTranslationsFor(property)}
    />
  ));

  if (renderInParentGrid) {
    return (
      <>
        {isTranslating && (
          <div className="col-span-full mb-4 p-2 bg-blue-50 text-blue-700 text-sm rounded-lg">
            {t('translationInProgress')}
          </div>
        )}
        {cards}
        {visibleCount < properties.length && (
          <div ref={loadMoreRef} className="col-span-full w-full py-8 flex justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="loading flex items-center justify-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full mx-1 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-gray-400 rounded-full mx-1 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-gray-400 rounded-full mx-1 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </motion.div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
        {isTranslating && (
          <div className="col-span-full mb-4 p-2 bg-blue-50 text-blue-700 text-sm rounded-lg">
            {t('translationInProgress')}
          </div>
        )}
        {cards}
      </div>

      {visibleCount < properties.length && (
        <div ref={loadMoreRef} className="w-full py-8 flex justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="loading flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mx-1 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-gray-400 rounded-full mx-1 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-gray-400 rounded-full mx-1 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </motion.div>
        </div>
      )}
    </>
  );
}

export default function PropertyListClient(props: PropertyListClientProps) {
  return (
    <Suspense fallback={<ListSkeleton count={15} />}>
      <Content {...props} />
    </Suspense>
  );
}
