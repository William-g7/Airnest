'use client'

import { handleLogout } from "@/app/auth/session";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';
import MenuLink from "./MenuLink";

const LogoutButton: React.FC = () => {
    const router = useRouter();
    const t = useTranslations('navigation');
    const onLogoutClick = () => {
        handleLogout()
            .then(() => {
                router.push('/');
            })
            .catch((error) => {
                console.error('Logout error:', error);
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