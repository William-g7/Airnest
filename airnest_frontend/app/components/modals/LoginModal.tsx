'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLoginModal } from '../hooks/useLoginModal';
import { useForgotPasswordModal } from '../hooks/useForgotPasswordModal';
import Modal from './Modal';
import CustomButton from '../forms/CustomButton';
import apiService from '@/app/services/apiService';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/app/stores/authStore';
import toast from 'react-hot-toast';
import { useErrorHandler } from '@/app/hooks/useErrorHandler';
import AuthModalErrorBoundary from './AuthModalErrorBoundary';
import { clientSessionService } from '@/app/services/clientSessionService';

export default function LoginModal() {
  const t = useTranslations('auth');
  const loginModal = useLoginModal();
  const forgotPasswordModal = useForgotPasswordModal();
  const router = useRouter();
  const { setAuthenticated } = useAuthStore();
  const { handleError, ErrorType } = useErrorHandler();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  // 邮箱格式验证
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleForgotPassword = () => {
    loginModal.onClose();
    forgotPasswordModal.onOpen();
  };

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      setError('');
      setEmailError('');

      if (!formData.email || !formData.password) {
        setError(t('pleaseCompleteAllFields'));
        return;
      }

      // 邮箱格式验证
      if (!validateEmail(formData.email)) {
        setEmailError(t('invalidEmailFormat'));
        return;
      }

      const response = await apiService.postwithouttoken(
        '/api/auth/login/',
        {
          email: formData.email,
          password: formData.password,
        },
        { suppressToast: true }
      );

      if (response.access) {
        const userId = response.user_id || response.user_pk || (response.user && (response.user.id || response.user.pk));

        if (!userId) {
          toast.error(t('loginError'));
          setIsLoading(false);
          return;
        }

        // 检查邮箱验证状态
        if (response.user && !response.user.email_verified) {
          loginModal.onClose();
          toast.error(t('emailNotVerified'));
          toast(t('pleaseVerifyEmail'), {
            duration: 6000,
            icon: '📧',
          });
          
          // 跳转到重发验证邮件页面
          window.location.href = `/resend-verification?email=${encodeURIComponent(formData.email)}`;
          return;
        }

        await clientSessionService.handleLogin(userId, response.access, response.refresh);

        setAuthenticated(userId);

        loginModal.onClose();

        setTimeout(() => {
          router.push('/');
        }, 100);
      } else {
        setError(t('invalidCredentials'));
      }
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.response?.data?.non_field_errors) {
        setError(error.response.data.non_field_errors[0]);
      } else {
        setError(t('loginError'));
        handleError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <AuthModalErrorBoundary>
      <div className="flex flex-col gap-4">
        <h2 className="mb-4 text-2xl font-bold">{t('pleaseLogin')}</h2>

        {error && <div className="p-3 text-sm bg-red-100 text-red-600 rounded-lg">{error}</div>}
        <form className="flex flex-col gap-4">
          <div className="flex flex-col">
            <input
              type="email"
              placeholder={t('email')}
              value={formData.email}
              onChange={e => {
                setFormData(prev => ({
                  ...prev,
                  email: e.target.value,
                }));
                setEmailError('');
              }}
              className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb ${
                emailError ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
            {emailError && <span className="text-sm text-red-500 mt-1">{emailError}</span>}
          </div>
          <input
            type="password"
            placeholder={t('password')}
            value={formData.password}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                password: e.target.value,
              }))
            }
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
            disabled={isLoading}
          />
          
          {/* 忘记密码链接 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-gray-600 hover:text-airbnb hover:underline transition-colors"
              disabled={isLoading}
            >
              {t('forgotPassword')}
            </button>
          </div>
          
          <CustomButton
            label={isLoading ? t('loading') : t('login')}
            onClick={onSubmit}
            disabled={isLoading}
          />
        </form>
      </div>
    </AuthModalErrorBoundary>
  );

  return (
    <Modal
      label={t('login')}
      isOpen={loginModal.isOpen}
      close={loginModal.onClose}
      content={content}
    />
  );
}
