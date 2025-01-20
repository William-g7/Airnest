'use client'

import { handleLogout } from "@/app/auth/session";
import { useRouter } from "next/navigation";

import MenuLink from "../bar/MenuLink";

const LogoutButton: React.FC = () => {
    const router = useRouter();

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
            label="Log out"
            onClick={onLogoutClick}
        />
    );
};

export default LogoutButton;