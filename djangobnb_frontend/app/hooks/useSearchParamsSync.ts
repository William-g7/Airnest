import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useSearchStore } from '../stores/searchStore';

export function useSearchParamsSync() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { location, checkIn, checkOut, guests, category, setFilters } = useSearchStore();
    const initialSyncDone = useRef(false);

    // 从URL参数更新状态 - 优先级更高，确保页面加载时首先从URL读取
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

    // 从状态更新URL参数 - 只有在初始同步完成后才执行
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

        // 使用replace而不是push，避免创建新的历史记录条目
        router.replace(newUrl, { scroll: false });
    }, [location, checkIn, checkOut, guests, category, router, pathname, initialSyncDone]);
} 