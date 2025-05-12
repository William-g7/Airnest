'use client'

import { handleLogout } from "@/app/auth/session";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';
import MenuLink from "./MenuLink";
import { useAuthStore } from "@/app/stores/authStore";
import { useFavoritesStore } from "@/app/stores/favoritesStore";
import toast from "react-hot-toast";

const LogoutButton: React.FC = () => {
    const router = useRouter();
    const t = useTranslations('navigation');
    const tAuth = useTranslations('auth');
    const { setUnauthenticated } = useAuthStore();
    const { clearFavorites } = useFavoritesStore();

    const onLogoutClick = () => {
        try {
            localStorage.removeItem('airnest-favorites');
        } catch (error) {
            console.error('Failed to clear favorites from localStorage:', error);
        }

        handleLogout()
            .then(() => {
                setUnauthenticated();
                clearFavorites();
                toast.success(tAuth('logoutSuccess'));
                router.push('/');
            })
            .catch((error) => {
                console.error('Logout error:', error);
                toast.error(error.message || tAuth('somethingWentWrong'));
            });
    };

    return (
        <MenuLink
            label={t('logout')}
            onClick={onLogoutClick}
        />
    );
};

export default LogoutButton;