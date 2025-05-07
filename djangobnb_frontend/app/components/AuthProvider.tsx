'use client'

import { useEffect } from 'react';
import { useAuthStore } from '@/app/stores/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { checkAuth } = useAuthStore();

    // 应用加载时就应该检查认证状态
    useEffect(() => {
        checkAuth();

        // 可以添加监听刷新令牌的逻辑（未来的工作）
    }, [checkAuth]);

    return <>{children}</>;
} 