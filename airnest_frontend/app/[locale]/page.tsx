import { Suspense } from 'react';
import EnhancedCategories from '../components/search/EnhancedCategories';
import AnimatedText from '../components/common/AnimatedText';
import PropertyListContainerHybrid from '../components/properties/PropertyListContainerHybrid';
import PropertyListSkeleton from '../components/properties/PropertyListSkeleton';
import { getProperties } from '../services/serverApiService';
import { getTranslations } from 'next-intl/server';  // 服务器端翻译
import { parseSearchParams, getSearchKey, formatApiParams } from '../utils/searchParams';

interface HomeProps {
  searchParams: Promise<Record<string, string | string[]>>;
}

export default async function Home({ searchParams }: HomeProps) {
  // 在 Next.js 15 中 searchParams 是 Promise
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations('app');
  
  // 解析搜索参数
  const parsedParams = parseSearchParams(resolvedSearchParams);
  
  // 服务端始终获取前5条数据，无论是否有搜索参数
  const apiParams = formatApiParams({
    ...parsedParams,
    limit: 5,
    offset: 0
  });
  const initialProperties = await getProperties(apiParams);
  
  return (
    <main className="max-w-[1500px] mx-auto px-6">
      <div className="pt-12 pb-4">
        <AnimatedText
          tagline={t('tagline')}
          description={t('description')}
          resetOnScrollTop={true}
          maxAnimations={2}
        />
      </div>

      {/* 增强型类别选择 */}
      <EnhancedCategories />

      <div className="mt-6">
        <Suspense fallback={<PropertyListSkeleton count={15} />}>
          <PropertyListContainerHybrid 
            key={getSearchKey(parsedParams)}
            initialProperties={initialProperties}
            searchParams={parsedParams}
          />
        </Suspense>
      </div>
    </main>
  );
}
