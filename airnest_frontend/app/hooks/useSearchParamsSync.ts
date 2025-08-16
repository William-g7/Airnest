import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';
import { useSearchStore } from '../stores/searchStore';

// 防抖函数
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 清理函数
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

export function useSearchParamsSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { location, checkIn, checkOut, guests, category, setFilters } = useSearchStore();
  const initialSyncDone = useRef(false);
  
  // 防抖URL更新函数
  const debouncedUpdateUrl = useDebounce((newUrl: string) => {
    router.replace(newUrl, { scroll: false });
  }, 500); // 500ms 防抖延迟

  // 从URL参数更新状态
  useEffect(() => {
    const locationParam = searchParams.get('location') || '';
    const checkInParam = searchParams.get('check_in') || null;
    const checkOutParam = searchParams.get('check_out') || null;
    const guestsParam = searchParams.get('guests');
    const categoryParam = searchParams.get('category') || '';

    if (locationParam || checkInParam || checkOutParam || guestsParam || categoryParam) {
      setFilters({
        location: locationParam,
        checkIn: checkInParam,
        checkOut: checkOutParam,
        guests: guestsParam ? parseInt(guestsParam) : 1,
        category: categoryParam,
      });
    }

    initialSyncDone.current = true;
  }, [searchParams, setFilters]);

  // 从状态更新URL参数（带防抖）
  useEffect(() => {
    if (!initialSyncDone.current) return;

    const params = new URLSearchParams();

    if (location) params.set('location', location);
    if (checkIn) params.set('check_in', checkIn);
    if (checkOut) params.set('check_out', checkOut);
    if (guests > 1) params.set('guests', guests.toString());
    if (category) params.set('category', category);

    const newQuery = params.toString();
    const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;

    // 使用防抖版本的URL更新
    debouncedUpdateUrl(newUrl);
  }, [location, checkIn, checkOut, guests, category, pathname, initialSyncDone, debouncedUpdateUrl]);
}
