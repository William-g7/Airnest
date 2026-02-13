'use client';

import { create } from 'zustand';
import { getAuthChannel, AuthEvent } from './authChannel';
import { tokenService } from '@auth/client/tokenService';

// 前端的状态管理中心
// 负责检查会话、决定是否刷新、安排刷新定时器、在标签页唤醒/联网时自检、把状态变化广播出去
interface AuthState {
  userId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  tokenRefreshTimerId: number | null;
  refreshInFlight: Promise<boolean> | null; 

  // 核心方法
  checkAuth: () => Promise<boolean>;
  setAuthenticated: (userId: string) => void;
  setUnauthenticated: (reason?: string) => void;

  // 跨标签页通信
  initializeListeners: () => void;
  listenersInitialized: boolean;

  // Token刷新管理
  startTokenRefresh: () => void;
  stopTokenRefresh: () => void;
  refreshTokenIfNeeded: () => Promise<boolean>;
}

const authChannel = getAuthChannel();
if (typeof window !== 'undefined') {
  authChannel.init();
}

// 选主锁，避免多个标签页避免并发刷新
const REFRESH_LOCK_KEY = 'refresh_lock';
const REFRESH_LOCK_TTL_MS = 15_000;
const WAIT_PEER_REFRESH_MS = 3000;

// 每个标签页的唯一ID
const TAB_ID = (() => {
  if (typeof window === 'undefined') return 'server';
  const key = 'tab_id';
  let value = sessionStorage.getItem(key);
  if (!value) { 
    value = Math.random().toString(36).slice(2); 
    sessionStorage.setItem(key, value); 
  }
  return value;
})();

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  isAuthenticated: false,
  loading: true,
  tokenRefreshTimerId: null,
  refreshInFlight: null,
  listenersInitialized: false,

  initializeListeners: () => {
    if (typeof window === 'undefined') return;
    if (get().listenersInitialized) return;
    set({ listenersInitialized: true });
  
    // 跨页消息
    authChannel.addMessageHandler((event: AuthEvent) => {
      const { type, isAuthenticated, userId } = event;
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
        case 'TOKEN_REFRESHED':
          // 其他标签页已刷新：当前页无需动作，但可以立刻校准下一次定时
          if (get().isAuthenticated) {
            get().startTokenRefresh(); // 重新基于新的 exp 安排下一次
          }
          break;
        case 'REQUEST_AUTH_SYNC':
          get().checkAuth();
          break;
        default:
          break;
      }
    });
  
    // 前台/联网唤醒：立即自检 + 需要则刷新
    const onWake = () => {
      get().checkAuth()
        .then(valid => { 
          if (valid) get().refreshTokenIfNeeded(); 
      });
    };

    window.addEventListener('focus', onWake);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onWake();
    });
    window.addEventListener('online', onWake);
  },

  // 使用bff的/api/auth/session作为权威状态源
  checkAuth: async () => {
    set({ loading: true });
    try {
      const sessionData = await tokenService.checkSession();
      const prevState = get().isAuthenticated;
      const newState = sessionData.valid;
      const userId = sessionData.userId;

      // 更新本地状态
      if (sessionData.valid && userId) {
        set({ userId, isAuthenticated: true, loading: false });
        
        // 如果状态从未认证变为已认证，启动Token刷新
        if (!prevState && newState) {
          get().startTokenRefresh();
        }
      } else {
        set({ userId: null, isAuthenticated: false, loading: false });
        
        // 如果状态从已认证变为未认证，停止Token刷新
        if (prevState && !newState) {
          get().stopTokenRefresh();
        }
      }

      // 状态变化时广播事件
      if (prevState !== newState) {
        authChannel.sendAuthStateChangeEvent(newState, userId, 'bff_check_auth');
      }

      return newState;
    } catch (error) {
      console.error('BFF auth check failed:', error);
      set({ userId: null, isAuthenticated: false, loading: false });
      get().stopTokenRefresh();

      authChannel.sendAuthStateChangeEvent(false, null, 'bff_check_auth_error');
      return false;
    }
  },

  // 设置已登录状态, 在登录成功后调用
  setAuthenticated: (userId: string) => {
    if (!userId) {
      return;
    }

    const prevState = get().isAuthenticated;
    set({ userId, isAuthenticated: true, loading: false });

    if (!prevState) {
      authChannel.sendLoginEvent(userId);
      get().startTokenRefresh();
    }
  },

  // 设置未登录状态
  setUnauthenticated: (reason = 'logout') => {
    const prevState = get().isAuthenticated;
    set({ userId: null, isAuthenticated: false, loading: false });

    // 广播事件和停止Token刷新
    if (prevState) {
      if (reason === 'session_expired') {
        authChannel.sendSessionExpiredEvent();
      } else {
        authChannel.sendLogoutEvent(reason);
      }
      get().stopTokenRefresh();
    }
  },

  // Single-flight Token刷新机制
  // 当多个标签页都发现需要刷新 token 时，只让一个标签页去刷，其他标签页等待刷新结果，避免并发狂刷
  refreshTokenIfNeeded: async () => {
    if (typeof window === 'undefined') return true; 
    // single-flight（单标签页内）
    const { refreshInFlight } = get();
    if (refreshInFlight) return refreshInFlight; // 直接复用同一个 Promise,避免一个页面跑多个刷新promise
  
    let sessionData = await tokenService.checkSession();
    if (!sessionData.valid) {
      get().setUnauthenticated('session_expired');
      return false;
    }
    if (!sessionData.needsRefresh) return true;
  
    // 选主锁（跨标签页）
    const now = Date.now();
    const raw = localStorage.getItem(REFRESH_LOCK_KEY);
    try {
      const holder = raw ? JSON.parse(raw) as { tabId: string; expiresAt: number } : null; // 拿到持有锁的页面
      const lockAlive = holder && holder.expiresAt > now; // 如果锁还有效
      if (lockAlive && holder!.tabId !== TAB_ID) {
        // 那么持有锁的标签页负责刷新：等待最多 3s，看是否完成
        return await new Promise<boolean>((resolve) => {
          let done = false;
          const timerId = setTimeout(() => {
            if (!done) {
              done = true;
              off?.(); // 解绑事件监听，避免内存泄漏                
              resolve(true); // 乐观更新，之后会通过定时/前台唤醒再次校准
            }
          }, WAIT_PEER_REFRESH_MS);
        
          const off = authChannel.addMessageHandler?.((event: AuthEvent) => {
            if (event.type === 'TOKEN_REFRESHED') {
              if (done) return;
              done = true;
              clearTimeout(timerId);
              off?.();                 
              get().checkAuth().then(() => resolve(true));
            }
          });
        });
      }
      // 否则，当前页抢锁
      localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({ tabId: TAB_ID, expiresAt: now + REFRESH_LOCK_TTL_MS })); // 设置REFRESH_LOCK_TTL_MS防止死锁
    } catch {
    }
  
    // 开始刷新
    const refreshPromise = (async () => {
      try {
        const ok = await tokenService.refreshToken();
        // 如果本页是主锁持有者，就释放锁
        try {
          const cur = localStorage.getItem(REFRESH_LOCK_KEY);
          const isLord = cur ? JSON.parse(cur) : null;
          if (isLord?.tabId === TAB_ID) localStorage.removeItem(REFRESH_LOCK_KEY);
        } catch {}
  
        if (!ok) {
          get().setUnauthenticated('refresh_failed');
          return false;
        }
        // 广播“已刷新” 
        authChannel.sendTokenRefreshedEvent(get().userId);
        // 刷新后再校准一次状态
        sessionData = await tokenService.checkSession();
        if (!sessionData.valid) {
          get().setUnauthenticated('session_invalid_after_refresh');
          return false;
        }
        return true;
      } catch (e) {
        try {
          const cur = localStorage.getItem(REFRESH_LOCK_KEY);
          const isLord = cur ? JSON.parse(cur) : null;
          if (isLord?.tabId === TAB_ID) localStorage.removeItem(REFRESH_LOCK_KEY);
        } catch {}
        get().setUnauthenticated('refresh_error');
        return false;
      }
    })(); // iife, 单页 single-flight机制，避免在同一页面内多次触发刷新请求
  
    set({ refreshInFlight: refreshPromise }); 
    const result = await refreshPromise;
    set({ refreshInFlight: null }); // 拿到结果后就把refreshInFlight设置为null
    return result;
  },

  // 启动Token刷新定时器
  startTokenRefresh: () => {
    get().stopTokenRefresh(); // 避免重复定时器
    if (typeof window === 'undefined') return;
  
    const scheduleNext = async () => {
      const session = await tokenService.checkSession();
      if (!session.valid) {
        get().setUnauthenticated('session_invalid');
        return;
      }
      // 先根据需要刷新一次
      if (session.needsRefresh) {
        const ok = await get().refreshTokenIfNeeded();
        if (!ok) return; // 刷新失败已在内部处理退出
      }
      // 计算下一次触发时间点：exp - 10min，至少 15s 后
      const nowSec = Math.floor(Date.now() / 1000);
      const targetSec = Math.max(nowSec + 15, (session.accessExp ?? nowSec) - 10 * 60);
      const delayMs = Math.max(15_000, (targetSec - nowSec) * 1000);
  
      const id = window.setTimeout(async () => {
        if (!get().isAuthenticated) return;
        await get().refreshTokenIfNeeded();
        scheduleNext(); // 递归安排下一次
      }, delayMs);
  
      set({ tokenRefreshTimerId: id });
    };
  
    // 启动一次调度
    scheduleNext();
    // 当页面聚焦/联网，会立刻在initializeListeners触发即时自检，不用死等定时器
  },

  // 停止Token刷新定时器
  stopTokenRefresh: () => {
    const { tokenRefreshTimerId } = get();
    if (tokenRefreshTimerId !== null && typeof window !== 'undefined') {
      window.clearTimeout(tokenRefreshTimerId);
      set({ tokenRefreshTimerId: null, refreshInFlight: null });
    }
  },
}));
