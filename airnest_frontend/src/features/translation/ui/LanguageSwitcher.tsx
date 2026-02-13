'use client';

import {useTransition, useState, useEffect} from 'react';
import {localeNames} from '@i18n/routing';
import {usePathname, useRouter} from '@i18n/navigation';
import {useParams} from 'next/navigation';
import {motion, AnimatePresence} from 'framer-motion';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (locale: string) => {
    setIsOpen(false);
    startTransition(() => {
      router.replace({ pathname: pathname as any, params: params as any }, { locale });
    });
  };

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && !target.closest('.language-switcher-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const entries = Object.entries(localeNames) as Array<[string, string]>;

  return (
    <div className="relative language-switcher-container">
      <button
        className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:bg-gray-100 hover:scale-105 active:scale-95 "
        onClick={() => setIsOpen(v => !v)}
        disabled={isPending}
        aria-label="Change language"
      >
        <span className="text-lg">🌏</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{opacity: 0, y: -10, scale: 0.95}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: -10, scale: 0.95}}
            transition={{duration: 0.2}}
            className="absolute right-0 mt-2 py-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            {entries.map(([locale, name]) => (
              <button
                key={locale}
                className="w-full px-4 py-2 text-left text-sm transition-colors duration-200 hover:bg-gray-100 hover:text-airbnb"
                onClick={() => handleLocaleChange(locale)}
              >
                {name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
