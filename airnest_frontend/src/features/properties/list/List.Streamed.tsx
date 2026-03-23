import { getLocale } from 'next-intl/server';
import { getUserContext } from '@auth/server/session';
import { getPropertiesWithPersonalization } from '@properties/server/queries';
import { getServerTranslations } from '@translation/server/serverTranslationService';
import { formatApiParams, getSearchKey, type SearchParams } from '@properties/utils/searchParams';
import ListHybrid from './List.Hybrid';

/**
 * Streaming SSR 包装组件
 *
 * 这个 async Server Component 封装了"慢"的数据获取逻辑：
 *   1. 从后端拉取房源列表 + 用户收藏
 *   2. 服务端翻译首屏房源（非英文时）
 *
 * 它被设计为放在 <Suspense> 内部使用。当 page.tsx 渲染时：
 *   - Shell（导航、搜索栏、分类、骨架屏）立即流式发送给浏览器
 *   - 本组件在后台异步获取数据
 *   - 数据就绪后，React 将真实内容流式注入，替换骨架屏
 *
 * 这就是 React 18 Streaming SSR 的核心模式：
 * 把 async 数据获取下沉到 Suspense 边界内的子组件，而不是在页面顶层 await。
 */
interface ListStreamedProps {
  searchParams: SearchParams;
}

export default async function ListStreamed({ searchParams }: ListStreamedProps) {
  const locale = await getLocale();
  const userContext = await getUserContext();

  const apiParams = formatApiParams({
    ...searchParams,
    limit: 5,
    offset: 0,
  });

  const { properties, userWishlist } = await getPropertiesWithPersonalization(apiParams);
  const translationsData = await getServerTranslations(properties, locale, userContext);

  return (
    <ListHybrid
      key={getSearchKey(searchParams)}
      initialProperties={properties}
      translationsData={translationsData}
      locale={locale}
      searchParams={searchParams}
      initialUserWishlist={userWishlist}
    />
  );
}
