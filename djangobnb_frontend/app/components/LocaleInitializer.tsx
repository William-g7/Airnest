'use client'

import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';
import { useLocaleStore } from '@/app/stores/localeStore';
import { locales } from '../../i18n/routing';

/**
 * 语言初始化组件
 * 这个组件不渲染任何UI，只是在应用启动时
 * 从URL路径中获取当前语言，并设置到全局状态
 */
export function LocaleInitializer() {
    const pathname = usePathname();
    const setLocale = useLocaleStore(state => state.setLocale);
    const currentLocaleInStore = useLocaleStore(state => state.locale);

    useEffect(() => {
        // 立即执行设置语言的操作
        const initializeLocale = () => {
            let pathLocale = 'en'; // 默认语言

            // 直接从浏览器URL获取完整路径
            if (typeof window !== 'undefined') {
                const fullPath = window.location.pathname;

                // 从完整路径中提取语言
                const match = fullPath.match(/^\/([a-z]{2})(\/|$)/);
                if (match && match[1] && locales.includes(match[1] as any)) {
                    pathLocale = match[1];
                } else {
                    // 在URL中没有显式的语言代码，使用默认语言
                    pathLocale = 'en';
                }
            }

            // 如果store中的语言与路径中的不一致，则更新
            if (currentLocaleInStore !== pathLocale) {
                setLocale(pathLocale);
                // 强制访问localStorage来触发持久化
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem('djangobnb-locale', JSON.stringify({
                        state: {
                            locale: pathLocale,
                            intlLocale: pathLocale === 'zh' ? 'zh-CN' : pathLocale === 'fr' ? 'fr-FR' : 'en-US'
                        },
                        version: 0
                    }));
                }
            }
        };

        // 立即执行
        initializeLocale();

        // 监听路径变化，当用户切换语言时同步更新
        window.addEventListener('popstate', initializeLocale);
        window.addEventListener('pushstate', initializeLocale);

        // 创建一个 MutationObserver 来观察DOM变化，捕获路由导航
        const observer = new MutationObserver(() => {
            initializeLocale();
        });

        // 开始观察
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener('popstate', initializeLocale);
            window.removeEventListener('pushstate', initializeLocale);
            observer.disconnect();
        };
    }, [pathname, setLocale, currentLocaleInStore]);

    // 这是一个纯逻辑组件，不渲染任何UI
    return null;
} 