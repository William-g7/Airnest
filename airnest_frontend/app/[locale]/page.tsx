import { Suspense } from 'react';
import CategoryScroller from '@search/components/CategoryScroller';
import AnimatedText from '@sharedUI/AnimatedText';
import ListSkeleton from '@properties/list/List.Skeleton';
import ListStreamed from '@properties/list/List.Streamed';
import { getTranslations } from 'next-intl/server';
import { parseSearchParams, getSearchKey } from '@properties/utils/searchParams';

/**
 * 首页 — Streaming SSR 架构
 *
 * 渲染流程：
 *   1. page.tsx 只做轻量操作（解析 URL 参数、读本地翻译文件），几乎瞬间完成
 *   2. Shell（AnimatedText + CategoryScroller + 骨架屏）立即流式发送到浏览器
 *   3. ListStreamed 在 Suspense 内部异步获取房源数据 + 翻译
 *   4. 数据就绪后，React 流式注入真实房源列表，替换骨架屏
 *
 * 效果：用户首先看到完整的页面框架和加载动画，而不是空白页面。
 */
interface HomeProps {
  searchParams: Promise<Record<string, string | string[]>>;
}

export default async function Home({ searchParams }: HomeProps) {
  // 这些操作都很快：解析 URL 参数、读本地 message 文件
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations('app');
  const parsedParams = parseSearchParams(resolvedSearchParams);

  return (
    <main className="max-w-[1500px] mx-auto px-6">
      {/* ─── Shell：立即流式发送给浏览器 ─── */}
      <div className="pt-12 pb-4">
        <AnimatedText
          tagline={t('tagline')}
          description={t('description')}
          resetOnScrollTop={true}
          maxAnimations={2}
        />
      </div>

      <CategoryScroller />

      {/* ─── 房源列表：Suspense 边界内异步获取，流式注入 ─── */}
      {/*
        key = getSearchKey(parsedParams)
        当搜索参数变化时，Suspense 边界重新挂载，
        立即显示骨架屏 fallback，同时开始获取新的搜索结果。
      */}
      <div className="mt-6">
        <Suspense key={getSearchKey(parsedParams)} fallback={<ListSkeleton count={15} />}>
          <ListStreamed searchParams={parsedParams} />
        </Suspense>
      </div>
    </main>
  );
}
