'use client';

import { useEffect } from 'react';
import { memoryTranslationCache } from '@translation/cache/memoryCache';

type Props = {
  locale: string;
  translationsData: {
    titles?: Record<string, string>;
    cities?: Record<string, string>;
    countries?: Record<string, string>;
    description?: Record<string, string>;
  };
};

export default function ClientCacheSeed({ locale, translationsData }: Props) {
  useEffect(() => {
    if (!translationsData || locale === 'en') return;

    const putAll = (obj?: Record<string,string>) => {
      if (!obj) return;
      for (const [orig, tran] of Object.entries(obj)) {
        if (!orig) continue;
        memoryTranslationCache.set(orig, locale, tran);
      }
    };

    putAll(translationsData.titles);
    putAll(translationsData.cities);
    putAll(translationsData.countries);
    putAll(translationsData.description);
  }, [locale, translationsData]);

  return null;
}
