'use client';

import {useSearchParams, useRouter, usePathname} from 'next/navigation';
import {useMemo, useCallback, useTransition} from 'react';
import {parseQuery, buildQuery, SearchState} from '@search/utils/query';

export function useSearchQuery() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const state: SearchState = useMemo(() => parseQuery(sp), [sp]);

  const replaceUrl = useCallback((next: Partial<SearchState>, opts?: {debounce?: boolean}) => {
    const merged = {...state, ...next};
    const qs = buildQuery(merged).toString();
    const url = qs ? `${pathname}?${qs}` : pathname;

    startTransition(() => {
      router.replace(url, {scroll: false});
    });
  }, [router, pathname, state]);

  return {state, replaceUrl, isPending};
}
