'use client'

import { useEffect } from 'react';
import { useAuthStore } from '@/app/stores/authStore';
import { useFavoritesStore } from '@/app/stores/favoritesStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { checkAuth, isAuthenticated, userId } = useAuthStore();
    const { initializeFavorites, clearFavorites } = useFavoritesStore();

    // 应用加载时检查认证状态
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // 当认证状态变化时，处理收藏状态
    useEffect(() => {
        if (isAuthenticated && userId) {
            // 如果用户已登录，初始化收藏列表
            console.log('User authenticated, initializing favorites');
            initializeFavorites();
        } else if (!isAuthenticated) {
            // 如果用户退出登录，清除收藏状态，除但不会影响localStorage
            console.log('User not authenticated, clearing in-memory favorites');
            clearFavorites();
        }
    }, [isAuthenticated, userId, initializeFavorites, clearFavorites]);

    return <>{children}</>;
} 