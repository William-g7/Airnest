'use client';

import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef, useState, useImperativeHandle, forwardRef } from 'react';

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
      setToken(verificationToken);
      setError(null);
      setIsLoading(false);
      onVerify?.(verificationToken);
    };

    const handleError = (errorCode: string) => {
      console.error('Turnstile verification failed:', errorCode);
      setError(errorCode);
      setToken(null);
      setIsLoading(false);
      
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
      console.warn('Turnstile verification has expired.');
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
      console.warn('Lack of NEXT_PUBLIC_TURNSTILE_SITE_KEY.');
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
            action: 'register',
            cData: 'user_registration',
            retry: 'auto',
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