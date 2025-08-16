'use client';

import { useState, useEffect } from 'react';
import { registerLocale } from 'react-datepicker';

type SupportedLocale = 'zh-CN' | 'en-US' | 'fr-FR';

interface DatePickerLocaleState {
  isLoaded: boolean;
  locale: SupportedLocale;
}

// 缓存已加载的locale，避免重复加载
const loadedLocales = new Set<SupportedLocale>();

/**
 * 异步加载date-fns语言包的hook
 * 支持zh-CN, en-US, fr-FR三种语言
 */
export const useDatePickerLocale = (locale: string): DatePickerLocaleState => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // 将项目locale映射到date-fns支持的locale
  const mapLocale = (projectLocale: string): SupportedLocale => {
    switch (projectLocale) {
      case 'zh':
        return 'zh-CN';
      case 'fr':
        return 'fr-FR';
      case 'en':
      default:
        return 'en-US';
    }
  };

  const datePickerLocale = mapLocale(locale);

  useEffect(() => {
    const loadLocale = async () => {
      // 如果已经加载过，直接返回
      if (loadedLocales.has(datePickerLocale)) {
        setIsLoaded(true);
        return;
      }

      try {
        let localeData;
        
        // 按需异步导入对应的locale
        switch (datePickerLocale) {
          case 'zh-CN':
            const { zhCN } = await import('date-fns/locale/zh-CN');
            localeData = zhCN;
            break;
          case 'fr-FR':
            const { fr } = await import('date-fns/locale/fr');
            localeData = fr;
            break;
          case 'en-US':
          default:
            const { enUS } = await import('date-fns/locale/en-US');
            localeData = enUS;
            break;
        }

        // 注册到react-datepicker
        registerLocale(datePickerLocale, localeData);
        loadedLocales.add(datePickerLocale);
        setIsLoaded(true);
      } catch (error) {
        console.error(`Failed to load date picker locale: ${datePickerLocale}`, error);
        // 降级到英语
        if (datePickerLocale !== 'en-US') {
          try {
            const { enUS } = await import('date-fns/locale/en-US');
            registerLocale('en-US', enUS);
            loadedLocales.add('en-US');
          } catch (fallbackError) {
            console.error('Failed to load fallback locale', fallbackError);
          }
        }
        setIsLoaded(true);
      }
    };

    loadLocale();
  }, [datePickerLocale]);

  return {
    isLoaded,
    locale: datePickerLocale,
  };
};