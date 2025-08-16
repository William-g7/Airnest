'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { buildSearchQuery, parseSearchParams } from '@/app/utils/searchParams';
import { propertyCategories } from '@/app/constants/propertyCategores';

/**
 * 增强型类别选择组件
 * 支持节流、无刷新导航的类别筛选
 */
export default function EnhancedCategories() {
  const t = useTranslations('categories');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 解析当前参数
  const currentParams = parseSearchParams(searchParams);
  const [isThrottling, setIsThrottling] = useState(false);
  
  /**
   * 处理类别选择
   */
  const handleCategorySelect = useCallback(async (categoryKey: string) => {
    // 防止连续点击
    if (isThrottling) return;
    
    setIsThrottling(true);
    
    // 构建新的查询参数
    const newCategory = currentParams.category === categoryKey ? '' : categoryKey;
    const query = buildSearchQuery({
      ...currentParams,
      category: newCategory
    });
    
    // 无刷新导航
    const newUrl = query.toString() ? `/?${query.toString()}` : '/';
    router.replace(newUrl);
    
    // 节流保护：300ms内不允许重复点击
    setTimeout(() => {
      setIsThrottling(false);
    }, 300);
  }, [currentParams, router, isThrottling]);
  
  return (
    <div className="relative">
      {/* 类别滚动容器 */}
      <div className="flex items-center justify-between overflow-x-auto scrollbar-hide py-4 px-0 w-full">
        {propertyCategories.map((item) => {
          const isActive = currentParams.category === item.value;
          
          return (
            <motion.button
              key={item.value}
              onClick={() => handleCategorySelect(item.value)}
              disabled={isThrottling}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 flex-1 min-w-[80px] group
                ${isActive 
                  ? 'text-airbnb border-b-2 border-airbnb bg-red-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
                ${isThrottling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              whileHover={!isThrottling && !isActive ? { scale: 1.05 } : {}}
              whileTap={!isThrottling ? { scale: 0.95 } : {}}
              aria-pressed={isActive}
              aria-label={`${t('selectCategory')}: ${t(item.value)}`}
            >
              {/* 图标 */}
              <div className={`
                w-6 h-6 mb-2 transition-colors duration-200
                ${isActive ? 'text-airbnb' : 'text-gray-500 group-hover:text-gray-700'}
              `}>
                <img 
                  src={item.icon} 
                  alt={item.label}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* 标签 */}
              <span className={`
                text-xs font-medium text-center leading-tight transition-colors duration-200
                ${isActive ? 'text-airbnb' : 'text-gray-600 group-hover:text-gray-900'}
              `}>
                {t(item.value)}
              </span>
              
              {/* 加载指示器 */}
              {isThrottling && isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2"
                >
                  <div className="w-4 h-0.5 bg-airbnb rounded-full animate-pulse"></div>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* 渐变遮罩 */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      
      {/* 节流状态指示 */}
      {isThrottling && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-full z-50"
        >
          {t('loading')}
        </motion.div>
      )}
    </div>
  );
}

/**
 * 添加滚动隐藏样式
 */
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = scrollbarHideStyles;
  document.head.appendChild(styleSheet);
}