'use client';

import { useState, useEffect, useRef } from 'react';
import { useSignupModal } from '../hooks/useSignupModal';
import { useLoginModal } from '../hooks/useLoginModal';
import Modal from './Modal';
import CustomButton from '../common/CustomButton';
import apiService from '@/app/services/apiService';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { useErrorHandler } from '@/app/hooks/useErrorHandler';
import AuthModalErrorBoundary from './AuthModalErrorBoundary';
import TurnstileWidget, { TurnstileWidgetRef } from '../security/TurnstileWidget';

// 定义步骤枚举
enum SignupStep {
  FORM = 'form',
  EMAIL_SENT = 'email_sent'
}

export default function SignupModal() {
  const t = useTranslations('auth');
  const tVerify = useTranslations('emailVerification');
  const signupModal = useSignupModal();
  const loginModal = useLoginModal();
  const { handleError, ErrorType } = useErrorHandler();
  
  // 步骤控制
  const [currentStep, setCurrentStep] = useState<SignupStep>(SignupStep.FORM);
  
  // 表单状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  
  // 邮件发送状态
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Turnstile验证状态
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

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

  // 密码强度检查
  useEffect(() => {
    checkPasswordStrength(formData.password);
  }, [formData.password]);

  // 倒计时管理
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 模态框关闭时重置状态
  useEffect(() => {
    if (!signupModal.isOpen) {
      setCurrentStep(SignupStep.FORM);
      setEmailSentSuccess(false);
      setCooldown(0);
      setError('');
      setEmailError('');
      setPasswordError('');
      setFormData({ email: '', password: '', password2: '' });
    }
  }, [signupModal.isOpen]);

  const clearErrors = () => {
    setError('');
    setEmailError('');
    setPasswordError('');
    setTurnstileError(null);
  };

  // 邮箱格式验证
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // 邮箱脱敏显示
  const maskEmail = (email: string): string => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    
    const maskedLocal = localPart.length <= 2 
      ? localPart[0] + '*' 
      : localPart[0] + '*'.repeat(Math.min(localPart.length - 2, 4)) + localPart.slice(-1);
    
    return `${maskedLocal}@${domain}`;
  };

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      clearErrors();

      // 邮箱格式验证
      if (!validateEmail(formData.email)) {
        setEmailError(t('invalidEmailFormat'));
        return;
      }

      if (passwordStrength < 3) {
        setPasswordError(t('passwordNotStrongEnough'));
        return;
      }

      if (formData.password !== formData.password2) {
        setPasswordError(t('passwordsNotMatch'));
        return;
      }

      // Turnstile安全验证
      if (!turnstileToken) {
        setTurnstileError(t('verification_failed'));
        toast.error(t('pleaseCompleteSecurityVerification'));
        return;
      }

      // 第一步：注册用户（创建未激活账号）
      const registerResponse = await apiService.postwithouttoken(
        '/api/auth/register/',
        {
          email: formData.email,
          password1: formData.password,
          password2: formData.password2,
          turnstile_token: turnstileToken,
        },
        { suppressToast: true }
      );

      // 第二步：发送验证邮件
      if (registerResponse) {
        try {
          await apiService.sendVerificationEmail({
            email: formData.email,
            verification_type: 'registration',
            language: 'en' // TODO: 获取当前语言
          });
          
          // 切换到邮件发送成功视图
          setEmailSentSuccess(true);
          setCurrentStep(SignupStep.EMAIL_SENT);
          setCooldown(120); // 2分钟倒计时
          
          // 显示成功Toast
          toast.success(t('registrationSuccess'));
          
        } catch (emailError) {
          // 即使发送邮件失败，用户也已经注册成功了
          setEmailSentSuccess(false);
          setCurrentStep(SignupStep.EMAIL_SENT);
          
          // 显示错误信息
          toast.success(t('registrationSuccess'));
          toast.error(t('emailSendError') || 'Failed to send verification email');
        }
      } else {
        setError(t('somethingWentWrong'));
      }
    } catch (error: any) {
      // 处理 API 错误响应
      if (error.message?.includes('A user is already registered with this e-mail address')) {
        setEmailError('A user is already registered with this e-mail address.');
      } else if (error.response?.data?.email) {
        setEmailError(error.response.data.email[0]);
      } else if (error.response?.data?.password1) {
        setPasswordError(error.response.data.password1[0]);
      } else if (error.response?.data?.password2) {
        setPasswordError(error.response.data.password2[0]);
      } else if (error.response?.data?.non_field_errors) {
        setError(error.response.data.non_field_errors[0]);
      } else if (error.message && error.message !== 'Invalid response from server') {
        // 如果有具体的错误消息，直接显示
        setEmailError(error.message);
      } else {
        setError(t('somethingWentWrong'));
        handleError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Turnstile验证回调
  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    setTurnstileError(null);
  };

  const handleTurnstileError = (error: string) => {
    setTurnstileToken(null);
    setTurnstileError(error);
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
    setTurnstileError('expired');
  };

  // 重发验证邮件
  const handleResendEmail = async () => {
    if (cooldown > 0) {
      toast.error(tVerify('pleaseWaitBeforeResending'));
      return;
    }

    try {
      setResendLoading(true);

      await apiService.sendVerificationEmail({
        email: formData.email,
        verification_type: 'registration',
        language: 'en'
      });

      setEmailSentSuccess(true);
      setCooldown(120);
      toast.success(tVerify('verificationEmailSent'));

    } catch (error: any) {
      setEmailSentSuccess(false);
      toast.error('Failed to send verification email');
    } finally {
      setResendLoading(false);
    }
  };

  // 切换到登录模态框
  const handleGoToLogin = () => {
    signupModal.onClose();
    setTimeout(() => {
      loginModal.onOpen();
    }, 100);
  };

  // 返回注册表单
  const handleBackToForm = () => {
    setCurrentStep(SignupStep.FORM);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength === 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-orange-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    if (passwordStrength === 4) return 'bg-green-500';
    return 'bg-green-600';
  };

  const formatCooldownTime = () => {
    const minutes = Math.floor(cooldown / 60);
    const seconds = cooldown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 注册表单视图
  const renderFormStep = () => (
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

        {/* Turnstile安全验证 */}
        <div className="space-y-2">
          <TurnstileWidget
            ref={turnstileRef}
            onVerify={handleTurnstileVerify}
            onError={handleTurnstileError}
            onExpire={handleTurnstileExpire}
            theme="light"
            size="normal"
            className="flex justify-center"
          />
        </div>

        <CustomButton
          label={isLoading ? t('loading') : t('signup')}
          onClick={onSubmit}
          disabled={isLoading || !turnstileToken}
        />
      </form>

      <div className="text-center text-gray-500 text-sm">
        {t('alreadyHaveAccount')}{' '}
        <button
          onClick={handleGoToLogin}
          className="text-airbnb hover:underline"
        >
          {t('login')}
        </button>
      </div>
    </div>
  );

  // 邮件发送状态视图
  const renderEmailSentStep = () => (
    <div className="flex flex-col gap-8 text-center">
      {/* 顶部图标 */}
      <div className="w-20 h-20 bg-gradient-to-br from-rose-50 to-pink-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
        <svg className="w-10 h-10 text-airbnb" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      {/* 标题和描述 */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">
          Email Verified Successfully!
        </h2>
        <div className="flex items-center justify-center gap-2">
          <p className="text-gray-600 text-lg">
            Verification email sent to{' '}
            <span className="font-medium text-gray-800">
              {maskEmail(formData.email)}
            </span>
          </p>
          {/* 帮助提示图标 */}
          <div className="relative group">
            <div className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center cursor-help transition-colors duration-200">
              <span className="text-gray-500 text-sm font-medium">?</span>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg py-3 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="space-y-2">
                <p className="font-medium">Didn't receive the email?</p>
                <ul className="space-y-1 text-gray-300">
                  <li>• Check your spam/junk folder</li>
                  <li>• Wait a few minutes for delivery</li>
                  <li>• Make sure your email address is correct</li>
                </ul>
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 按钮区域 */}
      <div className="space-y-4">
        {/* 重发邮件按钮 - 全宽 */}
        <CustomButton
          label={
            resendLoading 
              ? tVerify('sending')
              : cooldown > 0 
                ? `Resend in ${formatCooldownTime()}`
                : tVerify('resendEmail')
          }
          onClick={handleResendEmail}
          disabled={resendLoading || cooldown > 0}
          className="w-full"
        />
        
        {/* 我已验证按钮 */}
        <button
          onClick={handleGoToLogin}
          className="w-full px-6 py-3 text-airbnb bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 hover:border-rose-300 transition-all duration-200 font-medium"
        >
          I've verified my email - Login
        </button>
      </div>

      {/* 返回链接 */}
      <button
        onClick={handleBackToForm}
        className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center justify-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to registration form
      </button>
    </div>
  );

  const content = (
    <AuthModalErrorBoundary>
      {currentStep === SignupStep.FORM ? renderFormStep() : renderEmailSentStep()}
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
