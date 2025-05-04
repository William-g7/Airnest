import { createNavigation } from 'next-intl/navigation';
import { routing, locales } from './routing';

// 创建链接和重定向函数
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);

// 处理语言切换时的路径计算
export function getLocalizedPath(
    currentPathname: string,
    currentLocale: string,
    newLocale: string
): string {
    // 处理当前路径在不同语言下的转换
    if (currentPathname.startsWith(`/${currentLocale}/`)) {
        // 路径格式为 /语言/其他路径
        return currentPathname.replace(`/${currentLocale}/`, `/${newLocale}/`);
    } else if (currentPathname === `/${currentLocale}`) {
        // 路径仅为 /语言
        return `/${newLocale}`;
    } else if (currentPathname.startsWith('/')) {
        // 路径不包含语言代码
        return `/${newLocale}${currentPathname}`;
    }

    // 默认情况
    return `/${newLocale}`;
}

// 从URL获取当前语言
export function getLocaleFromPathname(pathname: string): string | null {
    if (!pathname) return null;

    // 检查路径是否以某个语言代码开头
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];

    if (locales.includes(firstSegment as any)) {
        return firstSegment;
    }

    return null;
} 