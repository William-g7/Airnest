'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/stores/authStore';
import { useLoginModal } from './hooks/useLoginModal';


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

  const isProtectedRoute = useCallback(() => {
    const protectedPaths = [
      '/myproperties',
      '/myreservations',
      '/myprofile',
      '/mywishlists',
      '/inbox',
    ];

    if (typeof window === 'undefined') return false;

    const currentPath = window.location.pathname;
    const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}(-[a-z]{2})?/, '');

    return protectedPaths.some(
      path => currentPath.includes(path) || pathWithoutLocale.includes(path)
    );
  }, []);

  // 安全的重定向函数 - 防止循环
  const safeRedirect = useCallback(() => {
    // 如果已经在重定向过程中，或者最后一次重定向在1秒内，则忽略
    const now = Date.now();
    if (redirectingRef.current || now - lastRedirectTimeRef.current < 1000) {
      console.log('Preventing duplicate redirect');
      return;
    }

    // 设置重定向标志
    redirectingRef.current = true;
    lastRedirectTimeRef.current = now;

    console.log('Unauthenticated user accessing protected page, redirecting to home page');

    loginModal.onOpen();

    // 使用setTimeout添加微小延迟，避免同步路由变化引起的连锁反应
    setTimeout(() => {
      router.push('/');
      // router.push是异步操作，在重定向完成后200ms重置标志
      setTimeout(() => {
        redirectingRef.current = false;
      }, 200);
    }, 50);
  }, [router, loginModal]);

  // 简单的路由保护逻辑

  // 路由保护 - 仅在初始加载和路径变化时执行
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;

    if (isProtectedRoute() && !isAuthenticated && !redirectingRef.current) {
      safeRedirect();
    }
  }, [loading, isProtectedRoute, safeRedirect]);

  return null;
}
