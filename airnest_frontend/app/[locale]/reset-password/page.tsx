'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import apiService from '@/app/services/apiService';
import CustomButton from '@/app/components/forms/CustomButton';
import toast from 'react-hot-toast';
import { useLoginModal } from '@/app/components/hooks/useLoginModal';

interface ResetPasswordState {
  tokenVerified: boolean;
  loading: boolean;
  success: boolean;
  error: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

interface PasswordRequirements {
  minLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
}

function ResetPasswordContent() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginModal = useLoginModal();
  
  const [state, setState] = useState<ResetPasswordState>({
    tokenVerified: false,
    loading: true,
    success: false,
    error: '',
  });
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
  });
  const [isResetting, setIsResetting] = useState(false);
  const [hasVerifiedToken, setHasVerifiedToken] = useState(false);
  const [resetToken, setResetToken] = useState<string>('');

  // 验证密码强度
  const validatePassword = (pwd: string): PasswordRequirements => {
    return {
      minLength: pwd.length >= 8,
      hasLowercase: /[a-z]/.test(pwd),
      hasUppercase: /[A-Z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
    };
  };

  // 检查密码是否符合所有要求
  const isPasswordValid = (): boolean => {
    const requirements = passwordRequirements;
    return requirements.minLength && 
           requirements.hasLowercase && 
           requirements.hasUppercase && 
           requirements.hasNumber;
  };

  useEffect(() => {
    // 只在组件首次挂载时运行一次
    if (hasVerifiedToken) return;

    const performTokenVerification = async () => {
      // 获取token
      let tokenToUse = searchParams.get('token');
      
      // 如果searchParams为空，尝试从URL直接获取
      if (!tokenToUse && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        tokenToUse = urlParams.get('token');
      }
      
      if (!tokenToUse) {
        setState({
          tokenVerified: false,
          loading: false,
          success: false,
          error: t('resetTokenMissing') || 'No reset token provided',
        });
        return;
      }

      setResetToken(tokenToUse);
      setHasVerifiedToken(true);
      
      // 验证token
      try {
        setState(prev => ({ ...prev, loading: true, error: '' }));

        const response = await apiService.verifyResetToken(tokenToUse);

        if (response.success) {
          setState({
            tokenVerified: true,
            loading: false,
            success: false,
            error: '',
            user: response.user,
          });
        } else {
          setState({
            tokenVerified: false,
            loading: false,
            success: false,
            error: response.message || t('resetTokenInvalid') || 'Invalid reset token',
          });
        }
      } catch (error: any) {
        console.error('Token verification error:', error);
        
        let errorMessage = t('resetTokenInvalid') || 'Invalid reset token';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        setState({
          tokenVerified: false,
          loading: false,
          success: false,
          error: errorMessage,
        });
      }
    };

    performTokenVerification();
  }, []);

  // 监听密码变化，更新要求检查
  useEffect(() => {
    if (password) {
      setPasswordRequirements(validatePassword(password));
    } else {
      setPasswordRequirements({
        minLength: false,
        hasLowercase: false,
        hasUppercase: false,
        hasNumber: false,
      });
    }
  }, [password]);

  const handleResetPassword = async () => {
    if (!isPasswordValid()) {
      toast.error(t('passwordNotStrongEnough') || 'Password does not meet requirements');
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('passwordsNotMatch') || 'Passwords do not match');
      return;
    }

    try {
      setIsResetting(true);

      const response = await apiService.resetPassword({
        token: resetToken,
        password: password,
      });

      if (response.success) {
        setState(prev => ({
          ...prev,
          success: true,
          error: '',
        }));
        toast.success(t('passwordResetSuccess') || 'Password reset successful');
      } else {
        toast.error(response.message || t('resetPasswordFailed') || 'Password reset failed');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = t('resetPasswordFailed') || 'Password reset failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/');
    // 延迟一小段时间让页面加载完成后再打开登录模态框
    setTimeout(() => {
      loginModal.onOpen();
    }, 100);
  };

  // 加载状态
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-airbnb mx-auto"></div>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">
              {t('verifyingResetToken') || 'Verifying Reset Token'}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('pleaseWait') || 'Please wait...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 成功状态
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
              {t('passwordResetSuccessTitle') || 'Password Reset Successful!'}
            </h1>
            
            <p className="text-gray-600 mt-2">
              {t('passwordResetSuccessDesc') || 'Your password has been successfully reset. You can now log in with your new password.'}
            </p>

            <div className="mt-6">
              <CustomButton
                label={t('goToLogin') || 'Go to Login'}
                onClick={handleGoToLogin}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Token验证失败状态
  if (!state.tokenVerified) {
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
              {t('resetTokenExpired') || 'Reset Link Invalid'}
            </h1>
            
            <p className="text-gray-600 mt-2">
              {state.error}
            </p>

            <div className="mt-6 space-y-3">
              <CustomButton
                label={t('requestNewReset') || 'Request New Reset'}
                onClick={() => router.push('/')}
                className="w-full"
              />
              
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
              >
                {t('backToHome') || 'Back to Home'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 密码重置表单
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            {t('setNewPassword') || 'Set New Password'}
          </h1>
          
          <p className="text-gray-600 mt-2">
            {t('setNewPasswordDesc') || 'Please enter your new password below'}
          </p>

          {state.user && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>{t('account') || 'Account'}:</strong> {state.user.email}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* 新密码输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('newPassword') || 'New Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
              placeholder={t('enterNewPassword') || 'Enter new password'}
              disabled={isResetting}
            />
            
            {/* 密码强度指示器 */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className={`text-xs flex items-center ${passwordRequirements.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordRequirements.minLength ? '✓' : '○'}</span>
                  {t('passwordMinLength') || 'At least 8 characters'}
                </div>
                <div className={`text-xs flex items-center ${passwordRequirements.hasLowercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordRequirements.hasLowercase ? '✓' : '○'}</span>
                  {t('passwordHasLowercase') || 'Contains lowercase letter'}
                </div>
                <div className={`text-xs flex items-center ${passwordRequirements.hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordRequirements.hasUppercase ? '✓' : '○'}</span>
                  {t('passwordHasUppercase') || 'Contains uppercase letter'}
                </div>
                <div className={`text-xs flex items-center ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordRequirements.hasNumber ? '✓' : '○'}</span>
                  {t('passwordHasNumber') || 'Contains number'}
                </div>
              </div>
            )}
          </div>

          {/* 确认密码输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('confirmNewPassword') || 'Confirm New Password'}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb ${
                confirmPassword && password !== confirmPassword ? 'border-red-300' : ''
              }`}
              placeholder={t('confirmNewPassword') || 'Confirm new password'}
              disabled={isResetting}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {t('passwordsNotMatch') || 'Passwords do not match'}
              </p>
            )}
          </div>

          {/* 重置按钮 */}
          <CustomButton
            label={isResetting ? (t('resetting') || 'Resetting...') : (t('resetPasswordButton') || 'Reset Password')}
            onClick={handleResetPassword}
            disabled={isResetting || !isPasswordValid() || password !== confirmPassword}
            className="w-full"
          />

          {/* 返回登录 */}
          <button
            onClick={handleGoToLogin}
            className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
            disabled={isResetting}
          >
            {t('backToLogin') || 'Back to Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}