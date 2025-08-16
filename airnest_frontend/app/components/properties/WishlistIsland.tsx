'use client';

import { useCallback } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useFavoritesStore } from '@/app/stores/favoritesStore';
import { useLoginModal } from '../hooks/useLoginModal';
import { useTranslations } from 'next-intl';
import { debounce } from '@/app/utils/debounce';
import toast from 'react-hot-toast';
import WishlistButton from './WishlistButton';

interface WishlistIslandProps {
  propertyId: string;
  className?: string;
}

export function WishlistIsland({ propertyId, className = "" }: WishlistIslandProps) {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const loginModal = useLoginModal();
  const tFavorites = useTranslations('favorites');

  const debouncedToggleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const handleToggle = debounce(async () => {
        if (!isAuthenticated) {
          loginModal.onOpen();
          return;
        }

        try {
          const wasInFavorites = isFavorite(propertyId);
          await toggleFavorite(propertyId);

          if (wasInFavorites) {
            toast.success(tFavorites('removed'));
          } else {
            toast.success(tFavorites('added'));
          }
        } catch (error: any) {
          if (error.message === 'No authentication token available') {
            loginModal.onOpen();
          } else {
            console.error('Error toggling wishlist:', error);
            toast.error(tFavorites('error'));
          }
        }
      }, 300);

      handleToggle();
    },
    [propertyId, isAuthenticated, loginModal, toggleFavorite, isFavorite, tFavorites]
  );

  return (
    <div 
      onClick={debouncedToggleWishlist} 
      className={className}
    >
      <WishlistButton
        isFavorited={isFavorite(propertyId)}
        onToggle={debouncedToggleWishlist}
        isInline={true}
      />
    </div>
  );
}