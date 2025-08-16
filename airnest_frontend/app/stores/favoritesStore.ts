import { create } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import apiService from '@/app/services/apiService';
import { PropertyType } from '../constants/propertyType';
import { getUserId } from '@/app/auth/session';

interface FavoritesState {
  favorites: Set<string>;
  initialized: boolean;
  isLoading: boolean;

  initializeFavorites: () => Promise<void>;
  toggleFavorite: (propertyId: string) => Promise<boolean>;
  isFavorite: (propertyId: string) => boolean;
  clearFavorites: () => void;
}

type PersistedState = {
  favorites: string[];
  initialized: boolean;
};

const serializeSet = (set: Set<string>) => Array.from(set);

const persistConfig: PersistOptions<FavoritesState, PersistedState> = {
  name: 'airnest-favorites',
  storage: createJSONStorage(() => localStorage),

  // 只持久化需要的状态
  partialize: state => ({
    favorites: serializeSet(state.favorites),
    initialized: state.initialized,
  }),

  // 状态恢复时的回调，未来可拓展
  onRehydrateStorage: () => state => {
    // 静默处理状态恢复
  },
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: new Set<string>(),
      initialized: false,
      isLoading: false,

      initializeFavorites: async () => {
        const { initialized } = get();
        if (initialized) return;

        // 检查用户是否已登录
        const userId = await getUserId();
        if (!userId) {
          set({ 
            favorites: new Set(), 
            initialized: true, 
            isLoading: false 
          });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await apiService.getwithtoken('/api/properties/wishlist/', { suppressToast: true });
          const favoriteIds = response.map((property: PropertyType) => property.id);
          set({
            favorites: new Set(favoriteIds),
            initialized: true,
          });
        } catch (error) {
          set({ 
            favorites: new Set(), 
            initialized: true 
          });
        } finally {
          set({ isLoading: false });
        }
      },

      toggleFavorite: async (propertyId: string) => {
        try {
          const response = await apiService.post(`/api/properties/${propertyId}/toggle-favorite/`, {
            propertyId,
          });

          if (response.status === 'added') {
            set(state => {
              const newFavorites = new Set(state.favorites);
              newFavorites.add(propertyId);
              return { favorites: newFavorites };
            });
            return true;
          } else if (response.status === 'removed') {
            set(state => {
              const newFavorites = new Set(state.favorites);
              newFavorites.delete(propertyId);
              return { favorites: newFavorites };
            });
            return false;
          }

          return get().isFavorite(propertyId);
        } catch (error) {
          console.error('Error toggling favorite status:', error);
          throw error;
        }
      },

      isFavorite: (propertyId: string) => {
        return get().favorites.has(propertyId);
      },

      clearFavorites: () => {
        set({ favorites: new Set(), initialized: false });
      },
    }),
    persistConfig
  )
);
