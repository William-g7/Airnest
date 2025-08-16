'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLoginModal } from '../hooks/useLoginModal';
import { useSignupModal } from '../hooks/useSignupModal';
import LogoutButton from './LogoutButton';
import MenuLink from './MenuLink';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/app/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';

interface UserNavProps {
  userId: string | null;
}

const UserNav: React.FC<UserNavProps> = ({ userId: initialUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const loginModal = useLoginModal();
  const signupModal = useSignupModal();
  const router = useRouter();
  const t = useTranslations('navigation');
  const { userId: storeUserId, isAuthenticated } = useAuthStore();
  const userId = storeUserId || initialUserId;

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

  const showUserMenu = userId && isAuthenticated;
  return (
    <div className="relative">
      <div
        className="p-2 relative inline-block border rounded-full cursor-pointer transition-all duration-300 hover:bg-gray-100 hover:scale-105 active:scale-95 hover:shadow-sm"
        onClick={handleMenuClick}
      >
        <button className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{
              duration: 0.1,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="absolute right-0 mt-2 w-[180px] bg-white border rounded-xl shadow-lg z-50 overflow-hidden"
          >
            {showUserMenu ? (
              <>
                <div className="py-0.5">
                  <MenuLink
                    label={t('messages')}
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/inbox');
                    }}
                  />
                </div>

                <hr className="my-0.5" />

                <div className="py-0.5">
                  <MenuLink
                    label={t('myAccount')}
                    onClick={() => {
                      setIsOpen(false);
                      if (userId) {
                        router.push({
                          pathname: '/myprofile/[id]',
                          params: { id: userId },
                        } as any);
                      }
                    }}
                  />
                  <MenuLink
                    label={t('myProperties')}
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/myproperties');
                    }}
                  />
                  <MenuLink
                    label={t('myReservations')}
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/myreservations');
                    }}
                  />
                  <MenuLink
                    label={t('myWishlists')}
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/mywishlists');
                    }}
                  />
                </div>

                <hr className="my-0.5" />

                <div className="py-0.5">
                  <LogoutButton />
                </div>
              </>
            ) : (
              <div className="py-0.5">
                <MenuLink
                  label={t('login')}
                  onClick={() => {
                    setIsOpen(false);
                    loginModal.onOpen();
                  }}
                />
                <MenuLink
                  label={t('register')}
                  onClick={() => {
                    setIsOpen(false);
                    signupModal.onOpen();
                  }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserNav;
