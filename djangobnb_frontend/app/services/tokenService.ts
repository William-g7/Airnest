import { handleLogin, getRefreshToken } from '@/app/auth/session';

interface RefreshResponse {
  access: string;
  refresh?: string;
}

export const tokenService = {
  // 判断令牌是否快过期
  isTokenExpiringSoon: (token: string, bufferSeconds: number = 300): boolean => {
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      return expiry - now < bufferSeconds;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return false;
    }
  },

  // 刷新令牌
  refreshToken: async (): Promise<string | null> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = (await response.json()) as RefreshResponse;

      // 更新会话中的令牌
      // 注意：服务器会自动通过Set-Cookie更新令牌cookie
      // 这里只是更新本地状态
      if (data.access) {
        const payload = JSON.parse(atob(data.access.split('.')[1]));
        const userId = payload.user_id || payload.sub;

        if (userId) {
          if (data.refresh) {
            await handleLogin(userId, data.access, data.refresh);
          } else {
            await handleLogin(userId, data.access, (await getRefreshToken()) || '');
          }
        }

        return data.access;
      }
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  },
};
