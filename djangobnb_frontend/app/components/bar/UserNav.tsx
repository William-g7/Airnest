'use client'

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLoginModal } from "../hooks/useLoginModal";
import { useSignupModal } from "../hooks/useSignupModal";
import LogoutButton from "./LogoutButton";
import MenuLink from "./MenuLink";
import { useTranslations } from 'next-intl';

interface UserNavProps {
    userId: string | null;
}

const UserNav: React.FC<UserNavProps> = ({ userId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const loginModal = useLoginModal();
    const signupModal = useSignupModal();
    const router = useRouter();
    const t = useTranslations('navigation');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);

        const handleRouteChange = () => {
            setIsOpen(false);
        };

        window.addEventListener('popstate', handleRouteChange);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, [isOpen]);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative">
            <div
                className="p-2 relative inline-block border rounded-full cursor-pointer"
                onClick={handleMenuClick}
            >
                <button className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>

                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                </button>
            </div>

            <div
                className={`
                    absolute right-0 mt-3 w-[220px] bg-white border rounded-xl shadow-lg 
                    transition-all duration-300 ease-in-out transform
                    ${isOpen
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-[-10px] pointer-events-none'
                    }
                `}
            >
                {userId ? (
                    <>
                        <div className="py-2">
                            <MenuLink label={t('messages')} onClick={() => { setIsOpen(false); router.push('/inbox') }} />
                        </div>

                        <hr className="my-2" />

                        <div className="py-2">
                            <MenuLink label={t('myAccount')} onClick={() => {
                                setIsOpen(false);
                                if (userId) {
                                    router.push({
                                        pathname: '/myprofile/[id]',
                                        params: { id: userId }
                                    } as any);
                                }
                            }} />
                            <MenuLink label={t('myProperties')} onClick={() => {
                                setIsOpen(false);
                                router.push('/myproperties');
                            }} />
                            <MenuLink label={t('myReservations')} onClick={() => {
                                setIsOpen(false);
                                router.push('/myreservations');
                            }} />
                            <MenuLink label={t('myWishlists')} onClick={() => { setIsOpen(false); router.push('/mywishlists') }} />
                        </div>

                        <hr className="my-2" />

                        <div className="py-2">
                            <LogoutButton />
                        </div>
                    </>
                ) : (
                    <div className="py-1">
                        <MenuLink label={t('login')} onClick={() => { setIsOpen(false); loginModal.onOpen() }} />
                        <MenuLink label={t('register')} onClick={() => { setIsOpen(false); signupModal.onOpen() }} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserNav;