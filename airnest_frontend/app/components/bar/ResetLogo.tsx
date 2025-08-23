'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';        // 你在用 next-intl
import { useSearchStore } from '@/app/stores/searchStore';

export default function ResetLogo() {
  const locale = useLocale();
  const { resetFilters } = useSearchStore();

  return (
    <Link
      href={`/${locale}`}                      
      prefetch={false}
      className="relative z-50 flex-shrink-0 inline-flex cursor-pointer transition-transform duration-300 pointer-events-auto"
      style={{ transform: `scale(var(--logo-scale, 1))` }}
      aria-label="Go to home"
      onClickCapture={(e) => {
        // 捕获阶段先执行，避免父级 onClick/onClickCapture 阻止事件
        try { resetFilters(); } catch {}
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation?.();
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
