'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import apiService from '@/app/services/apiService';
import CustomButton from '@/app/components/forms/CustomButton';
import toast from 'react-hot-toast';

function ResendVerificationContent() {
  const t = useTranslations('emailVerification');
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get('email');
  
  const [email, setEmail] = useState(emailFromUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);

  // 冷却时间倒计时
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 检查本地存储的上次发送时间
  useEffect(() => {
    if (email) {
      const lastSent = localStorage.getItem(`lastVerificationSent_${email}`);
      if (lastSent) {
        const timePassed = Date.now() - parseInt(lastSent);
        const cooldownTime = 120000; // 2分钟冷却时间
        if (timePassed < cooldownTime) {
          setCooldown(Math.ceil((cooldownTime - timePassed) / 1000));
          setLastSentTime(parseInt(lastSent));
        }
      }
    }
  }, [email]);

  const handleSendVerification = async () => {
    if (!email) {
      toast.error(t('pleaseEnterEmail'));
      return;
    }

    if (cooldown > 0) {
      toast.error(t('pleaseWaitBeforeResending'));
      return;
    }

    try {
      setIsLoading(true);

      await apiService.sendVerificationEmail({
        email: email,
        verification_type: 'registration',
        language: 'en' // TODO: 获取当前语言
      });

      // 记录发送时间
      const currentTime = Date.now();
      localStorage.setItem(`lastVerificationSent_${email}`, currentTime.toString());
      setLastSentTime(currentTime);
      setCooldown(120); // 2分钟冷却

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

  const formatCooldownTime = () => {
    const minutes = Math.floor(cooldown / 60);
    const seconds = cooldown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            {t('resendVerificationEmail')}
          </h1>

          <p className="text-gray-600 mt-2">
            {t('resendVerificationDescription')}
          </p>
        </div>

        <div className="mt-6">
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('emailAddress')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('enterEmailAddress')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {lastSentTime && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                {t('lastSentAt')}: {new Date(lastSentTime).toLocaleString()}
              </p>
            </div>
          )}

          <CustomButton
            label={
              isLoading 
                ? t('sending') 
                : cooldown > 0 
                  ? `${t('resendIn')} ${formatCooldownTime()}`
                  : t('sendVerificationEmail')
            }
            onClick={handleSendVerification}
            disabled={isLoading || cooldown > 0 || !email}
          />

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {t('alreadyVerified')}{' '}
              <button
                onClick={() => router.push('/')}
                className="text-airbnb hover:underline"
              >
                {t('goToLogin')}
              </button>
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <p className="mb-2">{t('troubleshooting')}:</p>
              <ul className="space-y-1">
                <li>• {t('checkSpamFolder')}</li>
                <li>• {t('waitFewMinutes')}</li>
                <li>• {t('checkEmailSpelling')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResendVerificationPage() {
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
      <ResendVerificationContent />
    </Suspense>
  );
}