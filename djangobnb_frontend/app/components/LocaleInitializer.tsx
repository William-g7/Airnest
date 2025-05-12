'use client'

import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';
import { useLocaleStore } from '@/app/stores/localeStore';
import { locales } from '../../i18n/routing';

/**
 * 语言初始化组件，用来保证在应用启动时就能正确获取语言并且同步全局状态
 */
export function LocaleInitializer() {
    const pathname = usePathname();
    const setLocale = useLocaleStore(state => state.setLocale);
    const currentLocaleInStore = useLocaleStore(state => state.locale);

    useEffect(() => {

        const initializeLocale = () => {
            // 默认是en语言
            let pathLocale = 'en';

            // 直接从浏览器URL获取完整路径
            if (typeof window !== 'undefined') {
                const fullPath = window.location.pathname;

                const match = fullPath.match(/^\/([a-z]{2})(\/|$)/);
                if (match && match[1] && locales.includes(match[1] as any)) {
                    pathLocale = match[1];
                } else {
                    pathLocale = 'en';
                }
            }

            // 如果store中的语言与路径中的不一致，则更新
            if (currentLocaleInStore !== pathLocale) {
                setLocale(pathLocale);
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem('airnest-locale', JSON.stringify({
                        state: {
                            locale: pathLocale,
                            intlLocale: pathLocale === 'zh' ? 'zh-CN' : pathLocale === 'fr' ? 'fr-FR' : 'en-US'
                        },
                        version: 0
                    }));
                }
            }
        };

        initializeLocale();

        // 监听路径变化，当用户切换语言时同步更新
        window.addEventListener('popstate', initializeLocale);
        window.addEventListener('pushstate', initializeLocale);

        // 创建一个 MutationObserver 来观察DOM变化，兜底捕获路由导航
        const observer = new MutationObserver(() => {
            initializeLocale();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener('popstate', initializeLocale);
            window.removeEventListener('pushstate', initializeLocale);
            observer.disconnect();
        };
    }, [pathname, setLocale, currentLocaleInStore]);

    return null;
} 