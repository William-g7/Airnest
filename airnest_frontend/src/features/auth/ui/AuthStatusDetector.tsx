'use client';

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@auth/client/authStore';
import { useLoginModal } from '@auth/client/modalStore';

const PROTECTED_PREFIXES = [
  '/myproperties',
  '/myreservations',
  '/myprofile',
  '/mywishlists',
  '/inbox',
];

export default function AuthStatusDetector() {
  const { isAuthenticated, loading, listenersInitialized } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const loginModal = useLoginModal();

  const redirectingRef = useRef(false);
  const lastRedirectTimeRef = useRef(0);

  // 去除 locale 前缀：/en 或 /en-US
  const pathWithoutLocale = useMemo(() => {
    if (!pathname) return '/';
    return pathname.replace(/^\/[a-z]{2}(-[a-z]{2})?(?=\/|$)/i, '') || '/';
  }, [pathname]);

  // 当前路由是否受保护
  const isProtectedRoute = useMemo(() => {
    const cur = pathname || '';
    const noLocale = pathWithoutLocale;
    return PROTECTED_PREFIXES.some(p => cur.startsWith(p) || noLocale.startsWith(p));
  }, [pathname, pathWithoutLocale]);

  // 安全重定向（防抖/防重入）
  const safeRedirect = useCallback(() => {
    const now = Date.now();
    if (redirectingRef.current || now - lastRedirectTimeRef.current < 1000) return;
    redirectingRef.current = true;
    lastRedirectTimeRef.current = now;

    loginModal.open();

    setTimeout(() => {
      router.push('/');
      setTimeout(() => {
        redirectingRef.current = false;
      }, 200);
    }, 50);
  }, [router, loginModal]);

  useEffect(() => {
    // 等待 AuthProvider 完成初始化（listenersInitialized=true）且首次校验结束（loading=false）
    if (!listenersInitialized || loading) return;
    if (isProtectedRoute && !isAuthenticated && !redirectingRef.current) {
      safeRedirect();
    }
  }, [listenersInitialized, loading, isProtectedRoute, isAuthenticated, safeRedirect]);

  return null;
}
