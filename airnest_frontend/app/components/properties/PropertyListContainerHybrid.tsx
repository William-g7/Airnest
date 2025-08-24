import { Suspense } from 'react';
import { PropertyType } from '@/app/constants/propertyType';
import PropertyCardSSR from './PropertyCardSSR';
import PropertyListContainer from './PropertyListContainer';
import { getLocale, getTranslations } from 'next-intl/server';
import { SearchParams } from '@/app/utils/searchParams';

interface PropertyListContainerHybridProps {
  initialProperties: PropertyType[];
  searchParams?: SearchParams;
  isMyProperties?: boolean;
  isWishlist?: boolean;
}

export default async function PropertyListContainerHybrid({ 
  initialProperties, 
  searchParams,
  isMyProperties = false, 
  isWishlist = false 
}: PropertyListContainerHybridProps) {
  const locale = await getLocale();
  const t = await getTranslations('properties');
  
  // 如果没有初始数据且是特殊页面（我的房源、心愿单），使用完全的客户端渲染
  if (initialProperties.length === 0 && (isMyProperties || isWishlist)) {
    return (
      <PropertyListContainer 
        initialProperties={initialProperties}
        searchParams={searchParams}
        isMyProperties={isMyProperties}
        isWishlist={isWishlist}
      />
    );
  }

  // 如果搜索结果为空，显示无结果状态
  if (initialProperties.length === 0) {
    return (
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

  // 服务端渲染前5个卡片，其余通过客户端组件在同一网格中渲染
  const firstScreenProperties = initialProperties.slice(0, 5);

  return (
    <div className="w-full">
      {/* 房产列表区域标题 - 修复H1->H3跳跃问题 */}
      {firstScreenProperties.length > 0 && (
        <h2 className="sr-only">{t('availableProperties')}</h2>
      )}
      
      {/* 统一的网格容器 - 服务端和客户端卡片都在这里 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
        {/* 服务端渲染的前5个卡片 */}
        {firstScreenProperties.map((property, index) => (
          <PropertyCardSSR
            key={`ssr-${property.id}`}
            property={property}
            locale={locale}
            isFirstScreen={true}
            isLCPCandidate={index === 0} // 只有第一个卡片是LCP候选者
          />
        ))}
        
        {/* 客户端渲染组件：从第6条开始在同一网格中渲染 */}
        <Suspense fallback={
          // 骨架屏占位，确保网格布局稳定 - 显示足够的骨架屏填满网格
          Array.from({ length: Math.max(10, 20 - firstScreenProperties.length) }).map((_, index) => (
            <div key={`skeleton-${index}`} className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>
          ))
        }>
          <PropertyListContainer 
            initialProperties={[]} // 客户端不处理服务端已渲染的数据
            searchParams={searchParams}
            isMyProperties={isMyProperties}
            isWishlist={isWishlist}
            serverRenderedCount={firstScreenProperties.length} // 传递已渲染数量
            renderInParentGrid={true} // 新增：标识要在父网格中渲染
          />
        </Suspense>
      </div>
    </div>
  );
}