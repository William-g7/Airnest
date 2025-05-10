'use client'

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/stores/authStore';
import { useLoginModal } from './hooks/useLoginModal';
import { getNotificationService, NotificationType } from '@/app/services/NotificationService';

/**
 * 使用全局变量进行toast防抖
 * 与clientSessionService共享的全局变量
 */
declare global {
    var lastToastTime: number;
}

// 确保全局变量存在
if (typeof window !== 'undefined' && globalThis.lastToastTime === undefined) {
    globalThis.lastToastTime = 0;
}

const TOAST_COOLDOWN = 2000;

/**
 * 认证状态检测器组件
 * 用于监测用户访问需要认证的页面，如果未登录则重定向
 */
export default function AuthStatusDetector() {
    const { isAuthenticated, loading } = useAuthStore();
    const router = useRouter();
    const loginModal = useLoginModal();
    const redirectingRef = useRef(false);
    const lastRedirectTimeRef = useRef(0);
    const wasAuthenticatedRef = useRef(isAuthenticated);

    // 获取通知服务单例
    const notificationService = getNotificationService();

    const isProtectedRoute = useCallback(() => {
        const protectedPaths = [
            '/myproperties',
            '/myreservations',
            '/myprofile',
            '/mywishlists',
            '/inbox'
        ];

        if (typeof window === 'undefined') return false;

        const currentPath = window.location.pathname;
        const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}(-[a-z]{2})?/, '');

        return protectedPaths.some(path =>
            currentPath.includes(path) || pathWithoutLocale.includes(path));
    }, []);

    // 安全的重定向函数 - 防止循环
    const safeRedirect = useCallback((reason: 'session_expired' | 'access_denied') => {
        // 如果已经在重定向过程中，或者最后一次重定向在1秒内，则忽略
        const now = Date.now();
        if (redirectingRef.current || (now - lastRedirectTimeRef.current < 1000)) {
            console.log('Preventing duplicate redirect');
            return;
        }

        // 设置重定向标志
        redirectingRef.current = true;
        lastRedirectTimeRef.current = now;

        console.log(`Unauthenticated user accessing protected page, reason: ${reason}, executing safe redirect to home page`);

        // 根据原因显示不同的消息
        if (reason === 'session_expired') {
            notificationService.notifySessionExpired();
        } else {
            notificationService.notifyAuthRequired();
        }

        loginModal.onOpen();

        // 使用setTimeout添加微小延迟，避免同步路由变化引起的连锁反应
        setTimeout(() => {
            router.push('/');
            // router.push是异步操作，在重定向完成后200ms重置标志
            setTimeout(() => {
                redirectingRef.current = false;
            }, 200);
        }, 50);
    }, [router, loginModal, notificationService]);

    // 如果用户从登录状态变成未登录状态，可能是因为session过期
    // 如果用户此时在访问受限页面，则应当重定向
    useEffect(() => {
        // 只在状态从"已认证"变为"未认证"时执行
        if (wasAuthenticatedRef.current && !isAuthenticated && !loading) {
            console.log('Detecting session expired');

            if (isProtectedRoute()) {
                safeRedirect('session_expired');
            }
        }

        wasAuthenticatedRef.current = isAuthenticated;
    }, [isAuthenticated, loading, isProtectedRoute, safeRedirect]);

    // 路由保护 - 仅在初始加载和路径变化时执行，不监听认证状态变化
    useEffect(() => {
        if (typeof window === 'undefined' || loading) return;

        if (isProtectedRoute() && !isAuthenticated && !redirectingRef.current) {
            safeRedirect('access_denied');
        }
    }, [loading, isProtectedRoute, safeRedirect]);

    return null;
} 