'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
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
  searchParams?: SearchParams; // 搜索参数，用于客户端分页
  isMyProperties?: boolean;
  isWishlist?: boolean;
  serverRenderedCount?: number; // 服务端已渲染的数量，用于计算偏移量
  renderInParentGrid?: boolean; // 是否在父组件的网格中渲染
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
  
  // 使用服务器传递的初始数据初始化状态
  const [properties, setProperties] = useState<PropertyType[]>(initialProperties);
  const [visibleProperties, setVisibleProperties] = useState<PropertyType[]>([]);
  const [isLoading, setIsLoading] = useState(initialProperties.length === 0);
  const [error, setError] = useState('');
  const [lastSearchParams, setLastSearchParams] = useState('');
  const [initialBatchSize, setInitialBatchSize] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersectionObserver(loadMoreRef, { rootMargin: '300px' });

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationContext, setTranslationContext] = useState<TranslationContext>({
    titles: {},
    cities: {},
    countries: {},
  });

  const { translateGrouped } = useTranslate();
  const { locale } = useLocaleStore();

  // 使用传入的搜索参数，如果没有则从URL解析
  const urlSearchParams = useSearchParams();
  const currentSearchParams = searchParams || { 
    where: urlSearchParams.get('where') || urlSearchParams.get('location') || '',
    checkIn: urlSearchParams.get('check-in') || '',
    checkOut: urlSearchParams.get('check-out') || '',
    guests: parseInt(urlSearchParams.get('guests') || '1'),
    category: urlSearchParams.get('category') || ''
  };
  
  const serializedParams = JSON.stringify(currentSearchParams);

  // 添加分阶段渲染状态
  const [renderPhase, setRenderPhase] = useState(1); // 1 = 仅首屏, 2 = 完整批次

  // 优化可见属性计算，减少不必要的重新计算
  const visiblePropertiesMemo = useMemo(() => {
    if (properties.length === 0) return [];
    
    // 第一阶段只渲染首屏必要的项目（最多5个）
    if (renderPhase === 1) {
      return properties.slice(0, Math.min(5, initialBatchSize));
    }
    
    // 第二阶段渲染完整批次
    return properties.slice(0, initialBatchSize);
  }, [properties, initialBatchSize, renderPhase]);

  // 设置渲染阶段，在初次渲染后短暂延迟渲染剩余内容
  useEffect(() => {
    if (properties.length > 0 && renderPhase === 1) {
      // 使用requestAnimationFrame确保首屏内容优先渲染
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          setRenderPhase(2);
        });
      }, 100); // 短暂延迟后渲染更多内容
      
      return () => clearTimeout(timeoutId);
    }
  }, [properties.length, renderPhase]);

  // 更新可见属性的逻辑
  useEffect(() => {
    setVisibleProperties(visiblePropertiesMemo);
  }, [visiblePropertiesMemo]);

  // 检测到加载更多区域时的处理逻辑
  useEffect(() => {
    if (isLoadMoreVisible && !isLoading && renderPhase === 2) {
      // 情况1：本地还有未显示的数据，先显示本地数据
      if (visibleProperties.length < properties.length) {
        const nextBatch = properties.slice(0, visibleProperties.length + initialBatchSize);
        setVisibleProperties(nextBatch);
      }
      // 情况2：本地数据已全部显示，且不是特殊页面，从服务器获取更多数据
      else if (visibleProperties.length === properties.length && !isMyProperties && !isWishlist) {
        // 将获取更多数据的逻辑内联，避免依赖问题
        (async () => {
          try {
            setIsLoading(true);
            const endpoint = '/api/properties/with-reviews/';
            
            const apiParams = formatApiParams({
              ...currentSearchParams,
              offset: serverRenderedCount + properties.length,  
              limit: 20
            });
            
            const params = new URLSearchParams(apiParams);
            const data = await apiService.getPropertiesWithReviews(params);
            
            if (data.length > 0) {
              const allProperties = [...properties, ...data];
              setProperties(allProperties);
              setVisibleProperties(allProperties.slice(0, initialBatchSize));
            }
          } catch (error) {
            setError(t('loadError'));
            console.error('Error fetching more properties:', error);
          } finally {
            setIsLoading(false);
          }
        })();
      }
    }
  }, [isLoadMoreVisible, visibleProperties.length, properties, initialBatchSize, isLoading, renderPhase, isMyProperties, isWishlist, currentSearchParams, t]);

  // 根据屏幕尺寸调整初始加载数量
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

  // 初始化：根据不同情况获取数据
  useEffect(() => {
    if (initialProperties.length === 0) {
      if (isMyProperties || isWishlist) {
        // 特殊页面：获取全部数据
        (async () => {
          try {
            setIsLoading(true);
            let endpoint = '/api/properties/';

            if (isMyProperties) {
              endpoint = '/api/properties/my/';
            } else if (isWishlist) {
              endpoint = '/api/properties/wishlist/';
            }

            const data = await apiService.getwithtoken(endpoint);
            setProperties(data);
            setVisibleProperties(data.slice(0, initialBatchSize));
          } catch (error) {
            setError(t('loadError'));
            console.error('Error fetching properties:', error);
          } finally {
            setIsLoading(false);
          }
        })();
      } else if (serverRenderedCount > 0) {
        // 主页：服务端已渲染前几条，客户端获取剩余数据
        (async () => {
          try {
            setIsLoading(true);
            const endpoint = '/api/properties/with-reviews/';
            
            const apiParams = formatApiParams({
              ...currentSearchParams,
              offset: serverRenderedCount,  
              limit: 20
            });
            
            const params = new URLSearchParams(apiParams);
            const data = await apiService.getPropertiesWithReviews(params);
            
            setProperties(data);
            setVisibleProperties(data.slice(0, initialBatchSize));
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

  // 当搜索参数变化时，清空当前数据让服务端重新渲染
  // 不在客户端重复获取数据，而是依赖整页的软导航
  useEffect(() => {
    if (serializedParams !== lastSearchParams) {
      setLastSearchParams(serializedParams);
      // 搜索参数变化时，路由会导致整页重新渲染，这里不需要重复获取数据
    }
  }, [serializedParams, lastSearchParams]);

  // 处理翻译
  useEffect(() => {
    setTranslationContext({
      titles: {},
      cities: {},
      countries: {},
    });

    if (locale !== 'en' && properties.length > 0 && !isLoading) {
      translateAllProperties();
    }
  }, [locale, properties, isLoading]);

  const translateAllProperties = async () => {
    if (locale === 'en' || properties.length === 0 || isTranslating) {
      return;
    }

    setIsTranslating(true);
    console.log(`Begin translating ${properties.length} properties`);

    try {
      const titles: string[] = [];
      const cities: string[] = [];
      const countries: string[] = [];

      properties.forEach(property => {
        if (property.title) titles.push(property.title);
        if (property.city) cities.push(property.city);
        if (property.country) countries.push(property.country);
      });

      const translationsResult = await translateGrouped(
        {
          titles,
          cities,
          countries,
        },
        locale
      );

      setTranslationContext({
        titles: translationsResult.titles || {},
        cities: translationsResult.cities || {},
        countries: translationsResult.countries || {},
      });

      console.log(`Translation success, translated ${properties.length} properties`);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // 渲染列表
  if (isLoading) {
    return <PropertyListSkeleton count={initialBatchSize} />;
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-red-700 mb-2">{error}</h3>
        <p className="text-red-600">{t('tryAgainLater')}</p>
      </div>
    );
  }

  // 只有在特殊页面（我的房源、心愿单）且没有数据时才显示"无结果"
  // 主页的"无结果"状态由服务端组件(PropertyListContainerHybrid)处理
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
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

  // 如果是在父网格中渲染，直接返回卡片元素
  if (renderInParentGrid) {
    return (
      <>
        {/* 翻译进度提示 - 跨整行显示 */}
        {isTranslating && (
          <div className="col-span-full mb-4 p-2 bg-blue-50 text-blue-700 text-sm rounded-lg">
            {t('translationInProgress')}
          </div>
        )}

        {visibleProperties.map((property, index) => (
          <PropertyListItem
            key={`client-${property.id}`} // 使用不同前缀避免与服务端key冲突
            property={property}
            isFirstScreen={false} // 客户端渲染的都不是首屏
            translations={{
              title: translationContext.titles[property.title || ''] || '',
              city: translationContext.cities[property.city || ''] || '',
              country: translationContext.countries[property.country || ''] || '',
            }}
          />
        ))}
        
        {/* 加载更多指示器 - 跨整行显示 */}
        {visibleProperties.length < properties.length && (
          <div 
            ref={loadMoreRef} 
            className="col-span-full w-full py-8 flex justify-center"
          >
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

  // 独立网格模式（用于特殊页面如我的房源、心愿单）
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
      
      {/* 加载更多指示器 */}
      {visibleProperties.length < properties.length && (
        <div 
          ref={loadMoreRef} 
          className="w-full py-8 flex justify-center"
        >
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
    <Suspense fallback={<PropertyListSkeleton />}>
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