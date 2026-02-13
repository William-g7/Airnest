import { create } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import { favoritesClientApi } from '../services/clientApi';
import type { PropertyType } from '@properties/types/Property';
import { tokenService } from '@auth/client/tokenService';

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

  partialize: state => ({
    favorites: serializeSet(state.favorites),
    initialized: state.initialized,
  }),

  merge: (persisted, current) => { // zustand的rehydrate, 把 localStorage 里的数据回填进 store
    const p = persisted as unknown as PersistedState;
    return {
      ...current,
      ...p,
      favorites: new Set(p?.favorites ?? []),
    };
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

        const session = await tokenService.checkSession();
        if (!session.valid || !session.userId) {
          set({ 
            favorites: new Set(), 
            initialized: true, 
            isLoading: false 
          });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await favoritesClientApi.list();
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
          const response = await favoritesClientApi.toggle(propertyId);
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
