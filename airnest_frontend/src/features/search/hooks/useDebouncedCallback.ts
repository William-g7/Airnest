'use client';

import {useRef, useEffect, useCallback} from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delay = 300) {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { fnRef.current = fn; }, [fn]);

  return useCallback((...args: Parameters<T>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]);
}
