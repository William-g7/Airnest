'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/app/stores/authStore';
import apiService from '@/app/services/apiService';
import toast from 'react-hot-toast';

interface VerificationBannerProps {
  userEmail?: string;
}

export default function EmailVerificationBanner({ userEmail }: VerificationBannerProps) {
  const t = useTranslations('emailVerification');
  const router = useRouter();
  const { userId, isAuthenticated } = useAuthStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // 检查用户验证状态
  useEffect(() => {
    if (isAuthenticated && userId) {
      // 如果用户已登录，显示banner（这里应该从API获取用户验证状态）
      // 为了简化，暂时根据userEmail prop判断
      setIsVisible(true); // 可以根据需要调整逻辑
    }
  }, [isAuthenticated, userId]);

  // 冷却时间倒计时
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0) {
      toast.error(t('pleaseWaitBeforeResending'));
      return;
    }

    try {
      setIsLoading(true);

      await apiService.resendVerificationEmail({
        verification_type: 'registration',
        language: 'en' // TODO: 获取当前语言
      });

      // 设置冷却时间
      setCooldown(120); // 2分钟

      toast.success(t('verificationEmailSent'));
    } catch (error: any) {
      console.error('Resend verification error:', error);
      
      let errorMessage = t('emailSendError');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToResendPage = () => {
    const email = userEmail || '';
    router.push('/resend-verification' as any);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // 可以在这里保存用户的关闭偏好到localStorage
    localStorage.setItem('emailVerificationBannerDismissed', 'true');
  };

  const formatCooldownTime = () => {
    const minutes = Math.floor(cooldown / 60);
    const seconds = cooldown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>{t('emailNotVerified')}</strong>
            </p>
            <p className="text-sm text-yellow-600 mt-1">
              {t('pleaseVerifyEmail')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 快速重发按钮 */}
          <button
            onClick={handleResendEmail}
            disabled={isLoading || cooldown > 0}
            className={`px-3 py-1 text-xs rounded-md transition-colors duration-200 ${
              isLoading || cooldown > 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
            }`}
          >
            {isLoading 
              ? t('sending') 
              : cooldown > 0 
                ? formatCooldownTime()
                : t('resendEmail')
            }
          </button>

          {/* 去验证页面 */}
          <button
            onClick={handleGoToResendPage}
            className="px-3 py-1 text-xs bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors duration-200"
          >
            {t('verifyNow')}
          </button>

          {/* 关闭按钮 */}
          <button
            onClick={handleDismiss}
            className="text-yellow-400 hover:text-yellow-600 transition-colors duration-200"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}