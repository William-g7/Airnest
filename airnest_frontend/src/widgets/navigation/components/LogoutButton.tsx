'use client';

import { useRouter } from '@i18n/navigation';
import { useTranslations } from 'next-intl';
import MenuLink from '@navigation/components/MenuLink';
import { useAuthStore } from '@auth/client/authStore';
import { useFavoritesStore } from '@favorites/client/favoritesStore';
import toast from 'react-hot-toast';
import { tokenService } from '@auth/client/tokenService';

export default function LogoutButton(){
  const router = useRouter();
  const t = useTranslations('navigation');
  const tAuth = useTranslations('auth');
  const { setUnauthenticated } = useAuthStore();
  const { clearFavorites } = useFavoritesStore();

  const onLogoutClick = async () => {
    try {
      localStorage.removeItem('airnest-favorites');
    } catch (error) {
      console.error('Failed to clear favorites from localStorage:', error);
    }

    try{
      await tokenService.logout();
    } catch (error){
      console.error('Logout error:', error);
    }
      setUnauthenticated('logout');
      clearFavorites();
      toast.success(tAuth('logoutSuccess'));
      router.push('/');
  };

  return <MenuLink label={t('logout')} onClick={onLogoutClick} />;
};
