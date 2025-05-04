import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './routing';

// 定义每个地区的配置
const localeConfig = {
    'zh': {
        timeZone: 'Asia/Shanghai',
        currency: 'CNY'
    },
    'en': {
        timeZone: 'America/New_York',
        currency: 'USD'
    },
    'fr': {
        timeZone: 'Europe/Paris',
        currency: 'EUR'
    }
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    if (!locale || !locales.includes(locale as any)) {
        locale = defaultLocale;
    }

    const config = localeConfig[locale as keyof typeof localeConfig] || localeConfig[defaultLocale];

    // 动态导入语言资源，避免在服务器端进行不必要的导入
    const messages = await import(`../messages/${locale}.json`)
        .then((module) => module.default)
        .catch(() => import(`../messages/${defaultLocale}.json`).then((module) => module.default));

    return {
        locale,
        messages,
        timeZone: config.timeZone,
        formats: {
            dateTime: {
                short: {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }
            },
            number: {
                currency: {
                    style: 'currency',
                    currency: config.currency
                }
            }
        },
        now: new Date()
    };
}); 