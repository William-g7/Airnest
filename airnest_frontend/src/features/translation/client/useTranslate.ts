'use client';

import {useCallback} from 'react';
import {useTranslationStore} from '@translation/client/translationStore';
import {useLocale} from 'next-intl';

export interface GroupedTranslationRequest { [key: string]: string[] }
export interface GroupedTranslationResponse { [key: string]: Record<string, string> }

export function useTranslate() {
  const locale = useLocale();

  const translateGroupedFn  = useTranslationStore(s => s.translateGrouped);

  const translateGrouped = useCallback(
    async (data: GroupedTranslationRequest, targetLocale?: string): Promise<GroupedTranslationResponse> => {
      const l = targetLocale ?? locale;

      if (l === 'en') {
        const out: GroupedTranslationResponse = {};
        for (const [k, arr] of Object.entries(data)) {
          const list = Array.isArray(arr) ? arr.filter(Boolean) : [];
          out[k] = list.reduce<Record<string, string>>((acc, t) => ((acc[t] = t), acc), {});
        }
        return out;
      }

      return translateGroupedFn(data, l);
    },
    [locale, translateGroupedFn]
  );

  return { translateGrouped, currentLocale: locale };
}
