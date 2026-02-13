import { Suspense } from 'react';
import CategoryScroller from '@search/components/CategoryScroller';
import AnimatedText from '@sharedUI/AnimatedText';
import ListHybrid from '@properties/list/List.Hybrid'; 
import ListSkeleton from '@properties/list/List.Skeleton';
import { getPropertiesWithPersonalization } from '@properties/server/queries';
import { getUserContext } from '@auth/server/session'; 
import { getTranslations, getLocale } from 'next-intl/server';
import { parseSearchParams, getSearchKey, formatApiParams } from '@properties/utils/searchParams'; 
import { getServerTranslations } from '@translation/server/serverTranslationService';

// 具体的页面UI与数据
interface HomeProps {
  searchParams: Promise<Record<string, string | string[]>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations('app');
  const locale = await getLocale();
  const parsedParams = parseSearchParams(resolvedSearchParams);
  
  const userContext = await getUserContext();
  
  // 服务端始终获取前5条数据，无论是否有搜索参数
  const apiParams = formatApiParams({
    ...parsedParams,
    limit: 5,
    offset: 0
  });
  
  const { properties: initialProperties, userWishlist } = await getPropertiesWithPersonalization(apiParams);
  const translationsData = await getServerTranslations(initialProperties, locale, userContext);
  
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

      <CategoryScroller />

      <div className="mt-6">
        <Suspense fallback={<ListSkeleton count={15} />}>
          <ListHybrid 
            key={getSearchKey(parsedParams)}
            initialProperties={initialProperties}
            translationsData={translationsData}
            locale={locale}
            searchParams={parsedParams}
            initialUserWishlist={userWishlist}
          />
        </Suspense>
      </div>
    </main>
  );
}
