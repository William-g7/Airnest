'use client'

import { useAuthStore } from "../stores/authStore";
import { useState, useEffect } from "react";

/**
 * 用于访问和管理用户认证状态的自定义 hook
 * 提供了用户 ID、认证状态和加载状态
 */
export const useAuth = () => {
    const { userId, isAuthenticated, loading, checkAuth } = useAuthStore();
    const [hasChecked, setHasChecked] = useState(false);

    // 确保只在初始挂载时检查一次认证状态
    useEffect(() => {
        if (!hasChecked) {
            checkAuth().then(() => setHasChecked(true));
        }
    }, [checkAuth, hasChecked]);

    return {
        userId,
        isAuthenticated,
        isLoading: loading && !hasChecked,
        refreshAuth: checkAuth
    };
}; 