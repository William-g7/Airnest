'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSignupModal } from '../hooks/useSignupModal';
import { useLoginModal } from '../hooks/useLoginModal';
import Modal from './Modal';
import CustomButton from '../forms/CustomButton';
import apiService from '@/app/services/apiService';
import { handleLogin } from '@/app/auth/session';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/app/stores/authStore';
import toast from 'react-hot-toast';
import { useErrorHandler } from '@/app/hooks/useErrorHandler';
import AuthModalErrorBoundary from './AuthModalErrorBoundary';

export default function SignupModal() {
  const t = useTranslations('auth');
  const router = useRouter();
  const signupModal = useSignupModal();
  const loginModal = useLoginModal();
  const { setAuthenticated } = useAuthStore();
  const { handleError, ErrorType } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
  });

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    let feedback = '';

    if (password.length === 0) {
      setPasswordStrength(0);
      setPasswordFeedback('');
      return;
    }
    if (password.length >= 8) {
      strength += 1;
    } else {
      feedback = t('passwordTooShort');
    }

    if (/\d/.test(password)) {
      strength += 1;
    }
    if (/[a-z]/.test(password)) {
      strength += 1;
    }
    if (/[A-Z]/.test(password)) {
      strength += 1;
    }
    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 1;
    }

    if (strength === 1) {
      feedback = feedback || (t('passwordWeak'));
    } else if (strength === 2) {
      feedback = t('passwordFair');
    } else if (strength === 3) {
      feedback = t('passwordGood');
    } else if (strength === 4) {
      feedback = t('passwordStrong');
    } else if (strength === 5) {
      feedback = t('passwordVeryStrong');
    }

    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  };

  useEffect(() => {
    checkPasswordStrength(formData.password);
  }, [formData.password]);

  const clearErrors = () => {
    setError('');
    setEmailError('');
    setPasswordError('');
  };

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      clearErrors();

      if (passwordStrength < 3) {
        setPasswordError(t('passwordNotStrongEnough'));
        return;
      }

      if (formData.password !== formData.password2) {
        setPasswordError(t('passwordsNotMatch'));
        return;
      }

      const response = await apiService.postwithouttoken(
        '/api/auth/register/',
        {
          email: formData.email,
          password1: formData.password,
          password2: formData.password2,
        },
        { suppressToast: true }
      );

      if (response.access) {
        await handleLogin(response.user_pk, response.access, response.refresh);
        setAuthenticated(response.user_pk);
        signupModal.onClose();
        toast.success(t('signupSuccess'));
        router.push('/');
      } else {
        setError(t('somethingWentWrong'));
      }
    } catch (error: any) {
      console.error('Signup error:', error);

      if (error.response?.data?.email) {
        setEmailError(error.response.data.email[0]);
      } else if (error.response?.data?.password1) {
        setPasswordError(error.response.data.password1[0]);
      } else if (error.response?.data?.password2) {
        setPasswordError(error.response.data.password2[0]);
      } else if (error.response?.data?.non_field_errors) {
        setError(error.response.data.non_field_errors[0]);
      } else {
        setError(t('somethingWentWrong'));
        handleError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength === 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-orange-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    if (passwordStrength === 4) return 'bg-green-500';
    return 'bg-green-600';
  };

  const content = (
    <AuthModalErrorBoundary>
      <div className="flex flex-col gap-4">
        <h2 className="mb-4 text-2xl font-bold">{t('createAccount')}</h2>

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

          <div className="flex flex-col">
            <input
              type="password"
              placeholder={t('password')}
              value={formData.password}
              onChange={e => {
                setFormData(prev => ({
                  ...prev,
                  password: e.target.value,
                }));
                setPasswordError('');
              }}
              className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb ${
                passwordError ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
            
            {/* 密码强度指示器 */}
            {formData.password && (
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getPasswordStrengthColor()}`} 
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs mt-1 text-gray-600">{passwordFeedback}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <input
              type="password"
              placeholder={t('confirmPassword')}
              value={formData.password2}
              onChange={e => {
                setFormData(prev => ({
                  ...prev,
                  password2: e.target.value,
                }));
                setPasswordError('');
              }}
              className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb ${
                passwordError ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
            {passwordError && <span className="text-sm text-red-500 mt-1">{passwordError}</span>}
          </div>

          <CustomButton
            label={isLoading ? t('loading') : t('signup')}
            onClick={onSubmit}
            disabled={isLoading}
          />
        </form>

        <div className="text-center text-gray-500 text-sm">
          {t('alreadyHaveAccount')}{' '}
          <button
            onClick={() => {
              signupModal.onClose();
              loginModal.onOpen();
            }}
            className="text-airbnb hover:underline"
          >
            {t('login')}
          </button>
        </div>
      </div>
    </AuthModalErrorBoundary>
  );

  return (
    <Modal
      label={t('signup')}
      isOpen={signupModal.isOpen}
      close={signupModal.onClose}
      content={content}
    />
  );
}
