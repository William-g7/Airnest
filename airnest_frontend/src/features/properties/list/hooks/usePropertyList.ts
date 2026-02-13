'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useIntersectionObserver } from '@properties/list/hooks/useIntersectionObserver';
import apiService from '@auth/client/clientApiService';
import { useTranslate } from '@translation/client/useTranslate';
import { formatApiParams, type SearchParams as SearchParamsType } from '@properties/utils/searchParams';
import type { PropertyType } from '@properties/types/Property';

// 接管 SSR 首屏之后的列表生命周期：首批 CSR 拉取、分页、无限滚动、错误/加载状态
// 维持一个可见窗口，分阶段用列表填满屏幕
// 处理路由查询参数并据此构造请求参数
// 给非英文做增量翻译，且在语言切换时重译

type TranslationContext = {
  titles: Record<string, string>;
  cities: Record<string, string>;
  countries: Record<string, string>;
};

interface UsePropertyListOptions {
  initialProperties: PropertyType[];
  searchParams?: SearchParamsType;
  isMyProperties?: boolean;
  isWishlist?: boolean;
  serverRenderedCount?: number;
  fetchSize?: number;
}

export function usePropertyList({
  initialProperties,
  searchParams,
  isMyProperties,
  isWishlist,
  serverRenderedCount = 4,
  fetchSize = 15,
}: UsePropertyListOptions) {
  const t = useTranslations('properties');
  const locale = useLocale();

  // ------- 列表与可见数量 -------
  const [properties, setProperties] = useState<PropertyType[]>(initialProperties); //initialProperties初始为0
  const [visibleCount, setVisibleCount] = useState(0);
  const visibleProperties = useMemo(
    () => properties.slice(0, visibleCount),
    [properties, visibleCount]
  );

  // ------- 状态 -------
  const [isLoading, setIsLoading] = useState(initialProperties.length === 0);
  const [error, setError] = useState('');
  const [initialBatchSize, setInitialBatchSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [renderPhase, setRenderPhase] = useState(1); // 1=首屏, 2=完整批次
  const SSR_COUNT = serverRenderedCount;
  const shouldSkipPhase1 = initialProperties.length <= SSR_COUNT;

  // ------- 无限滚动 -------
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersectionObserver(loadMoreRef, { rootMargin: '150px' });
  const inFlightRef = useRef(false);

  // ------- 翻译 -------
  const { translateGrouped } = useTranslate();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationContext, setTranslationContext] = useState<TranslationContext>({
    titles: {},
    cities: {},
    countries: {},
  });
  const prevLenRef = useRef(0);

  // ------- 搜索参数（路由上找不到就用 props） -------
  const urlSearchParams = useSearchParams();
  const currentSearchParams: SearchParamsType =
    searchParams || {
      where: urlSearchParams.get('where') || urlSearchParams.get('location') || '',
      checkIn: urlSearchParams.get('check-in') || '',
      checkOut: urlSearchParams.get('check-out') || '',
      guests: parseInt(urlSearchParams.get('guests') || '1'),
      category: urlSearchParams.get('category') || '',
    };
  const serializedParams = JSON.stringify(currentSearchParams);
  const lastSearchParamsRef = useRef(serializedParams);

  // ------- 屏幕大小 → 一屏容量 -------
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setInitialBatchSize(3);
      else if (w < 768) setInitialBatchSize(4);
      else if (w < 1024) setInitialBatchSize(6);
      else if (w < 1280) setInitialBatchSize(8);
      else setInitialBatchSize(10);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ------- 初始化取数 -------
  useEffect(() => {
    if (initialProperties.length !== 0) return;

    // 我的/心愿单：一次性拉全
    if (isMyProperties || isWishlist) {
      (async () => {
        try {
          setIsLoading(true);
          let endpoint = '/api/properties/';
          if (isMyProperties) endpoint = '/api/properties/my/';
          else if (isWishlist) endpoint = '/api/properties/wishlist/';
          const data = await apiService.get(endpoint);
          setProperties(data);
          setVisibleCount(Math.min(initialBatchSize, data.length));
          setHasMore(false);
        } catch (e) {
          setError(t('loadError'));
          console.error('Error fetching properties:', e);
        } finally {
          setIsLoading(false);
        }
      })();
      return;
    }

    // 首页/搜索：SSR 已渲染 firstScreen，客户端接后续
    if (serverRenderedCount > 0) {
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
          setHasMore(data.length === fetchSize);
        } catch (e) {
          setError(t('loadError'));
          console.error('Error fetching initial properties:', e);
        } finally {
          setIsLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------- Phase 1：仅展示首屏（最多 5 条）-------
  useEffect(() => {
    if (!properties.length) return;
    if (shouldSkipPhase1) {
      setRenderPhase(2);
    } else {
      setVisibleCount(Math.min(SSR_COUNT, initialBatchSize, properties.length));
      const timerId = setTimeout(() => {
        requestAnimationFrame(() => setRenderPhase(2));
      }, 100);
      return () => clearTimeout(timerId);
    }
  }, [properties.length, renderPhase, initialBatchSize, shouldSkipPhase1]);

  // ------- Phase 2：补齐到完整一屏 -------
  useEffect(() => {
    if (renderPhase !== 2) return;
    const target = Math.min(initialBatchSize, properties.length);
    setVisibleCount((prev) => Math.max(prev, target));
  }, [renderPhase, initialBatchSize, properties.length]);

  // ------- 无限滚动：先吃缓冲，再请求 -------
  useEffect(() => {
    if (renderPhase !== 2 || !isLoadMoreVisible || isLoading) return;

    // 先吃本地缓冲
    if (visibleCount < properties.length) {
      setVisibleCount((c) => Math.min(c + initialBatchSize, properties.length));
      return;
    }

    // 我的/心愿单不分页；无更多或在飞则不请求
    if (!hasMore || isMyProperties || isWishlist || inFlightRef.current) return;

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
        setVisibleCount((c) => c + Math.min(initialBatchSize, data.length));
        setHasMore(data.length === fetchSize);
      } catch (e) {
        setError(t('loadError'));
        console.error('Error fetching more properties:', e);
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
    serverRenderedCount,
    currentSearchParams,
    fetchSize,
    t,
  ]);

  // ------- 记录搜索参数变化（软导航场景）-------
  useEffect(() => {
    if (serializedParams !== lastSearchParamsRef.current) {
      lastSearchParamsRef.current = serializedParams;
    }
  }, [serializedParams]);

  // ------- 翻译：增量 + 切语言重译 -------
  const translateSubset = useCallback(
    async (subset: PropertyType[]) => {
      if (locale === 'en' || subset.length === 0) return;

      const titles: string[] = [];
      const cities: string[] = [];
      const countries: string[] = [];

      for (const p of subset) {
        if (p.title && !translationContext.titles[p.title]) titles.push(p.title);
        if (p.city && !translationContext.cities[p.city]) cities.push(p.city);
        if (p.country && !translationContext.countries[p.country]) countries.push(p.country);
      }

      if (!titles.length && !cities.length && !countries.length) return;

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
    },
    [locale, translateGrouped, translationContext]
  );

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

  useEffect(() => {
    setTranslationContext({ titles: {}, cities: {}, countries: {} });
    prevLenRef.current = 0;

    if (locale !== 'en' && properties.length > 0 && !isLoading) {
      translateSubset(properties);
      prevLenRef.current = properties.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // ------- 提供一个 helper 获取单条翻译 -------
  const getTranslationsFor = useCallback(
    (p: PropertyType) => ({
      title: translationContext.titles[p.title || ''] || '',
      city: translationContext.cities[p.city || ''] || '',
      country: translationContext.countries[p.country || ''] || '',
    }),
    [translationContext]
  );

  return {
    properties,
    visibleProperties,
    visibleCount,
    isLoading,
    error,
    isTranslating,
    loadMoreRef,
    getTranslationsFor,
  };
}
