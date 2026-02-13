'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFavoritesStore } from '@favorites/client/favoritesStore';
import { useAuth } from '@auth/hooks/useAuth';
import { useLoginModal } from '@auth/client/modalStore';
import FavoriteButton from '@favorites/ui/FavoriteButton';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

export function WishlistIsland({
  propertyId,
  className = '',
  initialIsFavorited = false,
}: {
  propertyId: string;
  className?: string;
  initialIsFavorited?: boolean;
}) {
  const t = useTranslations('favorites');
  const { isAuthenticated } = useAuth();
  const loginModal = useLoginModal();

  const initialized = useFavoritesStore((s) => s.initialized);
  const isLoading = useFavoritesStore((s) => s.isLoading);
  const initializeFavorites = useFavoritesStore((s) => s.initializeFavorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavFromStore = useFavoritesStore((s) => s.favorites.has(propertyId));

  // 首次未初始化则拉取（与全局 AuthProvider 并行调用也安全，store 内部有 initialized 守卫）
  useEffect(() => {
    if (!initialized && !isLoading) {
      initializeFavorites();
    }
  }, [initialized, isLoading, initializeFavorites]);

  // 水合前用 SSR 状态，水合后客户端 store 接管所有收藏状态管理
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []); //useEffect哨兵，标志水合完成

  const ready = hydrated && initialized;
  const isFavoritedForUI = ready ? isFavFromStore : initialIsFavorited;

  const onToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated) {
        loginModal.open();
        return;
      }
      try {
        const after = await toggleFavorite(propertyId);
        toast.success(after ? t('added') : t('removed'));
      } catch {
        toast.error(t('error'));
      }
    },
    [isAuthenticated, loginModal, toggleFavorite, propertyId, t]
  );

  return (
    <div className={className}>
      <FavoriteButton isFavorited={isFavoritedForUI} onToggle={onToggle} isInline />
    </div>
  );
}
