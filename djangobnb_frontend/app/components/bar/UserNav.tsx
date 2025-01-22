'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useLoginModal } from "../hooks/useLoginModal";
import { useSignupModal } from "../hooks/useSignupModal";
import LogoutButton from "../buttons/LogoutButton";
import MenuLink from "./MenuLink";

interface UserNavProps {
    userId: string | null;
}

const UserNav: React.FC<UserNavProps> = ({ userId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const loginModal = useLoginModal();
    const signupModal = useSignupModal();
    const router = useRouter();

    return (
        <div className="relative">
            <div
                className="p-2 relative inline-block border rounded-full cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
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

            {isOpen && (

                <div className="absolute right-0 mt-2 w-[220px] bg-white border rounded-xl shadow-lg py-2">
                    {userId ? (
                        <>
                            <div className="py-2">
                                <MenuLink label="Messages" onClick={() => { setIsOpen(false); router.push('/messages') }} />
                                <MenuLink label="Notifications" onClick={() => { setIsOpen(false); router.push('/notifications') }} />
                                <MenuLink label="Trips" onClick={() => { setIsOpen(false); router.push('/trips') }} />
                                <MenuLink label="Wishlists" onClick={() => { setIsOpen(false); router.push('/wishlists') }} />
                            </div>

                            <hr className="my-2" />

                            <div className="py-2">
                                <MenuLink label="My Profile" onClick={() => { setIsOpen(false); router.push(`/myprofile/${userId}`) }} />
                            </div>

                            <hr className="my-2" />

                            <div className="py-2">
                                <LogoutButton />
                            </div>
                        </>
                    ) : (
                        <div className="py-1">
                            <MenuLink label="Login" onClick={() => { setIsOpen(false); loginModal.onOpen() }} />
                            <MenuLink label="Register" onClick={() => { setIsOpen(false); signupModal.onOpen() }} />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default UserNav;