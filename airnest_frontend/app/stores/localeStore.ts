import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { locales } from '../../i18n/routing';

interface LocaleState {
  locale: string;
  intlLocale: string;
  setLocale: (locale: string) => void;
}

const localeMap: Record<string, string> = {
  en: 'en-US',
  zh: 'zh-CN',
  fr: 'fr-FR',
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    set => ({
      locale: 'en',
      intlLocale: 'en-US',
      setLocale: locale =>
        set({
          locale,
          intlLocale: localeMap[locale] || 'en-US',
        }),
    }),
    {
      name: 'airnest-locale',
    }
  )
);

// 尝试从URL获取当前语言
function getCurrentLocaleFromUrl(): string {
  if (typeof window !== 'undefined') {
    const fullPath = window.location.pathname;

    const match = fullPath.match(/^\/([a-z]{2})(\/|$)/);
    if (match && match[1] && locales.includes(match[1] as any)) {
      return match[1];
    }
  }
  return 'en';
}

// 辅助函数，用于获取客户端和服务器端共用的状态
export const getLocaleState = () => {
  // 服务端：从URL获取当前语言
  if (typeof window === 'undefined') {
    const currentLocale = getCurrentLocaleFromUrl();
    return {
      locale: currentLocale,
      intlLocale: localeMap[currentLocale] || 'en-US',
    };
  }

  try {
    // 客户端：首先尝试从状态管理获取
    const state = useLocaleStore.getState();

    if (state.locale) {
      return state;
    }

    // 如果状态为空，尝试从URL获取
    const currentLocale = getCurrentLocaleFromUrl();
    // 更新Zustand状态以便未来使用
    useLocaleStore.getState().setLocale(currentLocale);

    return {
      locale: currentLocale,
      intlLocale: localeMap[currentLocale] || 'en-US',
    };
  } catch (error) {
    return { locale: 'en', intlLocale: 'en-US' };
  }
};
