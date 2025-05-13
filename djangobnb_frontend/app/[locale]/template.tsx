import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Navbar from "../components/bar/Navbar";
import NavbarWrapper from "../components/bar/NavbarWrapper";
import { Suspense, lazy, ReactNode } from 'react';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const LoginModal = lazy(() => import('../components/modals/LoginModal'));
const SignupModal = lazy(() => import('../components/modals/SignupModal'));
const AddPropertyModal = lazy(() => import('../components/modals/AddPropertyModal'));
const ScrollToTop = lazy(() => import('../components/common/ScrollToTop'));

export default function Template({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <NavbarWrapper>
                <Navbar />
            </NavbarWrapper>
            <div className="pt-[80px]">{children}</div>
            <Suspense fallback={<div>Loading...</div>}>
                <LoginModal />
                <SignupModal />
                <AddPropertyModal />
            </Suspense>
            <Suspense fallback={null}>
                <ScrollToTop />
            </Suspense>
        </div>
    );
} 