'use client'

import { handleLogin as serverHandleLogin } from "@/app/auth/session";
import toast from "react-hot-toast";
import { useAuthStore } from "../stores/authStore";

const USER_ID_KEY = 'app_user_id';

/**
 * 客户端会话服务
 * 提供会话管理功能，解决服务器组件与客户端组件间的状态同步问题
 */
export const clientSessionService = {
    // 处理用户登录，设置服务器端Cookie和本地存储
    handleLogin: async (userId: string, accessToken: string, refreshToken: string) => {
        try {
            console.log("客户端会话管理器 - 处理登录，用户ID:", userId);

            await serverHandleLogin(userId, accessToken, refreshToken);

            localStorage.setItem(USER_ID_KEY, userId);

            return true;
        } catch (error) {
            console.error("客户端会话登录处理失败:", error);
            return false;
        }
    },

    // 获取localstroage中的用户ID，作为服务器端Cookie的备份机制
    getUserId: () => {
        try {
            const userId = localStorage.getItem(USER_ID_KEY);
            console.log("客户端会话管理器 - 获取用户ID:", userId);
            return userId;
        } catch (error) {
            console.error("获取本地存储用户ID失败:", error);
            return null;
        }
    },

    clearSession: () => {
        try {
            localStorage.removeItem(USER_ID_KEY);
        } catch (error) {
            console.error("清除本地会话失败:", error);
        }
    },

    // 设置跨标签页状态监听，用于在一个标签页登出时同步其他标签页的状态
    setupStorageListener: () => {
        if (typeof window === 'undefined') return;
        window.removeEventListener('storage', clientSessionService._handleStorageChange);
        window.addEventListener('storage', clientSessionService._handleStorageChange);
    },

    // 处理localStorage变化事件，监听用户ID的变化
    _handleStorageChange: (event: StorageEvent) => {
        if (event.key === USER_ID_KEY) {
            console.log(`Storage change detected: ${event.key}`, {
                oldValue: event.oldValue,
                newValue: event.newValue
            });

            if (event.oldValue && !event.newValue) {
                console.log('Detected logout in another tab');

                useAuthStore.getState().checkAuth();

                let locale = 'en';
                if (typeof window !== 'undefined') {
                    const localeMatch = window.location.pathname.match(/^\/([a-z]{2})/);
                    if (localeMatch && localeMatch[1]) {
                        locale = localeMatch[1];
                    }
                }

                const logoutMessages: Record<string, string> = {
                    'zh': '您已在另一个窗口退出登录',
                    'en': 'You have been logged out in another window',
                    'fr': 'Vous avez été déconnecté dans une autre fenêtre'
                };

                toast(logoutMessages[locale] || logoutMessages.en, {
                    duration: 3000,
                    icon: '🔑'
                });
            }
        }
    }
}; 