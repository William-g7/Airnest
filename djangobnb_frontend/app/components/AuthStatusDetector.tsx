'use client'

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/stores/authStore';
import { useLoginModal } from './hooks/useLoginModal';
import toast from 'react-hot-toast';

/**
 * 认证状态检测器组件
 * 用于监测用户访问需要认证的页面，如果未登录则重定向
 */
export default function AuthStatusDetector() {
    const { isAuthenticated, loading, checkAuth } = useAuthStore();
    const router = useRouter();
    const loginModal = useLoginModal();

    // 检查当前页面是否为受保护路由
    const isProtectedRoute = useCallback(() => {
        const protectedPaths = [
            '/myproperties',
            '/myreservations',
            '/myprofile',
            '/mywishlists',
            '/inbox'
        ];

        // 服务器端不检查
        if (typeof window === 'undefined') return false;

        const currentPath = window.location.pathname;
        const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}(-[a-z]{2})?/, '');

        return protectedPaths.some(path =>
            currentPath.includes(path) || pathWithoutLocale.includes(path));
    }, []);

    // 检测和处理未认证访问受保护页面的情况
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleAuthCheck = async () => {
            // 仅在页面加载完成且当前页面是受保护路由时执行检查
            if (!loading && isProtectedRoute()) {
                await checkAuth();

                // 如果仍然未认证，则拦截并重定向
                if (!isAuthenticated) {
                    toast('Please log in to access this page', {
                        icon: '🔐',
                        duration: 3000
                    });

                    loginModal.onOpen();

                    router.push('/');
                }
            }
        };

        handleAuthCheck();

    }, [isAuthenticated, loading, isProtectedRoute, checkAuth, router, loginModal]);

    return null;
} 