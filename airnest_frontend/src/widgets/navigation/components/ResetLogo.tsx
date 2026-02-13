'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useLocale} from 'next-intl';
import {usePathname} from 'next/navigation';
import {useSearchQuery} from '@search/hooks/useSearchQuery';

export default function ResetLogo() {
  const locale = useLocale();
  const pathname = usePathname();
  const {replaceUrl} = useSearchQuery();

  const homePath = `/${locale}`;
  const isHome = pathname === homePath;

  return (
    <Link
      href={homePath}
      prefetch={false}
      className="relative z-50 flex-shrink-0 inline-flex cursor-pointer transition-transform duration-300 pointer-events-auto"
      style={{ transform: `scale(var(--logo-scale, 1))` }}
      aria-label="Go to home"
      onClickCapture={(e) => {
        // 先拦截，避免父级处理
        e.stopPropagation();
        (e.nativeEvent as any)?.stopImmediatePropagation?.();

        if (isHome) {
          // 已在首页：仅清空查询参数（不触发路由跳转）
          e.preventDefault();
          replaceUrl({
            location: '',
            check_in: null,
            check_out: null,
            guests: 1,
            category: '',
          });
        }
        // 不在首页：让 <Link> 正常导航到 /{locale}，自然也会去掉 ?query
      }}
    >
      <Image
        src="/logo.png"
        alt="Airnest"
        width={100}
        height={38}
        priority
        style={{ width: 'auto', height: 'auto' }}
      />
    </Link>
  );
}
