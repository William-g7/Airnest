import { create } from 'zustand';
import { getUserId, getAccessToken } from '@/app/auth/session';
import { clientSessionService } from '../services/clientSessionService';

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
            let userId = await getUserId();
            if (!userId) {
                userId = clientSessionService.getUserId();
            }

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
        if (!userId) {
            return;
        }
        set({ userId, isAuthenticated: true, loading: false });

        try {
            localStorage.setItem('app_user_id', userId);
        } catch (e) {
            console.error("保存用户ID到本地存储失败", e);
        }
    },

    setUnauthenticated: () => {
        set({ userId: null, isAuthenticated: false, loading: false });
        try {
            localStorage.removeItem('app_user_id');
        } catch (e) {
            console.error("从本地存储清除用户ID失败", e);
        }
    }
})); 