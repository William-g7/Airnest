'use client';

import { handleLogin as serverHandleLogin } from '@/app/auth/session';
import { getAuthChannel } from './AuthChannel';
import { getNotificationService, NotificationType } from '@/app/services/notificationService';

const USER_ID_KEY = 'app_user_id';

// 获取通知服务单例
const notificationService = getNotificationService();

// 初始化认证通信频道
const authChannel = getAuthChannel();
if (typeof window !== 'undefined') {
  authChannel.init();

  // 设置认证事件监听
  authChannel.addMessageHandler(event => {
    if (event.type === 'AUTH_LOGOUT' && event.reason !== 'local_action') {
      notificationService.notifyLogoutAnotherTab();
    } else if (event.type === 'AUTH_EXPIRED') {
      notificationService.notifySessionExpired();
    }
  });
}

/**
 * 客户端会话服务
 * 提供会话管理功能，解决服务器组件与客户端组件间的状态同步问题
 */
export const clientSessionService = {
  // 处理用户登录，设置服务器端Cookie和本地存储
  handleLogin: async (userId: string, accessToken: string, refreshToken: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('客户端会话管理器 - 处理登录，用户ID:', userId);
      }

      await serverHandleLogin(userId, accessToken, refreshToken);

      // 设置本地存储
      localStorage.setItem(USER_ID_KEY, userId);

      // 通过AuthChannel广播登录事件
      authChannel.sendLoginEvent(userId);

      // 显示登录成功通知
      notificationService.notify(NotificationType.AUTH_LOGIN_SUCCESS);

      return true;
    } catch (error) {
      console.error('客户端会话登录处理失败:', error);

      // 显示登录失败通知
      notificationService.notify(NotificationType.AUTH_LOGIN_ERROR);

      return false;
    }
  },

  // 获取localstroage中的用户ID，作为服务器端Cookie的备份机制
  getUserId: () => {
    try {
      const userId = localStorage.getItem(USER_ID_KEY);
      // 只在开发环境中显示调试日志
      if (process.env.NODE_ENV === 'development') {
        console.log('客户端会话管理器 - 获取用户ID:', userId);
      }
      return userId;
    } catch (error) {
      console.error('获取本地存储用户ID失败:', error);
      return null;
    }
  },

  // 清除会话数据并广播登出事件
  clearSession: (reason = 'logout') => {
    try {
      localStorage.removeItem(USER_ID_KEY);

      // 通过AuthChannel广播登出事件，标记为本地操作
      authChannel.sendLogoutEvent(reason + '_local_action');

      // 显示登出成功通知
      if (reason === 'logout') {
        notificationService.notify(NotificationType.AUTH_LOGOUT_SUCCESS);
      }
    } catch (error) {
      console.error('清除本地会话失败:', error);
    }
  },

  // 通知会话过期
  notifySessionExpired: () => {
    try {
      localStorage.removeItem(USER_ID_KEY);

      // 通过AuthChannel广播会话过期事件
      authChannel.sendSessionExpiredEvent();

      // 显示会话过期通知
      notificationService.notifySessionExpired();
    } catch (error) {
      console.error('清除过期会话失败:', error);
    }
  },

  // 显示认证需要通知
  notifyAuthRequired: (message?: string) => {
    notificationService.notifyAuthRequired(message);
  },
};
