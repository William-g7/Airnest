'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import apiService from '@/app/services/apiService';
import CustomButton from '@/app/components/forms/CustomButton';
import toast from 'react-hot-toast';
import { useLoginModal } from '@/app/components/hooks/useLoginModal';

interface VerificationState {
  loading: boolean;
  success: boolean;
  error: string;
  user?: {
    id: string;
    email: string;
    name: string;
    email_verified: boolean;
  };
}

function VerifyEmailContent() {
  const t = useTranslations('emailVerification');
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginModal = useLoginModal();
  
  const [state, setState] = useState<VerificationState>({
    loading: true,
    success: false,
    error: '',
  });
  const [hasVerified, setHasVerified] = useState(false); // 防止重复验证

  useEffect(() => {
    // 只在组件首次挂载时运行一次
    if (hasVerified) return;

    const performVerification = async () => {
      // 获取token的多种方式
      let tokenToUse = searchParams.get('token');
      
      // 如果searchParams为空，尝试从URL直接获取
      if (!tokenToUse && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        tokenToUse = urlParams.get('token');
      }
      
      if (!tokenToUse) {
        setState({
          loading: false,
          success: false,
          error: t('noTokenProvided'),
        });
        return;
      }

      // 标记为已验证，防止重复执行
      setHasVerified(true);
      
      // 延迟一小段时间确保组件稳定
      setTimeout(() => {
        verifyTokenWithValue(tokenToUse);
      }, 100);
    };

    performVerification();
  }, []); // 空依赖数组，只运行一次

  const verifyTokenWithValue = async (tokenValue: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: '' }));

      const response = await apiService.verifyEmailToken(tokenValue);

      if (response.success) {
        setState({
          loading: false,
          success: true,
          error: '',
          user: response.user,
        });

        toast.success(t('verificationSuccess'));
      } else {
        setState({
          loading: false,
          success: false,
          error: response.message || t('verificationFailed'),
        });
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      
      let errorMessage = t('verificationFailed');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // 特殊处理：如果token已使用，可能用户之前已经验证成功
      if (error.response?.data?.message?.includes('已使用') || 
          error.response?.data?.message?.includes('already used')) {
        setState({
          loading: false,
          success: true,
          error: '',
        });
        toast.success(t('alreadyVerified'));
        return;
      }

      setState({
        loading: false,
        success: false,
        error: errorMessage,
      });

      toast.error(errorMessage);
    }
  };

  // 删除未使用的verifyToken函数，因为所有逻辑已在verifyTokenWithValue中

  const handleGoToLogin = () => {
    router.push('/');
    // 延迟一小段时间让页面加载完成后再打开登录模态框
    setTimeout(() => {
      loginModal.onOpen();
    }, 100);
  };

  const handleResendEmail = () => {
    router.push('/resend-verification');
  };

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-airbnb mx-auto"></div>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">
              {t('verifying')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('pleaseWait')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mt-4">
              {t('emailVerified')}
            </h1>
            
            <p className="text-gray-600 mt-2">
              {t('emailVerifiedDescription')}
            </p>

            {state.user && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>{t('account')}:</strong> {state.user.email}
                </p>
              </div>
            )}

            <div className="mt-6">
              <CustomButton
                label={t('goToLogin')}
                onClick={handleGoToLogin}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            {t('verificationFailed')}
          </h1>
          
          <p className="text-gray-600 mt-2">
            {state.error}
          </p>

          <div className="mt-6 space-y-3">
            <CustomButton
              label={t('resendEmail')}
              onClick={handleResendEmail}
              className="w-full"
            />
            
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
            >
              {t('backToHome')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}