'use client'

import { useState } from "react";
import Link from "next/link";

const UserNav = () => {
    const [isOpen, setIsOpen] = useState(false);

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
                    <div className="py-2">
                        <Link href="/messages" className="px-4 py-2 hover:bg-gray-100 block">
                            Messages
                            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-2">1</span>
                        </Link>
                        <Link href="/notifications" className="px-4 py-2 hover:bg-gray-100 block">
                            Notifications
                            <span className="bg-red-500 w-2 h-2 rounded-full inline-block ml-2"></span>
                        </Link>
                        <Link href="/trips" className="px-4 py-2 hover:bg-gray-100 block">Trips</Link>
                        <Link href="/wishlists" className="px-4 py-2 hover:bg-gray-100 block">Wishlists</Link>
                    </div>

                    <hr className="my-2" />

                    <div className="py-2">
                        <Link href="/host" className="px-4 py-2 hover:bg-gray-100 block">Airbnb your home</Link>
                        <Link href="/host/experience" className="px-4 py-2 hover:bg-gray-100 block">Host an experience</Link>
                        <Link href="/account" className="px-4 py-2 hover:bg-gray-100 block">Account</Link>
                    </div>

                    <hr className="my-2" />

                    <div className="py-2">
                        <Link href="/gift-cards" className="px-4 py-2 hover:bg-gray-100 block">Gift cards</Link>
                        <Link href="/help" className="px-4 py-2 hover:bg-gray-100 block">Help Centre</Link>
                        <button className="w-full text-left px-4 py-2 hover:bg-gray-100">Log out</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserNav;