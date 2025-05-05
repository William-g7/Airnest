import { defineRouting } from 'next-intl/routing';

// 定义路由配置
export const routing = defineRouting({
    // 支持的语言列表
    locales: ['en', 'zh', 'fr'],

    // 默认语言
    defaultLocale: 'en',

    // 路由前缀模式
    // 'as-needed': 只有非默认语言有前缀
    // 'always': 所有语言都有前缀
    // 'never': 都没有前缀
    localePrefix: 'as-needed',

    // 路径映射配置
    pathnames: {
        '/': '/',
        '/properties': '/properties',
        '/properties/[id]': '/properties/[id]',
        '/landlords/[id]': '/landlords/[id]',
        '/inbox': '/inbox',
        '/inbox/[id]': '/inbox/[id]',
        '/myproperties': '/myproperties',
        '/mywishlists': '/mywishlists',
        '/myreservations': '/myreservations',
        '/myprofile': '/myprofile',
        '/myprofile/[id]': '/myprofile/[id]',
        '/messages': '/messages',
        '/notifications': '/notifications',
        '/trips': '/trips',
        '/auth/login': '/auth/login',
        '/auth/register': '/auth/register'
    }
});

// 导出类型和常量，方便在其他文件中使用
export const { locales, defaultLocale } = routing;

// 语言名称显示映射
export const localeNames: Record<typeof locales[number], string> = {
    en: 'English',
    zh: '中文',
    fr: 'Français'
};

// 获取cookie名称（用于存储用户语言偏好）
export const localeCookieName = 'NEXT_LOCALE'; 