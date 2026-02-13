// 跨标签页的认证状态广播总线
// 把某个标签页发生的认证事件，可靠地通知到其他标签页，同时避免回声、重复和风暴
export type AuthEventType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_EXPIRED'
  | 'AUTH_REFRESH'
  | 'AUTH_STATE_CHANGE'
  | 'TOKEN_REFRESHED'
  | 'REQUEST_AUTH_SYNC';

export interface AuthEvent {
  type: AuthEventType;
  timestamp: number;
  originTabId: string; // 回声：本页发出去的消息，本页不再处理
  eventId: string; // 去重：同一个 eventId 只处理一次，防止重复初始化/多重路径导致的二次分发
  isAuthenticated?: boolean;
  userId?: string | null;
  reason?: string;
}

export type AuthMessageHandler = (event: AuthEvent) => void;

// 唯一标签生成
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
const genEventId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export class AuthChannel {
  private static instance: AuthChannel | null = null;
  private channel: BroadcastChannel | null = null;
  private useLocalStorage = false;
  private handlers: Set<AuthMessageHandler> = new Set();
  private readonly channelName = 'auth_sync_channel';
  private readonly storageKey = 'auth_last_event';
  private boundStorageHandler: ((e: StorageEvent) => void) | null = null;
  private seen = new Set<string>();
  private readonly seenMax = 200;

  private constructor() {}

  public static getInstance(): AuthChannel {
    if (!AuthChannel.instance) {
      AuthChannel.instance = new AuthChannel();
    }
    return AuthChannel.instance;
  }

  // 初始化，首选BroadcastChannel('auth_sync_channel')，不支持的时候降级localStorage + storage 事件
  public init(): boolean {
    if (this.channel || this.useLocalStorage) return true;
    if (typeof window === 'undefined') return false;

    if ('BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = this.handleBroadcastMessage;
        return true;
      } catch (err) {
        console.warn('AuthChannel: BroadcastChannel init failed, fallback to localStorage', err);
        this.channel = null;
      }
    }

    // 降级到 localStorage
    this.useLocalStorage = true;
    this.boundStorageHandler = this.handleStorageEvent.bind(this);
    window.addEventListener('storage', this.boundStorageHandler);
    return true;
  }

  // 发送事件
  // 组装事件，补充每个事件的特性
  private buildEvent(partial: Omit<AuthEvent, 'timestamp' | 'originTabId' | 'eventId'>): AuthEvent {
    return {
      ...partial,
      timestamp: Date.now(),
      originTabId: TAB_ID,
      eventId: genEventId(),
    };
  }

  public postMessage(event: Omit<AuthEvent, 'timestamp' | 'originTabId' | 'eventId'> & { type: AuthEventType }): void {
    if (!this.isInitialized()) return;
    const message = this.buildEvent(event);

    if (this.channel) {
      this.channel.postMessage(message);
    } else if (this.useLocalStorage) {
      try {
        // setItem 会在“其他标签页”触发 storage 事件；本页不会触发，天然无回声
        localStorage.setItem(this.storageKey, JSON.stringify(message));
      } catch (e) {
        console.error('AuthChannel: localStorage postMessage failed', e);
      }
    }
  }

  // 订阅
  // 把业务层的回调函数加入本地 handlers 集合，并返回取消订阅函数
  public addMessageHandler(handler: AuthMessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  public removeMessageHandler(handler: AuthMessageHandler): void {
    this.handlers.delete(handler);
  }

  // 输入
  // 把来自底层（BC 或 storage 事件）的原始消息转换为统一事件对象，交给分发层
  private handleBroadcastMessage = (message: MessageEvent) => {
    const event = message.data as AuthEvent;
    this.notifyHandlers(event);
  };

  private handleStorageEvent(e: StorageEvent): void {
    if (e.key !== this.storageKey || !e.newValue) return;
    try {
      const event = JSON.parse(e.newValue) as AuthEvent;
      this.notifyHandlers(event);
    } catch (err) {
      console.error('AuthChannel: storage event parse error', err);
    }
  }

  // 分发
  // 回声隔离：如果 originTabId 等于本页的 TAB_ID，直接忽略。
  // 去重：用 seen 集合记录 eventId，处理过就不再处理。
  // 安全调用所有订阅者（try/catch 包裹，单个失败不影响其他）。
  private notifyHandlers(event: AuthEvent): void {
    if (event.originTabId === TAB_ID) return;
    if (this.seen.has(event.eventId)) return;
    this.seen.add(event.eventId);
    while (this.seen.size > this.seenMax) { //后期可以考虑升级成lru?
      const oldest = this.seen.values().next().value;
      if(oldest === undefined) break;
      this.seen.delete(oldest);
    }

    this.handlers.forEach(handler => {
      try { 
        handler(event); 
      } catch (err) { 
        console.error('AuthChannel handler error', err); 
      }
    });
  }

  // 辅助函数
  private isInitialized(): boolean {
    return !!(this.channel || this.useLocalStorage);
  }

  public cleanup(): void {
    if (this.channel) {
      this.channel.onmessage = null;
      this.channel.close();
      this.channel = null;
    }
    if (this.useLocalStorage && this.boundStorageHandler) {
      window.removeEventListener('storage', this.boundStorageHandler);
      this.boundStorageHandler = null;
      this.useLocalStorage = false;
    }
    this.handlers.clear();
    this.seen.clear();
  }

  // 语义化事件
  public sendLoginEvent(userId: string): void {
    this.postMessage({ type: 'AUTH_LOGIN', isAuthenticated: true, userId, reason: 'login' });
  }
  public sendLogoutEvent(reason = 'logout'): void {
    this.postMessage({ type: 'AUTH_LOGOUT', isAuthenticated: false, userId: null, reason });
  }
  public sendSessionExpiredEvent(): void {
    this.postMessage({ type: 'AUTH_EXPIRED', isAuthenticated: false, userId: null, reason: 'session_expired' });
  }
  public sendAuthStateChangeEvent(isAuthenticated: boolean, userId: string | null, reason?: string): void {
    this.postMessage({ type: 'AUTH_STATE_CHANGE', isAuthenticated, userId, reason });
  }
  public sendTokenRefreshedEvent(userId: string | null): void {
    this.postMessage({ type: 'TOKEN_REFRESHED', isAuthenticated: true, userId, reason: 'token_refreshed' });
  }
  public requestAuthSync(): void {
    this.postMessage({ type: 'REQUEST_AUTH_SYNC', reason: 'sync_request' });
  }
}

export const getAuthChannel = (): AuthChannel => AuthChannel.getInstance();
