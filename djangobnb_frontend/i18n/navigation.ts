import { createNavigation } from 'next-intl/navigation';
import { routing, locales } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

export function getLocalizedPath(
  currentPathname: string,
  currentLocale: string,
  newLocale: string
): string {
  // 路径格式为 /语言/其他路径
  if (currentPathname.startsWith(`/${currentLocale}/`)) {
    return currentPathname.replace(`/${currentLocale}/`, `/${newLocale}/`);
    // 路径仅为 /语言
  } else if (currentPathname === `/${currentLocale}`) {
    return `/${newLocale}`;
    // 路径不包含语言代码
  } else if (currentPathname.startsWith('/')) {
    return `/${newLocale}${currentPathname}`;
  }
  return `/${newLocale}`;
}

// 从URL获取当前语言
export function getLocaleFromPathname(pathname: string): string {
  if (!pathname) {
    return 'en';
  }

  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && locales.includes(firstSegment as (typeof locales)[number])) {
    return firstSegment;
  }

  return 'en';
}
