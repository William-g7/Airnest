'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Modal from './Modal';
import CustomButton from '../common/CustomButton';
import { useChangePasswordModal } from '../hooks/useChangePasswordModal';
import apiService from '@/app/services/apiService';
import toast from 'react-hot-toast';

interface PasswordRequirements {
  minLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
}

export default function ChangePasswordModal() {
  const t = useTranslations('auth');
  const changePasswordModal = useChangePasswordModal();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

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

  // 监听新密码变化，更新要求检查
  useEffect(() => {
    if (newPassword) {
      setPasswordRequirements(validatePassword(newPassword));
    } else {
      setPasswordRequirements({
        minLength: false,
        hasLowercase: false,
        hasUppercase: false,
        hasNumber: false,
      });
    }
  }, [newPassword]);

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    changePasswordModal.onClose();
  };

  const handleSubmit = async () => {
    // 清除之前的错误
    setErrors({});
    
    // 验证表单
    let hasErrors = false;
    const newErrors: typeof errors = {};

    if (!currentPassword) {
      newErrors.currentPassword = t('pleaseCompleteAllFields');
      hasErrors = true;
    }

    if (!newPassword) {
      newErrors.newPassword = t('pleaseCompleteAllFields');
      hasErrors = true;
    } else if (!isPasswordValid()) {
      newErrors.newPassword = t('passwordNotStrongEnough');
      hasErrors = true;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('pleaseCompleteAllFields');
      hasErrors = true;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('passwordsNotMatch');
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await apiService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (response.success) {
        toast.success(t('passwordChangeSuccess'));
        handleClose();
      } else {
        toast.error(response.message || t('passwordChangeFailed'));
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.current_password) {
          setErrors({ currentPassword: errorData.current_password[0] });
        } else if (errorData.new_password) {
          setErrors({ newPassword: errorData.new_password[0] });
        } else if (errorData.message) {
          toast.error(errorData.message);
        } else {
          toast.error(t('passwordChangeFailed'));
        }
      } else {
        toast.error(t('passwordChangeFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* 当前密码 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('currentPassword')}
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb ${
            errors.currentPassword ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={t('enterCurrentPassword')}
          disabled={isLoading}
        />
        {errors.currentPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
        )}
      </div>

      {/* 新密码 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('newPassword')}
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb ${
            errors.newPassword ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={t('enterNewPassword')}
          disabled={isLoading}
        />
        
        {/* 密码强度指示器 */}
        {newPassword && (
          <div className="mt-2 space-y-1">
            <div className={`text-xs flex items-center ${passwordRequirements.minLength ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="mr-2">{passwordRequirements.minLength ? '✓' : '○'}</span>
              {t('passwordMinLength')}
            </div>
            <div className={`text-xs flex items-center ${passwordRequirements.hasLowercase ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="mr-2">{passwordRequirements.hasLowercase ? '✓' : '○'}</span>
              {t('passwordHasLowercase')}
            </div>
            <div className={`text-xs flex items-center ${passwordRequirements.hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="mr-2">{passwordRequirements.hasUppercase ? '✓' : '○'}</span>
              {t('passwordHasUppercase')}
            </div>
            <div className={`text-xs flex items-center ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="mr-2">{passwordRequirements.hasNumber ? '✓' : '○'}</span>
              {t('passwordHasNumber')}
            </div>
          </div>
        )}
        
        {errors.newPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
        )}
      </div>

      {/* 确认新密码 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('confirmNewPassword')}
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb ${
            errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={t('confirmNewPassword')}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      {/* 提交按钮 */}
      <div className="pt-4">
        <CustomButton 
          label={isLoading ? t('changing') : t('changePassword')}
          onClick={handleSubmit}
          disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || !isPasswordValid() || newPassword !== confirmPassword}
          className="w-full"
        />
      </div>
    </div>
  );

  return (
    <Modal
      label={t('changePassword')}
      isOpen={changePasswordModal.isOpen}
      close={handleClose}
      content={content}
    />
  );
}