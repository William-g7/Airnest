'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PropertyListItem from './PropertyListItem';
import { PropertyType } from '@/app/constants/propertyType';
import { useSearchParams } from 'next/navigation';
import { useTranslate } from '@/app/hooks/useTranslate';
import { useLocaleStore } from '@/app/stores/localeStore';
import { motion } from 'framer-motion';
import { useIntersectionObserver } from '@/app/hooks/useIntersectionObserver';
import apiService from '../../services/apiService';
import PropertyListSkeleton from './PropertyListSkeleton';
import { SearchParams, formatApiParams } from '@/app/utils/searchParams';

interface TranslationContext {
  titles: Record<string, string>;
  cities: Record<string, string>;
  countries: Record<string, string>;
}

interface PropertyListContainerProps {
  initialProperties: PropertyType[]; // 从服务器组件接收的初始数据
  searchParams?: SearchParams;       // 搜索参数，用于客户端分页
  isMyProperties?: boolean;          // 用于预订页
  isWishlist?: boolean;              // 用于心愿单页
  serverRenderedCount?: number;      // 服务端已渲染的数量，用于计算偏移量
  renderInParentGrid?: boolean;      // 是否在父组件的网格中渲染
}

function PropertyListContent({
  initialProperties,
  searchParams,
  isMyProperties,
  isWishlist,
  serverRenderedCount = 0,
  renderInParentGrid = false
}: PropertyListContainerProps) {
  const t = useTranslations('properties');

  // —— 列表与可见数量（路线B的核心） ——
  const [properties, setProperties] = useState<PropertyType[]>(initialProperties);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const visibleProperties = useMemo(
    () => properties.slice(0, visibleCount),
    [properties, visibleCount]
  );

  // —— 状态 ——
  const [isLoading, setIsLoading] = useState(initialProperties.length === 0);
  const [error, setError] = useState('');
  const [lastSearchParams, setLastSearchParams] = useState('');
  const [initialBatchSize, setInitialBatchSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  // —— 无限滚动 ——
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersectionObserver(loadMoreRef, { rootMargin: '150px' });
  const inFlightRef = useRef(false); 

  // —— 翻译 ——
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationContext, setTranslationContext] = useState<TranslationContext>({
    titles: {},
    cities: {},
    countries: {},
  });
  const prevLenRef = useRef(0);
  const { translateGrouped } = useTranslate();
  const { locale } = useLocaleStore();

  // —— 搜索参数 ——
  const urlSearchParams = useSearchParams();
  const currentSearchParams = searchParams || {
    where: urlSearchParams.get('where') || urlSearchParams.get('location') || '',
    checkIn: urlSearchParams.get('check-in') || '',
    checkOut: urlSearchParams.get('check-out') || '',
    guests: parseInt(urlSearchParams.get('guests') || '1'),
    category: urlSearchParams.get('category') || ''
  };
  const serializedParams = JSON.stringify(currentSearchParams);

  // —— 首屏/补齐阶段控制 ——
  const [renderPhase, setRenderPhase] = useState(1); // 1 = 仅首屏, 2 = 完整批次

  // —— 服务器分页大小（带缓存） ——
  const fetchSize = 15;

  // 1) 根据屏幕尺寸调整 initialBatchSize（不回退 visibleCount）
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setInitialBatchSize(3);
      } else if (width < 768) {
        setInitialBatchSize(4);
      } else if (width < 1024) {
        setInitialBatchSize(6);
      } else if (width < 1280) {
        setInitialBatchSize(8);
      } else {
        setInitialBatchSize(10);
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

  // 2) phase 1：首屏只展示最多5条（与 initialBatchSize 取最小）
  useEffect(() => {
    if (properties.length > 0 && renderPhase === 1) {
      const firstScreen = Math.min(5, initialBatchSize, properties.length);
      setVisibleCount(firstScreen);

      // 短暂延迟后切到 phase 2（让首屏先稳定）
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => setRenderPhase(2));
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [properties.length, renderPhase, initialBatchSize]);

  // 3) 进入 phase 2 时：一次性补齐到完整一屏
  // 后续initialBatchSize 增大或列表变长时，可见数量只增不减
  useEffect(() => {
    if (renderPhase !== 2) return;
    const target = Math.min(initialBatchSize, properties.length);
    setVisibleCount(prev => Math.max(prev, target));
  }, [renderPhase, initialBatchSize, properties.length]);

  // —— 初始化：根据处于主页还是预定/心愿单页，选择全量加载还是分页 ——
  useEffect(() => {
    if (initialProperties.length === 0) {
      if (isMyProperties || isWishlist) {
        // 特殊页面：一次性取全
        (async () => {
          try {
            setIsLoading(true);
            let endpoint = '/api/properties/';
            if (isMyProperties) endpoint = '/api/properties/my/';
            else if (isWishlist) endpoint = '/api/properties/wishlist/';

            const data = await apiService.getwithtoken(endpoint);
            setProperties(data);
            // phase2 补齐 effect 会把 visibleCount 补到 initialBatchSize，这里先给一屏
            setVisibleCount(Math.min(initialBatchSize, data.length));
            setHasMore(false);
          } catch (error) {
            setError(t('loadError'));
            console.error('Error fetching properties:', error);
          } finally {
            setIsLoading(false);
          }
        })();
      } else if (serverRenderedCount > 0) {
        // 首页：服务端已渲染前几条，客户端拿“剩余列表”的第一页
        (async () => {
          try {
            setIsLoading(true);
            const apiParams = formatApiParams({
              ...currentSearchParams,
              offset: serverRenderedCount,
              limit: fetchSize,
            });
            const params = new URLSearchParams(apiParams);
            const data = await apiService.getPropertiesWithReviews(params);

            setProperties(data);
            setVisibleCount(Math.min(initialBatchSize, data.length));
            setHasMore(data.length === fetchSize);
          } catch (error) {
            setError(t('loadError'));
            console.error('Error fetching initial properties:', error);
          } finally {
            setIsLoading(false);
          }
        })();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // —— 无限滚动：先吃缓冲；没有缓冲再请求；请求回来只增加一屏，剩余当缓冲 ——
  useEffect(() => {
    if (renderPhase !== 2) return;
    if (!isLoadMoreVisible) return;
    if (isLoading) return;

    // 1) 有本地缓冲，先吃缓冲
    if (visibleCount < properties.length) {
      setVisibleCount((c) => Math.min(c + initialBatchSize, properties.length));
      return;
    }

    // 2) 没缓冲了，再请求（首页/搜索页）；我的/心愿单不分页
    if (!hasMore || isMyProperties || isWishlist) return;
    if (inFlightRef.current) return;

    (async () => {
      try {
        inFlightRef.current = true;
        setIsLoading(true);

        const apiParams = formatApiParams({
          ...currentSearchParams,
          offset: serverRenderedCount + properties.length,
          limit: fetchSize,
        });
        const params = new URLSearchParams(apiParams);
        const data = await apiService.getPropertiesWithReviews(params);

        setProperties((prev) => [...prev, ...data]);

        // 只把一屏加入可见，其余留作缓冲
        setVisibleCount((c) => c + Math.min(initialBatchSize, data.length));
        setHasMore(data.length === fetchSize);
      } catch (error) {
        setError(t('loadError'));
        console.error('Error fetching more properties:', error);
      } finally {
        setIsLoading(false);
        inFlightRef.current = false;
      }
    })();
  }, [
    isLoadMoreVisible,
    renderPhase,
    isLoading,
    visibleCount,
    properties.length,
    initialBatchSize,
    hasMore,
    isMyProperties,
    isWishlist,
    // 当搜索参数对象变化（整页软导航）时，不会执行这里；加入序列化后的参数更健壮
    serializedParams,
    t
  ]);

  // —— 当搜索参数变化时，记录一下（整页软导航会刷新页面，不在此重复取数） ——
  useEffect(() => {
    if (serializedParams !== lastSearchParams) {
      setLastSearchParams(serializedParams);
    }
  }, [serializedParams, lastSearchParams]);

  // —— 翻译逻辑（增量 + 切语言重译现有） ——
  const translateSubset = useCallback(async (subset: PropertyType[]) => {
    if (locale === 'en' || subset.length === 0) return;

    const titles: string[] = [];
    const cities: string[] = [];
    const countries: string[] = [];

    for (const p of subset) {
      if (p.title && !translationContext.titles[p.title]) titles.push(p.title);
      if (p.city && !translationContext.cities[p.city]) cities.push(p.city);
      if (p.country && !translationContext.countries[p.country]) countries.push(p.country);
    }

    if (titles.length === 0 && cities.length === 0 && countries.length === 0) return;

    setIsTranslating(true);
    try {
      const res = await translateGrouped({ titles, cities, countries }, locale);
      setTranslationContext((prev) => ({
        titles: { ...prev.titles, ...(res.titles || {}) },
        cities: { ...prev.cities, ...(res.cities || {}) },
        countries: { ...prev.countries, ...(res.countries || {}) },
      }));
    } catch (e) {
      console.error('Translation error:', e);
    } finally {
      setIsTranslating(false);
    }
  }, [locale, translateGrouped, translationContext]);

  // 增量翻译：当 properties 变长时，只翻译新增段
  useEffect(() => {
    if (locale === 'en' || isLoading) return;
    const curr = properties.length;
    const prev = prevLenRef.current;
    if (curr > prev) {
      const added = properties.slice(prev, curr);
      prevLenRef.current = curr;
      translateSubset(added);
    }
  }, [properties.length, locale, isLoading, translateSubset]);

  // 切换语言：清空上下文 -> 翻译当前已有的全部 properties
  useEffect(() => {
    setTranslationContext({ titles: {}, cities: {}, countries: {} });
    prevLenRef.current = 0;

    if (locale !== 'en' && properties.length > 0 && !isLoading) {
      translateSubset(properties);
      prevLenRef.current = properties.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // —— 渲染 —— 
  if (isLoading) {
    if (renderInParentGrid) {
      return (
        <>
          {Array.from({ length: Math.max(15, initialBatchSize) }).map((_, index) => (
            <div key={`loading-skeleton-${index}`} className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>
          ))}
        </>
      );
    }
    return <PropertyListSkeleton count={Math.max(15, initialBatchSize)} />;
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

  // 父网格中渲染
  if (renderInParentGrid) {
    return (
      <>
        {isTranslating && (
          <div className="col-span-full mb-4 p-2 bg-blue-50 text-blue-700 text-sm rounded-lg">
            {t('translationInProgress')}
          </div>
        )}

        {visibleProperties.map((property) => (
          <PropertyListItem
            key={`client-${property.id}`}
            property={property}
            isFirstScreen={false}
            translations={{
              title: translationContext.titles[property.title || ''] || '',
              city: translationContext.cities[property.city || ''] || '',
              country: translationContext.countries[property.country || ''] || '',
            }}
          />
        ))}

        {visibleCount < properties.length && (
          <div ref={loadMoreRef} className="col-span-full w-full py-8 flex justify-center">
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
    );
  }

  // 独立网格模式
  return (
    <>
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
            isFirstScreen={index < 5}
            translations={{
              title: translationContext.titles[property.title || ''] || '',
              city: translationContext.cities[property.city || ''] || '',
              country: translationContext.countries[property.country || ''] || '',
            }}
          />
        ))}
      </div>

      {visibleCount < properties.length && (
        <div ref={loadMoreRef} className="w-full py-8 flex justify-center">
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
  );
}

export default function PropertyListContainer({
  initialProperties,
  searchParams,
  isMyProperties,
  isWishlist,
  serverRenderedCount = 0,
  renderInParentGrid = false
}: PropertyListContainerProps) {
  return (
    <Suspense fallback={<PropertyListSkeleton count={15} />}>
      <PropertyListContent
        initialProperties={initialProperties}
        searchParams={searchParams}
        isMyProperties={isMyProperties}
        isWishlist={isWishlist}
        serverRenderedCount={serverRenderedCount}
        renderInParentGrid={renderInParentGrid}
      />
    </Suspense>
  );
}
