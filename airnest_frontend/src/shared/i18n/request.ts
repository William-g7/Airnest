import {getRequestConfig} from 'next-intl/server';
import {locales, defaultLocale} from './routing';

const localeConfig = {
  zh: {timeZone: 'Asia/Shanghai',  currency: 'CNY'},
  en: {timeZone: 'America/New_York', currency: 'USD'},
  fr: {timeZone: 'Europe/Paris',    currency: 'EUR'}
} as const;

/** 只允许 locale 作为最后一段的变量；模块目录必须是静态常量 */
const FEATURE_IMPORTERS = {
  'favorites':     (locale: string) => import(`../../features/favorites/i18n/${locale}.json`),
  'day-picker':    (locale: string) => import(`../../features/day-picker/i18n/${locale}.json`),
  'add-property':  (locale: string) => import(`../../features/add-property/i18n/${locale}.json`),
  'auth':          (locale: string) => import(`../../features/auth/i18n/${locale}.json`),
  'search':        (locale: string) => import(`../../features/search/i18n/${locale}.json`),
  'properties':    (locale: string) => import(`../../features/properties/i18n/${locale}.json`) 
} as const;

const WIDGET_IMPORTERS = {
  'navigation':    (locale: string) => import(`../../widgets/navigation/i18n/${locale}.json`)
} as const;

/** 安全加载（先 locale，失败则回退 defaultLocale，再失败返回 {}） */
async function safeLoad(loadFn: (loc: string) => Promise<any>, locale: string, fallback: string) {
  try {
    const m = await loadFn(locale);
    return (m as any).default ?? m;
  } catch {
    try {
      const m = await loadFn(fallback);
      return (m as any).default ?? m;
    } catch {
      return {};
    }
  }
}

/** 简单深合并（对象级） */
function mergeMessages<T extends Record<string, any>>(...dicts: T[]): T {
  return dicts.reduce((acc, cur) => {
    for (const k in cur) {
      const v = cur[k];
      acc[k] =
        v && typeof v === 'object' && !Array.isArray(v)
          ? {...(acc[k] || {}), ...v}
          : v;
    }
    return acc;
  }, {} as T);
}

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    locale = defaultLocale;
  }

  const {timeZone, currency} =
    localeConfig[locale as keyof typeof localeConfig] ?? localeConfig[defaultLocale];

  // 1) 公共 messages：src/shared/i18n/messages/<locale>.json（不存在时回退默认语言）
  const common =
    (await import(`./messages/${locale}.json`)
      .then(m => (m as any).default ?? m)
      .catch(async () => {
        try { return (await import(`./messages/${defaultLocale}.json`)).default; }
        catch { return {}; }
      })) as Record<string, any>;

  // 2) features
  const featureBundles = await Promise.all(
    Object.values(FEATURE_IMPORTERS).map((importer) =>
      safeLoad(importer, locale!, defaultLocale)
    )
  );

  // 3) widgets
  const widgetBundles = await Promise.all(
    Object.values(WIDGET_IMPORTERS).map((importer) =>
      safeLoad(importer, locale!, defaultLocale)
    )
  );

  return {
    locale,
    messages: mergeMessages(common, ...featureBundles, ...widgetBundles),
    timeZone,
    formats: {
      dateTime: {short: {day: 'numeric', month: 'short', year: 'numeric'}},
      number: {currency: {style: 'currency', currency}}
    },
    now: new Date()
  };
});
