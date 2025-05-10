'use client'

import { handleLogin as serverHandleLogin } from "@/app/auth/session";

const USER_ID_KEY = 'app_user_id';

/**
 * 客户端会话服务
 * 提供会话管理功能，解决服务器组件与客户端组件间的状态同步问题
 */
export const clientSessionService = {
    // 处理用户登录，设置服务器端Cookie和本地存储
    handleLogin: async (userId: string, accessToken: string, refreshToken: string) => {
        try {
            await serverHandleLogin(userId, accessToken, refreshToken);

            localStorage.setItem(USER_ID_KEY, userId);

            return true;
        } catch (error) {
            console.error("客户端会话登录处理失败:", error);
            return false;
        }
    },

    getUserId: () => {
        try {
            const userId = localStorage.getItem(USER_ID_KEY);
            return userId;
        } catch (error) {
            return null;
        }
    },

    clearSession: () => {
        try {
            localStorage.removeItem(USER_ID_KEY);
        } catch (error) {
            console.error("清除本地会话失败:", error);
        }
    }
}; 