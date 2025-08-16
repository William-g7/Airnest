/**
 * 认证系统跨标签页通信服务
 * 基于BroadcastChannel API实现跨标签页通信，同时提供降级方案
 */

export type AuthEventType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_EXPIRED'
  | 'AUTH_REFRESH'
  | 'AUTH_STATE_CHANGE';

export interface AuthEvent {
  type: AuthEventType;
  isAuthenticated?: boolean;
  userId?: string | null;
  reason?: string;
  timestamp: number;
  [key: string]: any;
}

export type AuthMessageHandler = (event: AuthEvent) => void;

/**
 * 认证通信频道类
 * 用于处理跨标签页的认证状态同步
 */
export class AuthChannel {
  private static instance: AuthChannel | null = null;
  private channel: BroadcastChannel | null = null;
  private useLocalStorage = false;
  private handlers: Set<AuthMessageHandler> = new Set();
  private readonly channelName = 'auth_sync_channel';
  private readonly storageKey = 'auth_last_event';

  // 单例模式构造函数
  private constructor() {}

  // 获取单例实例
  public static getInstance(): AuthChannel {
    if (!AuthChannel.instance) {
      AuthChannel.instance = new AuthChannel();
    }
    return AuthChannel.instance;
  }

  public init(): boolean {
    if (this.channel) return true;

    if (typeof window === 'undefined') {
      console.warn('AuthChannel: Cannot use AuthChannel in server environment');
      return false;
    }

    if ('BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = this.handleBroadcastMessage.bind(this);
        return true;
      } catch (error) {
        console.warn('AuthChannel: Failed to initialize BroadcastChannel', error);
        this.channel = null;
      }
    }

    // 降级到localStorage方案
    this.useLocalStorage = true;
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
    console.log('AuthChannel: Using localStorage fallback mechanism for cross-tab communication');
    return true;
  }

  // 发送认证事件消息
  public postMessage(event: Omit<AuthEvent, 'timestamp'> & { type: AuthEventType }): void {
    if (!this.isInitialized()) {
      console.warn('AuthChannel: Attempting to send message on uninitialized channel');
      return;
    }

    if (!event.type) {
      console.error('AuthChannel: Event missing required type property');
      return;
    }

    const fullEvent: AuthEvent = {
      ...event,
      timestamp: Date.now(),
    };

    if (this.channel) {
      this.channel.postMessage(fullEvent);
    }
    // 通过localStorage降级方案发送
    else if (this.useLocalStorage) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(fullEvent));
      } catch (error) {
        console.error('AuthChannel: Failed to store in localStorage', error);
      }
    }
  }

  // 添加消息处理函数
  public addMessageHandler(handler: AuthMessageHandler): void {
    this.handlers.add(handler);
  }

  // 移除消息处理函数
  public removeMessageHandler(handler: AuthMessageHandler): void {
    this.handlers.delete(handler);
  }

  // 处理从BroadcastChannel接收的消息
  private handleBroadcastMessage(message: MessageEvent): void {
    const event = message.data as AuthEvent;
    this.notifyHandlers(event);
  }

  // 通知所有处理函数
  private notifyHandlers(event: AuthEvent): void {
    this.handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('AuthChannel: handler execution error', error);
      }
    });
  }

  // 处理localStorage变更事件（降级方案）
  private handleStorageEvent(e: StorageEvent): void {
    if (e.key !== this.storageKey || !e.newValue) return;

    try {
      const event = JSON.parse(e.newValue) as AuthEvent;
      this.notifyHandlers(event);
    } catch (error) {
      console.error('AuthChannel: Failed to parse storage event', error);
    }
  }

  // 检查是否已初始化
  private isInitialized(): boolean {
    return !!(this.channel || this.useLocalStorage);
  }

  // 清理资源
  public cleanup(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    if (this.useLocalStorage) {
      window.removeEventListener('storage', this.handleStorageEvent.bind(this));
      this.useLocalStorage = false;
    }

    this.handlers.clear();
  }

  // 发送登录事件
  public sendLoginEvent(userId: string): void {
    this.postMessage({
      type: 'AUTH_LOGIN',
      isAuthenticated: true,
      userId,
      reason: 'login',
    });
  }

  // 发送登出事件
  public sendLogoutEvent(reason = 'logout'): void {
    this.postMessage({
      type: 'AUTH_LOGOUT',
      isAuthenticated: false,
      userId: null,
      reason,
    });
  }

  // 发送会话过期事件
  public sendSessionExpiredEvent(): void {
    this.postMessage({
      type: 'AUTH_EXPIRED',
      isAuthenticated: false,
      userId: null,
      reason: 'session_expired',
    });
  }

  // 发送完整的认证状态变化事件
  public sendAuthStateChangeEvent(
    isAuthenticated: boolean,
    userId: string | null,
    reason?: string
  ): void {
    this.postMessage({
      type: 'AUTH_STATE_CHANGE',
      isAuthenticated,
      userId,
      reason,
    });
  }
}

export const getAuthChannel = (): AuthChannel => AuthChannel.getInstance();
