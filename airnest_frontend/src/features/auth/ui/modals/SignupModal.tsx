'use client';

import { useState, useEffect, useRef, useActionState, startTransition } from 'react';
import { useLoginModal, useSignupModal } from '@auth/client/modalStore';
import Modal from '@sharedUI/Modal';
import Button from '@sharedUI/Button';
import apiService from '@auth/client/clientApiService';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { useErrorHandler } from '@errors/useErrorHandler';
import TurnstileWidget, { TurnstileWidgetRef } from '@auth/security/TurnstileWidget';

// 定义步骤枚举
enum SignupStep {
  FORM = 'form',
  EMAIL_SENT = 'email_sent'
}

type SignupState = { ok: boolean; error: string | null }; 
type ResendState  = { ok: boolean; error: string | null };

export default function SignupModal() {
  const t = useTranslations('auth');
  const tVerify = useTranslations('emailVerification');
  const signupModal = useSignupModal();
  const loginModal = useLoginModal();
  const { handleError } = useErrorHandler();
  
  // 步骤控制
  const [currentStep, setCurrentStep] = useState<SignupStep>(SignupStep.FORM);
  
  // 表单状态
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  
  // 邮件发送状态
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

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

    if (/\d/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    if (strength === 1) {
      feedback = feedback || t('passwordWeak');
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

  // 倒计时管理（函数式更新避免闭包问题）
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(c => (c > 0 ? c - 1 : 0));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 模态框关闭时重置状态（顺便 reset Turnstile）
  useEffect(() => {
    if (!signupModal.isOpen) {
      setCurrentStep(SignupStep.FORM);
      setEmailSentSuccess(false);
      setCooldown(0);
      setError('');
      setEmailError('');
      setPasswordError('');
      setFormData({ email: '', password: '', password2: '' });
      setTurnstileToken(null); 
      setTurnstileError(null); 
      turnstileRef.current?.reset?.();
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
    if (!localPart) return email;
    const maskedLocal =
      localPart.length <= 2
        ? localPart[0] + '*'
        : localPart[0] + '*'.repeat(Math.min(localPart.length - 2, 4)) + localPart.slice(-1);
    return `${maskedLocal}@${domain}`;
  };

  // ---------- 注册提交流程 ----------
  const signupAction = async (_prev: SignupState): Promise<SignupState> => {
    try {
      clearErrors();

      // 轻量校验（字段级错误仍保留）
      if (!validateEmail(formData.email)) {
        setEmailError(t('invalidEmailFormat'));
        return { ok: false, error: t('invalidEmailFormat') };
      }
      if (passwordStrength < 3) {
        setPasswordError(t('passwordNotStrongEnough'));
        return { ok: false, error: t('passwordNotStrongEnough') };
      }
      if (formData.password !== formData.password2) {
        setPasswordError(t('passwordsNotMatch'));
        return { ok: false, error: t('passwordsNotMatch') };
      }
      if (!turnstileToken) {
        setTurnstileError(t('verification_failed'));
        toast.error(t('pleaseCompleteSecurityVerification'));
        return { ok: false, error: t('verification_failed') };
      }

      // 第一步：注册用户（创建未激活账号）
      const registerResponse = await apiService.post(
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
            language: 'en'
          });

          setEmailSentSuccess(true);
          setCurrentStep(SignupStep.EMAIL_SENT);
          setCooldown(120);
          toast.success(t('registrationSuccess'));
        } catch (emailErr) {
          // 账号已创建，但邮件发送失败，仍进入邮件视图，允许重发
          setEmailSentSuccess(false);
          setCurrentStep(SignupStep.EMAIL_SENT);
          toast.success(t('registrationSuccess'));
          toast.error(t('emailSendError') || 'Failed to send verification email');
        }
        return { ok: true, error: null };
      } else {
        setError(t('somethingWentWrong'));
        return { ok: false, error: t('somethingWentWrong') };
      }
    } catch (error: any) {
      // API 错误映射
      if (error.message?.includes('A user is already registered with this e-mail address')) {
        const msg = 'A user is already registered with this e-mail address.';
        setEmailError(msg);
        return { ok: false, error: msg };
      } else if (error.response?.data?.email) {
        const msg = error.response.data.email[0];
        setEmailError(msg);
        return { ok: false, error: msg };
      } else if (error.response?.data?.password1) {
        const msg = error.response.data.password1[0];
        setPasswordError(msg);
        return { ok: false, error: msg };
      } else if (error.response?.data?.password2) {
        const msg = error.response.data.password2[0];
        setPasswordError(msg);
        return { ok: false, error: msg };
      } else if (error.response?.data?.non_field_errors) {
        const msg = error.response.data.non_field_errors[0];
        setError(msg);
        return { ok: false, error: msg };
      } else if (error.message && error.message !== 'Invalid response from server') {
        setEmailError(error.message);
        return { ok: false, error: error.message };
      } else {
        const msg = t('somethingWentWrong');
        setError(msg);
        handleError(error);
        return { ok: false, error: msg };
      }
    }
  };

  const [signupState, runSignup, isSigningUp] = useActionState<SignupState>(
    signupAction,
    { ok: false, error: null }
  );

  // ---------- 重发验证邮件 ----------
  const resendAction = async (_prev: ResendState): Promise<ResendState> => {
    if (cooldown > 0) {
      return { ok: false, error: tVerify('pleaseWaitBeforeResending') };
    }
    try {
      await apiService.sendVerificationEmail({
        email: formData.email,
        verification_type: 'registration',
        language: 'en'
      });
      setEmailSentSuccess(true);
      setCooldown(120);
      toast.success(tVerify('verificationEmailSent'));
      return { ok: true, error: null };
    } catch (error: any) {
      setEmailSentSuccess(false);
      toast.error('Failed to send verification email');
      return { ok: false, error: 'Failed to send verification email' };
    }
  };

  const [resendState, runResend, isResending] = useActionState<ResendState>(
    resendAction,
    { ok: false, error: null }
  );

  // 表单提交（回车支持 + 点击按钮触发）
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    startTransition(() => {
      runSignup();  
    })
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

  // 切换到登录模态框
  const handleGoToLogin = () => {
    signupModal.close();
    setTimeout(() => {
      loginModal.open();
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

      {(signupState.error || error) && ( // ← 用 signupState.error 优先
        <div className="p-3 text-sm bg-red-100 text-red-600 rounded-lg">
          {signupState.error ?? error}
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}> {/* ← 支持回车提交 */}
        <div className="flex flex-col">
          <input
            type="email"
            placeholder={t('email')}
            value={formData.email}
            onChange={e => {
              setFormData(prev => ({ ...prev, email: e.target.value }));
              setEmailError('');
            }}
            className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb ${
              emailError ? 'border-red-500' : ''
            }`}
            disabled={isSigningUp}
          />
          {emailError && <span className="text-sm text-red-500 mt-1">{emailError}</span>}
        </div>

        <div className="flex flex-col">
          <input
            type="password"
            placeholder={t('password')}
            value={formData.password}
            onChange={e => {
              setFormData(prev => ({ ...prev, password: e.target.value }));
              setPasswordError('');
            }}
            className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb ${
              passwordError ? 'border-red-500' : ''
            }`}
            disabled={isSigningUp}
          />
          
          {/* 密码强度指示器 */}
          {formData.password && (
            <div className="mt-2">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getPasswordStrengthColor()}`} 
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
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
              setFormData(prev => ({ ...prev, password2: e.target.value }));
              setPasswordError('');
            }}
            className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb ${
              passwordError ? 'border-red-500' : ''
            }`}
            disabled={isSigningUp}
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
          {turnstileError && (
            <p className="text-xs text-red-600 text-center">{t('pleaseCompleteSecurityVerification')}</p>
          )}
        </div>

        <Button
          label={isSigningUp ? t('loading') : t('signup')}
          onClick={() => handleSubmit()}
          disabled={isSigningUp || !turnstileToken}
        />
      </form>

      <div className="text-center text-gray-500 text-sm">
        {t('alreadyHaveAccount')}{' '}
        <button onClick={handleGoToLogin} className="text-airbnb hover:underline">
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

      {/* 标题和描述（更准确的文案：已发送验证邮件） */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">
          {tVerify('verificationEmailSent')}
        </h2>
        <div className="flex items-center justify-center gap-2">
          <p className="text-gray-600 text-lg">
            {tVerify('sentTo')}{' '}
            <span className="font-medium text-gray-800">
              {maskEmail(formData.email)}
            </span>
          </p>
          {/* 帮助提示图标 */}
          <div className="relative group">
            <div className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center cursor-help transition-colors duration-200">
              <span className="text-gray-500 text-sm font-medium">?</span>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg py-3 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="space-y-2">
                <p className="font-medium">{tVerify('helpTitle')}</p>
                <ul className="space-y-1 text-gray-300">
                  <li>• {tVerify('checkSpam')}</li>
                  <li>• {tVerify('waitFewMinutes')}</li>
                  <li>• {tVerify('ensureCorrectEmail')}</li>
                </ul>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          </div>
        </div>
      </div>

      {/* 按钮区域 */}
      <div className="space-y-4">
        <Button
          label={
            isResending
              ? tVerify('sending')
              : cooldown > 0
                ? `Resend in ${formatCooldownTime()}`
                : tVerify('resendEmail')
          }
          onClick={() => runResend()}
          disabled={isResending || cooldown > 0}
          className="w-full"
        />
        
        {/* 我已验证按钮 */}
        <button
          onClick={handleGoToLogin}
          className="w-full px-6 py-3 text-airbnb bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 hover:border-rose-300 transition-all duration-200 font-medium"
        >
          {tVerify('iveVerifiedLogin')}
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
        {tVerify('backToForm')}
      </button>

      {(resendState.error) && (
        <div className="p-3 text-sm bg-red-100 text-red-600 rounded-lg">
          {resendState.error}
        </div>
      )}
    </div>
  );

  const content = (
    <>
      {currentStep === SignupStep.FORM ? renderFormStep() : renderEmailSentStep()}
    </>
  );

  return (
    <Modal
      title={t('signup')}
      open={signupModal.isOpen}
      onClose={signupModal.close}
      children={content}
    />
  );
}
