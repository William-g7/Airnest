'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { reportWebVitals } from '@/lib/vitals';

// 用于在App Router中监控Web Vitals指标的组件，通过GA4跟踪Web Vitals性能指标
export default function WebVitalsMonitor() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    reportWebVitals();
  }, [pathname, searchParams]);

  return null;
}
