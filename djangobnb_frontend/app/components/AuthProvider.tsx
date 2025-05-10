'use client'

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/app/stores/authStore';
import { useFavoritesStore } from '@/app/stores/favoritesStore';
import { usePathname } from 'next/navigation';
import { getAuthChannel } from '@/app/services/AuthChannel';

/**
 * AuthProvider - 中央认证管理组件
 * 
 * 负责:
 * 1. 初始化认证状态
 * 2. 监控路径变化
 * 3. 处理认证状态变化的副作用
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { checkAuth, isAuthenticated, userId, initializeListeners } = useAuthStore();
    const { initializeFavorites, clearFavorites } = useFavoritesStore();
    const lastPathnameRef = useRef<string | null>(null);
    const pathname = usePathname();
    const authChannel = getAuthChannel();

    // 初始化认证状态并设置跨页面通信
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 初始化认证频道和监听器
        authChannel.init();
        initializeListeners();

        // 初始检查认证状态
        checkAuth();

        // 组件卸载时清理资源
        return () => {
            authChannel.cleanup();
        };
    }, [checkAuth, initializeListeners]);

    // 处理路由变化时的认证检查
    useEffect(() => {
        if (pathname === lastPathnameRef.current) return;
        lastPathnameRef.current = pathname;
        checkAuth();
    }, [pathname, checkAuth]);

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