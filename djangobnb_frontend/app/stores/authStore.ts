import { create } from 'zustand';
import { getUserId, getAccessToken } from '@/app/auth/session';
import { clientSessionService } from '../services/clientSessionService';
import { getAuthChannel, AuthEvent } from '../services/AuthChannel';
import { tokenService } from '@/app/services/tokenService';

/**
 * 认证状态接口
 * 定义全局认证状态和操作方法
 */
interface AuthState {
  userId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  tokenRefreshTimerId: number | null;

  // 核心方法
  checkAuth: () => Promise<boolean>;
  setAuthenticated: (userId: string) => void;
  setUnauthenticated: (reason?: string) => void;

  // 初始化监听器
  initializeListeners: () => void;

  // 令牌刷新管理
  startTokenRefresh: () => void;
  stopTokenRefresh: () => void;
}

// 获取 AuthChannel 单例
const authChannel = getAuthChannel();

// 确保 AuthChannel 在客户端环境中初始化
if (typeof window !== 'undefined') {
  authChannel.init();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  isAuthenticated: false,
  loading: true,
  tokenRefreshTimerId: null,

  // 初始化认证频道监听器
  initializeListeners: () => {
    if (typeof window === 'undefined') return;

    // 添加认证事件处理器
    authChannel.addMessageHandler((event: AuthEvent) => {
      const { type, isAuthenticated, userId } = event;

      console.log(`Received auth event: ${type}`, event);

      switch (type) {
        case 'AUTH_LOGIN':
          if (userId) {
            set({ userId, isAuthenticated: true, loading: false });
            get().startTokenRefresh();
          }
          break;

        case 'AUTH_LOGOUT':
        case 'AUTH_EXPIRED':
          set({ userId: null, isAuthenticated: false, loading: false });
          get().stopTokenRefresh();
          break;

        case 'AUTH_STATE_CHANGE':
          if (isAuthenticated && userId) {
            set({ userId, isAuthenticated: true, loading: false });
            get().startTokenRefresh();
          } else {
            set({ userId: null, isAuthenticated: false, loading: false });
            get().stopTokenRefresh();
          }
          break;

        default:
          break;
      }
    });
  },

  checkAuth: async () => {
    set({ loading: true });
    try {
      // 先尝试从cookie获取
      let userId = await getUserId();

      // 如果cookie没有，尝试从localStorage获取（备份机制）
      if (!userId) {
        userId = clientSessionService.getUserId();
      }

      const prevState = get().isAuthenticated;
      const newState = !!userId;

      // 更新状态： 如果用户ID之前不存在，现在为true, 则说明需要启动令牌刷新任务
      if (userId) {
        set({ userId, isAuthenticated: true, loading: false });
        // 确保令牌刷新任务在认证状态变为true时启动
        if (!prevState && newState) {
          get().startTokenRefresh();
        }
      } else {
        set({ userId: null, isAuthenticated: false, loading: false });
        // 确保令牌刷新任务在认证状态变为false时停止
        if (prevState && !newState) {
          get().stopTokenRefresh();
        }
      }

      // 如果状态发生变化，通过 AuthChannel 广播状态
      if (prevState !== newState) {
        authChannel.sendAuthStateChangeEvent(newState, userId, 'check_auth');
      }

      return newState;
    } catch (error) {
      console.error('Auth check failed', error);
      set({ userId: null, isAuthenticated: false, loading: false });
      get().stopTokenRefresh();

      authChannel.sendAuthStateChangeEvent(false, null, 'check_auth_error');
      return false;
    }
  },

  setAuthenticated: (userId: string) => {
    if (!userId) {
      return;
    }

    const prevState = get().isAuthenticated;
    set({ userId, isAuthenticated: true, loading: false });

    try {
      localStorage.setItem('app_user_id', userId);

      // 通过 AuthChannel 广播登录事件
      if (!prevState) {
        authChannel.sendLoginEvent(userId);
        get().startTokenRefresh();
      }
    } catch (e) {
      console.error('Failed to save user ID to local storage', e);
    }
  },

  setUnauthenticated: (reason = 'logout') => {
    const prevState = get().isAuthenticated;
    set({ userId: null, isAuthenticated: false, loading: false });

    try {
      localStorage.removeItem('app_user_id');
      // 如果原来是登录状态，那么可能是正常退出，也可能是token过期被动退出
      if (prevState) {
        if (reason === 'session_expired') {
          authChannel.sendSessionExpiredEvent();
        } else {
          authChannel.sendLogoutEvent(reason);
        }
        get().stopTokenRefresh();
      }
    } catch (e) {
      console.error('从本地存储清除用户ID失败', e);
    }
  },

  // 启动令牌刷新定时器
  startTokenRefresh: () => {
    get().stopTokenRefresh();

    if (typeof window === 'undefined') return;

    const checkAndRefreshToken = async () => {
      try {
        if (!get().isAuthenticated) return;

        const token = await getAccessToken();
        if (token && tokenService.isTokenExpiringSoon(token, 10 * 60)) {
          console.log('Token is expiring soon, attempting refresh');
          await tokenService.refreshToken();
        }
      } catch (error) {
        console.error('Token refresh error:', error);
      }
    };

    checkAndRefreshToken();

    // 设置定时检查，每5分钟检查一次
    const timerId = window.setInterval(checkAndRefreshToken, 5 * 60 * 1000);
    set({ tokenRefreshTimerId: timerId });

    console.log('Token auto-refresh has been started');
  },

  // 停止令牌刷新定时器
  stopTokenRefresh: () => {
    const { tokenRefreshTimerId } = get();
    if (tokenRefreshTimerId !== null && typeof window !== 'undefined') {
      window.clearInterval(tokenRefreshTimerId);
      set({ tokenRefreshTimerId: null });
      console.log('Token auto-refresh has been stopped');
    }
  },
}));
