'use client';

import { useEffect } from 'react';
import { initCsrfToken } from '@/app/services/csrfService';
import { useNonce } from '@/app/providers/NonceProvider';
import { ScriptWithNonce } from './ScriptWithNonce';

/**
 * 客户端CSRF初始化组件
 * 负责在应用加载时获取CSRF令牌
 */
export function ClientSideCsrfInitializer() {
  // 从上下文中获取nonce
  const nonce = useNonce();

  useEffect(() => {
    const initCsrf = async () => {
      try {
        await initCsrfToken();
        console.log('CSRF token initialized');
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
      }
    };

    initCsrf();
  }, []);

  // 对于需要内联的初始化脚本，使用ScriptWithNonce
  return nonce ? (
    <ScriptWithNonce nonce={nonce} id="csrf-init">
      {`
                // 可能的内联JavaScript初始化代码
                console.log('CSRF protection initialized with nonce');
            `}
    </ScriptWithNonce>
  ) : null;
}
