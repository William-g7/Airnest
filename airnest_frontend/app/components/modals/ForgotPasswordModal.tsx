'use client';

import { useState } from 'react';
import { useForgotPasswordModal } from '../hooks/useForgotPasswordModal';
import { useLoginModal } from '../hooks/useLoginModal';
import Modal from './Modal';
import CustomButton from '../common/CustomButton';
import apiService from '@/app/services/apiService';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { useErrorHandler } from '@/app/hooks/useErrorHandler';
import AuthModalErrorBoundary from './AuthModalErrorBoundary';

export default function ForgotPasswordModal() {
  const t = useTranslations('auth');
  const forgotPasswordModal = useForgotPasswordModal();
  const loginModal = useLoginModal();
  const { handleError } = useErrorHandler();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  // 邮箱格式验证
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // 邮箱地址脱敏
  const maskEmail = (email: string): string => {
    if (!email.includes('@')) return email;
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart}***@${domain}`;
    }
    const firstChar = localPart.charAt(0);
    const lastChar = localPart.charAt(localPart.length - 1);
    const maskedLocal = `${firstChar}${'*'.repeat(Math.min(localPart.length - 2, 4))}${lastChar}`;
    return `${maskedLocal}@${domain}`;
  };

  const handleBackToLogin = () => {
    forgotPasswordModal.onClose();
    setEmail('');
    setError('');
    setIsSuccess(false);
    setSentToEmail('');
    loginModal.onOpen();
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!email) {
        setError(t('pleaseCompleteAllFields'));
        return;
      }

      // 邮箱格式验证
      if (!validateEmail(email)) {
        setError(t('invalidEmailFormat'));
        return;
      }

      const response = await apiService.postwithouttoken(
        '/api/auth/forgot-password/',
        {
          email: email.toLowerCase().trim(),
          language: 'en',
        },
        { suppressToast: true }
      );

      if (response.success) {
        setSentToEmail(email.toLowerCase().trim());
        setIsSuccess(true);
        // 始终使用翻译的消息，保持一致的用户体验
        toast.success(t('resetEmailSuccess'));
        console.log('API Response:', response);
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(t('resetEmailSendFailed'));
        handleError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    forgotPasswordModal.onClose();
    setEmail('');
    setError('');
    setIsSuccess(false);
    setSentToEmail('');
  };

  const content = (
    <AuthModalErrorBoundary>
      <div className="flex flex-col gap-4">
        {!isSuccess ? (
          <>
            {/* 头部 */}
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{t('resetPassword')}</h2>
              <p className="text-gray-600 mt-2">
                {t('resetPasswordDescription')}
              </p>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 text-sm bg-red-100 text-red-600 rounded-lg">
                {error}
              </div>
            )}

            {/* 邮箱输入 */}
            <div className="flex flex-col">
              <input
                type="email"
                placeholder={t('email')}
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* 发送按钮 */}
            <CustomButton
              label={isLoading ? t('loading') : t('sendResetEmail')}
              onClick={handleSubmit}
              disabled={isLoading}
            />

            {/* 返回登录 */}
            <div className="text-center pt-4 border-t">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-sm text-gray-600 hover:text-airbnb transition-colors"
                disabled={isLoading}
              >
                ← {t('backToLogin')}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 成功状态 - 重新设计 */}
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg 
                  className="w-8 h-8 text-green-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('emailSent')}
              </h3>
              
              <div className="text-gray-600 mb-6">
                <p className="text-center mb-3">{t('resetEmailSentTo')}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-medium text-gray-900">{maskEmail(sentToEmail)}</span>
                  <div className="relative group">
                    <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center cursor-help">
                      <span className="text-xs font-bold text-white">?</span>
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 text-center">
                      <div className="space-y-1">
                        <div>• {t('resetLinkExpiry')}</div>
                        <div>• {t('checkSpamFolder')}</div>
                        <div>• {t('canCloseWindow')}</div>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-sm text-gray-600 hover:text-airbnb transition-colors"
              >
                {t('backToLogin')}
              </button>
            </div>
          </>
        )}
      </div>
    </AuthModalErrorBoundary>
  );

  return (
    <Modal
      label={t('resetPassword')}
      isOpen={forgotPasswordModal.isOpen}
      close={handleClose}
      content={content}
    />
  );
}