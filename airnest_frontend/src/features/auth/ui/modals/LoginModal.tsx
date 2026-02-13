'use client';

import { useState, useActionState, startTransition } from 'react';
import { useRouter } from '@i18n/navigation';
import { useLoginModal, useForgotPasswordModal } from '@auth/client/modalStore';
import Modal from '@sharedUI/Modal';
import Button from '@sharedUI/Button';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@auth/client/authStore';
import toast from 'react-hot-toast';
import { tokenService } from '@auth/client/tokenService';
import { ApiError } from '@auth/client/clientApiService';
import { useFavoritesStore } from '@/src/features/favorites/client/favoritesStore';

type LoginState = { ok: boolean; error: string | null };

export default function LoginModal() {
  const t = useTranslations('auth');
  const loginModal = useLoginModal();
  const forgotPasswordModal = useForgotPasswordModal();
  const router = useRouter();
  const { setAuthenticated } = useAuthStore();

  const initializeFavorites = useFavoritesStore(s => s.initializeFavorites);
  const clearFavorites      = useFavoritesStore(s => s.clearFavorites);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const handleForgotPassword = () => {
    loginModal.close();
    forgotPasswordModal.open();
  };

  const loginAction = async (_prev: LoginState): Promise<LoginState> => {
    const { email, password } = formData;
    if (!email || !password) return { ok: false, error: t('pleaseCompleteAllFields') };
    if (!validateEmail(email)) return { ok: false, error: t('invalidEmailFormat') };
  
    try {
      await tokenService.login(email, password);
      const session = await tokenService.checkSession();
      if (!session.valid || !session.userId) return { ok: false, error: t('loginError') };
  
      setAuthenticated(session.userId);
      clearFavorites();
      await initializeFavorites();
      toast.success(t('loginSuccess'));
      loginModal.close();
      router.refresh();
      return { ok: true, error: null };
    } catch (err) {
      const e = err as ApiError | Error;
      if ('statusCode' in e && e.statusCode === 400) return { ok: false, error: t('invalidCredentials') };
      if (e?.message?.toLowerCase?.().includes('verify')) {
        return { ok: false, error: t('emailNotVerified') };
      }
      return { ok: false, error: e?.message || t('loginError') };
    }
  };
  
  const [loginState, runLogin, isPending] = useActionState<LoginState>(loginAction, { ok: false, error: null });
  
  const handleSubmit = () => {
    setEmailError('');
    if (!validateEmail(formData.email)) {
      if (formData.email) setEmailError(t('invalidEmailFormat'));
    }
    startTransition(() => {
      runLogin();  
    }) 
  };

  const content = (
    <div className="flex flex-col gap-4">
      <h2 className="mb-4 text-2xl font-bold">{t('pleaseLogin')}</h2>

      {loginState.error && (
        <div className="p-3 text-sm bg-red-100 text-red-600 rounded-lg">
          {loginState.error}
        </div>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={e => { e.preventDefault(); handleSubmit(); }}
      >
        <div className="flex flex-col">
          <input
            type="email"
            placeholder={t('email')}
            value={formData.email}
            onChange={e => { setFormData(p => ({ ...p, email: e.target.value })); setEmailError(''); }}
            className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb ${emailError ? 'border-red-500' : ''}`}
            disabled={isPending}
          />
          {emailError && <span className="text-sm text-red-500 mt-1">{emailError}</span>}
        </div>

        <input
          type="password"
          placeholder={t('password')}
          value={formData.password}
          onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
          className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
          disabled={isPending}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-gray-600 hover:text-airbnb hover:underline transition-colors"
            disabled={isPending}
          >
            {t('forgotPassword')}
          </button>
        </div>

        <Button
          label={isPending ? t('loading') : t('login')}
          onClick={handleSubmit}
          disabled={isPending}
        />
      </form>
    </div>
  );

  return (
    <Modal
      title={t('login')}
      open={loginModal.isOpen}
      onClose={loginModal.close}
      children={content}
    />
  );
}
