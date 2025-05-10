'use client'

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/app/stores/authStore';
import { useFavoritesStore } from '@/app/stores/favoritesStore';
import { getAccessToken, getUserId } from '@/app/auth/session';
import { tokenService } from '@/app/services/tokenService';
import { usePathname } from 'next/navigation';
import { clientSessionService } from '@/app/services/clientSessionService';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { checkAuth, isAuthenticated, userId } = useAuthStore();
    const { initializeFavorites, clearFavorites } = useFavoritesStore();
    const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const authCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pathname = usePathname();

    const verifyAuth = useCallback(async () => {
        const cookieUserId = await getUserId();
        if (cookieUserId && !isAuthenticated) {
            console.log('Cookie中存在用户ID但状态未认证，重新同步状态');
            checkAuth();
        } else if (!cookieUserId && isAuthenticated) {
            console.log('Cookie中不存在用户ID但状态已认证，重置状态');
            checkAuth();
        }
    }, [checkAuth, isAuthenticated]);

    // 应用加载和导航变化时检查认证状态
    useEffect(() => {
        checkAuth();
        verifyAuth();
    }, [checkAuth, pathname, verifyAuth]);

    // 跨标签页状态同步
    useEffect(() => {
        if (typeof window !== 'undefined') {
            clientSessionService.setupStorageListener();
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('storage', clientSessionService._handleStorageChange);
            }
        };
    }, []);

    // 定期检查认证状态
    useEffect(() => {
        if (authCheckTimerRef.current) {
            clearInterval(authCheckTimerRef.current);
        }

        authCheckTimerRef.current = setInterval(() => {
            if (document.visibilityState === 'visible') {
                console.log('定期检查认证状态');
                verifyAuth();
            }
        }, 30000);

        return () => {
            if (authCheckTimerRef.current) {
                clearInterval(authCheckTimerRef.current);
                authCheckTimerRef.current = null;
            }
        };
    }, [verifyAuth]);

    // 监听用户活动和页面可见性变化
    useEffect(() => {
        const checkOnUserActivity = () => {
            verifyAuth();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                verifyAuth();
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('click', checkOnUserActivity, { passive: true });
            window.addEventListener('focus', checkOnUserActivity);
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('click', checkOnUserActivity);
                window.removeEventListener('focus', checkOnUserActivity);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        };
    }, [verifyAuth]);

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