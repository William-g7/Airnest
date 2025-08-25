import { Suspense } from 'react';
import EnhancedCategories from '../components/search/EnhancedCategories';
import AnimatedText from '../components/common/AnimatedText';
import PropertyListContainerHybrid from '../components/properties/PropertyListContainerHybrid';
import PropertyListSkeleton from '../components/properties/PropertyListSkeleton';
import { getProperties } from '../services/serverApiService';
import { getTranslations, getLocale } from 'next-intl/server'; 
import { parseSearchParams, getSearchKey, formatApiParams } from '../utils/searchParams';
import { getServerTranslations } from '../services/serverTranslationService';

interface HomeProps {
  searchParams: Promise<Record<string, string | string[]>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations('app');
  const locale = await getLocale();
  const parsedParams = parseSearchParams(resolvedSearchParams);
  
  // 服务端始终获取前5条数据，无论是否有搜索参数
  const apiParams = formatApiParams({
    ...parsedParams,
    limit: 5,
    offset: 0
  });
  const initialProperties = await getProperties(apiParams);
  
  // 获取前5个房源的翻译数据（如果不是英文）
  const translationsData = await getServerTranslations(initialProperties, locale);
  
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

      <EnhancedCategories />

      <div className="mt-6">
        <Suspense fallback={<PropertyListSkeleton count={15} />}>
          <PropertyListContainerHybrid 
            key={getSearchKey(parsedParams)}
            initialProperties={initialProperties}
            translationsData={translationsData}
            locale={locale}
            searchParams={parsedParams}
          />
        </Suspense>
      </div>
    </main>
  );
}
