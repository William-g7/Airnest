'use client'

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/app/stores/authStore';
import { useFavoritesStore } from '@/app/stores/favoritesStore';
import { getAccessToken } from '@/app/auth/session';
import { tokenService } from '@/app/services/tokenService';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { checkAuth, isAuthenticated, userId } = useAuthStore();
    const { initializeFavorites, clearFavorites } = useFavoritesStore();
    const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 应用加载时检查认证状态
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // 管理令牌自动刷新
    useEffect(() => {
        if (tokenRefreshTimerRef.current) {
            clearInterval(tokenRefreshTimerRef.current);
            tokenRefreshTimerRef.current = null;
        }

        if (isAuthenticated) {
            const checkAndRefreshToken = async () => {
                try {
                    const token = await getAccessToken();
                    if (token) {
                        if (tokenService.isTokenExpiringSoon(token, 10 * 60)) {
                            await tokenService.refreshToken();
                        }
                    }
                } catch (error) {
                    console.error('Token refresh error:', error);
                }
            };

            checkAndRefreshToken();

            tokenRefreshTimerRef.current = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

            return () => {
                if (tokenRefreshTimerRef.current) {
                    clearInterval(tokenRefreshTimerRef.current);
                    tokenRefreshTimerRef.current = null;
                }
            };
        }
    }, [isAuthenticated]);

    // 当认证状态变化时，处理收藏状态
    useEffect(() => {
        if (isAuthenticated && userId) {
            initializeFavorites();
        } else if (!isAuthenticated) {
            clearFavorites();
        }
    }, [isAuthenticated, userId, initializeFavorites, clearFavorites]);

    return <>{children}</>;
} 