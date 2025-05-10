'use client'

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/app/stores/authStore';
import { useFavoritesStore } from '@/app/stores/favoritesStore';
import { getAccessToken, getUserId } from '@/app/auth/session';
import { tokenService } from '@/app/services/tokenService';
import { usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { checkAuth, isAuthenticated, userId } = useAuthStore();
    const { initializeFavorites, clearFavorites } = useFavoritesStore();
    const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pathname = usePathname();

    // 应用加载和导航变化时检查认证状态
    useEffect(() => {
        const verifyAuth = async () => {
            // 直接检查Cookie中的用户ID，确保状态同步
            const cookieUserId = await getUserId();
            if (cookieUserId && !isAuthenticated) {
                console.log('Cookie中存在用户ID但状态未认证，重新同步状态');
                checkAuth();
            } else if (!cookieUserId && isAuthenticated) {
                console.log('Cookie中不存在用户ID但状态已认证，重置状态');
                checkAuth();
            }
        };

        checkAuth();
        verifyAuth();
    }, [checkAuth, pathname, isAuthenticated]);
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

    // 用户认证状态变更时同步收藏夹
    useEffect(() => {
        if (isAuthenticated && userId) {
            initializeFavorites();
        } else {
            clearFavorites();
        }
    }, [isAuthenticated, userId, initializeFavorites, clearFavorites]);

    return <>{children}</>;
} 