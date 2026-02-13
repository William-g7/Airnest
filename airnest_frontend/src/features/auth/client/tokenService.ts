// 面向认证的前端SDK
interface SessionResponse {
  valid: boolean;
  userId: string | null;
  accessExp: number | null;
  refreshExp: number | null;
  needsRefresh?: boolean;
  reason: string;
}

interface RefreshResponse {
  success: boolean;
  userId?: string;
  accessExp?: number;
  refreshExp?: number;
  error?: string;
}

// 向 BFF 的 /api/auth/session 发起 GET，拿到当前会话状态（是否有效、用户 ID、access/refresh 过期时间、是否建议刷新、无效原因等）。
export const tokenService = {
  checkSession: async (): Promise<SessionResponse> => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Session check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('BFF session check failed:', error);
      return {
        valid: false,
        userId: null,
        accessExp: null,
        refreshExp: null,
        reason: 'network_error'
      };
    }
  },

  refreshToken: async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Token refresh failed:', response.status);
        return false;
      }

      const result: RefreshResponse = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('BFF token refresh error:', error);
      return false;
    }
  },

  login: async (email: string, password: string, turnstileToken?: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          turnstile_token: turnstileToken,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      return result;
    } catch (error) {
      console.error('BFF login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Logout request failed:', response.status);
        // 即使服务端登出失败，客户端也应该清理状态
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('BFF logout error:', error);
      // 返回true确保客户端状态被清理
      return true;
    }
  },
};

// 业务接口的统一入口, 把业务地址统一重写到 BFF 代理 /api/backend/*
export const bffApiCall = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('/api/backend/') 
    ? endpoint 
    : `/api/backend${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response;
};