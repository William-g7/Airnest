'use client';

import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useSearchQuery} from '@search//hooks/useSearchQuery';
import { propertyCategories } from '@properties/types/Property';

export default function CategoryScroller() {
  const t = useTranslations('categories');
  const {state, replaceUrl, isPending} = useSearchQuery();

  const handleClick = (value: string) => {
    if (isPending) return;
    const next = state.category === value ? '' : value;
    replaceUrl({category: next});
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between overflow-x-auto scrollbar-hide py-4 px-0 w-full">
        {propertyCategories.map((item) => {
          const active = state.category === item.value;
          return (
            <motion.button
              key={item.value}
              onClick={() => handleClick(item.value)}
              disabled={isPending}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 flex-1 min-w-[80px] group
                ${active ? 'text-airbnb border-b-2 border-airbnb bg-red-50'
                         : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
                ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              whileHover={!isPending && !active ? {scale: 1.05} : {}}
              whileTap={!isPending ? {scale: 0.95} : {}}
              aria-pressed={active}
              aria-label={`${t('selectCategory')}: ${t(item.value)}`}
            >
              <div className={`w-6 h-6 mb-2 transition-colors duration-200 ${active ? 'text-airbnb' : 'text-gray-500 group-hover:text-gray-700'}`}>
                <img src={item.icon} alt={item.label} className="w-full h-full object-contain" />
              </div>
              <span className={`text-xs font-medium text-center leading-tight transition-colors duration-200 ${active ? 'text-airbnb' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {t(item.value)}
              </span>
              {isPending && active && (
                <motion.div
                  initial={{opacity: 0}}
                  animate={{opacity: 1}}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2"
                >
                  <div className="w-4 h-0.5 bg-airbnb rounded-full animate-pulse" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 渐变遮罩（左右） */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
}
