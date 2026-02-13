'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

const ScrollToTop = () => {
  const t = useTranslations('common');
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20,
      },
    },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.8,
      transition: { duration: 0.2 },
    },
    hover: {
      scale: 1.1,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    tap: { scale: 0.95 },
  };

  const tooltipVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.2 },
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-8 right-8 z-50">
          <motion.button
            onClick={scrollToTop}
            className="relative p-3 bg-airbnb text-white rounded-full shadow-lg focus:outline-none"
            aria-label={t('backToTop') || 'Back to Top'}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            transition={{ duration: 0.2 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>

            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                  variants={tooltipVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {t('backToTop') || 'Back to Top'}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
