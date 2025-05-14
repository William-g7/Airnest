'use client';

import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/app/stores/searchStore';
import { propertyCategories } from '@/app/constants/propertyCategores';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Categories = () => {
  const t = useTranslations('categories');
  const { category, setCategory } = useSearchStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const checkScrollPosition = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
      return () => scrollEl.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  const handleCategoryClick = (categoryValue: string) => {
    if (category === categoryValue) {
      setCategory('');
    } else {
      setCategory(categoryValue);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;

    const scrollAmount = 300;
    const currentScroll = scrollRef.current.scrollLeft;

    scrollRef.current.scrollTo({
      left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative pt-2 pb-6 w-full">
      {/* The left arrow */}
      {!isMobile && showLeftArrow && (
        <div
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1 cursor-pointer hover:scale-110 transition-transform"
          onClick={() => scroll('left')}
        >
          <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
        </div>
      )}

      {/* The category scroll container */}
      <div
        ref={scrollRef}
        className="flex justify-between items-center overflow-x-auto scrollbar-hide scroll-smooth px-2 md:px-6"
        onScroll={checkScrollPosition}
      >
        {propertyCategories.map(item => (
          <motion.div
            key={item.value}
            className={`
                            relative mx-2 px-3 py-2 rounded-lg flex flex-col items-center space-y-2 
                            transition-all duration-300 ease-in-out cursor-pointer
                            ${
                              category === item.value ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'
                            }
                        `}
            onClick={() => handleCategoryClick(item.value)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <motion.div
              className={`
                                w-8 h-8 relative flex items-center justify-center
                                ${category === item.value ? 'scale-110' : ''}
                            `}
              animate={{
                scale: category === item.value ? 1.1 : 1,
                y: category === item.value ? -2 : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src={item.icon}
                alt={item.label}
                width={28}
                height={28}
                className="object-contain"
              />
            </motion.div>
            <span
              className={`
                            text-xs font-medium whitespace-nowrap
                            ${category === item.value ? 'font-semibold text-gray-900' : 'text-gray-600'}
                        `}
            >
              {t(item.value, { fallback: item.label })}
            </span>

            {/* The bottom border, keep straight */}
            {category === item.value && (
              <div
                className="absolute bottom-0 left-0 w-full h-[2px] bg-airbnb"
                style={{ borderRadius: 0 }}
              ></div>
            )}
          </motion.div>
        ))}
      </div>

      {/* The right arrow */}
      {!isMobile && showRightArrow && (
        <div
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1 cursor-pointer hover:scale-110 transition-transform"
          onClick={() => scroll('right')}
        >
          <ChevronRightIcon className="h-6 w-6 text-gray-600" />
        </div>
      )}
    </div>
  );
};

export default Categories;
