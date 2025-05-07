import { create } from 'zustand';
import { getUserId, getAccessToken } from '@/app/auth/session';

interface AuthState {
    userId: string | null;
    isAuthenticated: boolean;
    loading: boolean;

    checkAuth: () => Promise<void>;
    setAuthenticated: (userId: string) => void;
    setUnauthenticated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    userId: null,
    isAuthenticated: false,
    loading: true,

    checkAuth: async () => {
        set({ loading: true });
        try {
            const userId = await getUserId();
            if (userId) {
                set({ userId, isAuthenticated: true, loading: false });
            } else {
                set({ userId: null, isAuthenticated: false, loading: false });
            }
        } catch (error) {
            console.error('Auth check failed', error);
            set({ userId: null, isAuthenticated: false, loading: false });
        }
    },

    setAuthenticated: (userId: string) => {
        set({ userId, isAuthenticated: true, loading: false });
    },

    setUnauthenticated: () => {
        set({ userId: null, isAuthenticated: false, loading: false });
    }
})); 