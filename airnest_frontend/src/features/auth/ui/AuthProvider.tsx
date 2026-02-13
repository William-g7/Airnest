'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@auth/client/authStore';
import { useFavoritesStore } from '@favorites/client/favoritesStore';
import { getAuthChannel } from '@auth/client/authChannel';

/**
 * AuthProvider - 全局唯一的认证初始化点
 * 1) 初始化跨标签页通道 + 注册监听
 * 2) 首次 checkAuth()
 * 3) 订阅认证状态变化以同步收藏夹
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const init = useAuthStore(s => s.initializeListeners);
  const check = useAuthStore(s => s.checkAuth);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const userId = useAuthStore(s => s.userId);

  const { initializeFavorites, clearFavorites } = useFavoritesStore();

  // 只在首次挂载时做初始化与首检
  useEffect(() => {
    const channel = getAuthChannel();
    channel.init();
    init();
    check();
    return () => channel.cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 认证状态变化 → 同步收藏夹
  useEffect(() => {
    if (isAuthenticated && userId) {
      initializeFavorites();
    } else {
      clearFavorites();
    }
  }, [isAuthenticated, userId, initializeFavorites, clearFavorites]);

  return <>{children}</>;
}
