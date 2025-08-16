'use client';

import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef, useImperativeHandle, forwardRef } from 'react';
import { useState } from 'react';

interface TurnstileWidgetProps {
  onVerify?: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

export interface TurnstileWidgetRef {
  reset: () => void;
  getResponse: () => string | null;
  isVerified: () => boolean;
}

// 静态文本常量（避免i18n依赖问题）
const TEXTS = {
  NOT_CONFIGURED: 'Security verification not configured',
  VERIFYING: 'Verifying security...',
  VERIFIED: 'Security verified',
  FAILED: 'Verification failed, please try again',
  NETWORK_ERROR: 'Network error, please check your connection',
  TIMEOUT: 'Verification timeout, please try again',
  INTERNAL_ERROR: 'Internal error, please contact support',
  EXPIRED: 'Verification expired, please try again',
  RETRY: 'Retry'
};

const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ onVerify, onError, onExpire, theme = 'light', size = 'normal', className = '' }, ref) => {
    const turnstileRef = useRef<TurnstileInstance>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      reset: () => {
        turnstileRef.current?.reset();
        setToken(null);
        setError(null);
      },
      getResponse: () => token,
      isVerified: () => !!token && !error
    }));

    const handleVerify = (verificationToken: string) => {
      console.log('🔒 Turnstile验证成功');
      setToken(verificationToken);
      setError(null);
      setIsLoading(false);
      onVerify?.(verificationToken);
    };

    const handleError = (errorCode: string) => {
      console.error('❌ Turnstile验证失败:', errorCode);
      setError(errorCode);
      setToken(null);
      setIsLoading(false);
      
      // 提供友好的错误提示
      let friendlyError = TEXTS.FAILED;
      switch (errorCode) {
        case 'network-error':
          friendlyError = TEXTS.NETWORK_ERROR;
          break;
        case 'timeout':
          friendlyError = TEXTS.TIMEOUT;
          break;
        case 'internal-error':
          friendlyError = TEXTS.INTERNAL_ERROR;
          break;
        default:
          friendlyError = TEXTS.FAILED;
      }
      
      onError?.(friendlyError);
    };

    const handleExpire = () => {
      console.warn('⏰ Turnstile验证已过期');
      setToken(null);
      setError(TEXTS.EXPIRED);
      onExpire?.();
    };

    const handleBeforeInteractive = () => {
      setIsLoading(true);
    };

    const handleAfterInteractive = () => {
      setIsLoading(false);
    };

    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      console.warn('⚠️ NEXT_PUBLIC_TURNSTILE_SITE_KEY 未配置');
      return (
        <div className="text-sm text-gray-500">
          {TEXTS.NOT_CONFIGURED}
        </div>
      );
    }

    return (
      <div className={`turnstile-container ${className}`}>
        <Turnstile
          ref={turnstileRef}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          onSuccess={handleVerify}
          onError={handleError}
          onExpire={handleExpire}
          onBeforeInteractive={handleBeforeInteractive}
          onAfterInteractive={handleAfterInteractive}
          options={{
            theme,
            size,
            // 优先使用静默模式（用户无感知）
            action: 'register',
            cData: 'user_registration',
            // 失败时自动重试
            retry: 'auto',
            // 语言设置
            language: 'auto'
          }}
        />
        
        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-center justify-center mt-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-airbnb"></div>
            <span className="ml-2 text-sm text-gray-500">
              {TEXTS.VERIFYING}
            </span>
          </div>
        )}
        
        {/* 错误状态 */}
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error} 
            <button 
              onClick={() => turnstileRef.current?.reset()}
              className="ml-2 text-airbnb hover:underline"
            >
              {TEXTS.RETRY}
            </button>
          </div>
        )}
        
      </div>
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;