import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './routing';

const localeConfig = {
  zh: {
    timeZone: 'Asia/Shanghai',
    currency: 'CNY',
  },
  en: {
    timeZone: 'America/New_York',
    currency: 'USD',
  },
  fr: {
    timeZone: 'Europe/Paris',
    currency: 'EUR',
  },
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    locale = defaultLocale;
  }

  const config = localeConfig[locale as keyof typeof localeConfig] || localeConfig[defaultLocale];

  const messages = await import(`../messages/${locale}.json`)
    .then(module => module.default)
    .catch(() => import(`../messages/${defaultLocale}.json`).then(module => module.default));

  return {
    locale,
    messages,
    timeZone: config.timeZone,
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
      },
      number: {
        currency: {
          style: 'currency',
          currency: config.currency,
        },
      },
    },
    now: new Date(),
  };
});
