import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import type { PropertyType } from '@properties/types/Property';
import type { SearchParams } from '@properties/utils/searchParams';
import type { TranslationData } from '@translation/server/serverTranslationService';
import ClientCacheSeed from '@translation/cache/ClientCacheSeed';
import PropertyCardSSR from '@properties/card/PropertyCard.SSR';
import PropertyListClient from './List.Client';

interface PropertyListHybridProps {
  initialProperties: PropertyType[];
  translationsData: TranslationData;
  locale: string;
  searchParams?: SearchParams;
  isMyProperties?: boolean;
  isWishlist?: boolean;
  initialUserWishlist?: string[];
}

export default async function PropertyListHybrid({
  initialProperties,
  translationsData,
  locale,
  searchParams,
  isMyProperties = false,
  isWishlist = false,
  initialUserWishlist = [],
}: PropertyListHybridProps) {
  const t = await getTranslations('properties');

  // 特殊页（我的/心愿单）且没初始数据 → 完全客户端
  if (initialProperties.length === 0 && (isMyProperties || isWishlist)) {
    return (
      <PropertyListClient
        initialProperties={initialProperties}
        searchParams={searchParams}
        isMyProperties={isMyProperties}
        isWishlist={isWishlist}
      />
    );
  }

  // 空结果
  if (initialProperties.length === 0) {
    return (
      <div className="w-full text-center py-16 px-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('noPropertiesFound')}</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-8">{t('noPropertiesMatch')}</p>
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

  // SSR 前 4 个，其余交给客户端
  const firstScreen = initialProperties.slice(0, 4);

  return (
    <div className="w-full">
      <ClientCacheSeed locale={locale} translationsData={translationsData} />
      {firstScreen.length > 0 && <h2 className="sr-only">{t('availableProperties')}</h2>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
        {firstScreen.map((property, index) => (
          <PropertyCardSSR
            key={`ssr-${property.id}`}
            property={property}
            locale={locale}
            isHero={index === 0}
            isLCPCandidate={index === 0}
            isInitiallyFavorited={initialUserWishlist.includes(property.id)}
            translations={{
              title: translationsData.titles[property.title || ''] || property.title,
              city: translationsData.cities[property.city || ''] || property.city,
              country: translationsData.countries[property.country || ''] || property.country,
            }}
          />
        ))}

        <Suspense
          fallback={Array.from({ length: Math.max(10, 20 - firstScreen.length) }).map((_, index) => (
            <div key={`skeleton-${index}`} className="animate-pulse bg-gray-200 h-64 rounded-xl" />
          ))}
        >
          <PropertyListClient
            initialProperties={[]}
            searchParams={searchParams}
            isMyProperties={isMyProperties}
            isWishlist={isWishlist}
            serverRenderedCount={firstScreen.length}
            renderInParentGrid
            initialUserWishlist={initialUserWishlist}
          />
        </Suspense>
      </div>
    </div>
  );
}
