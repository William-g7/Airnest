import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import Navbar from '@navigation/components/Navbar';
import NavbarWrapper from '@navigation/components/NavbarWrapper';
import { Suspense, lazy, ReactNode } from 'react';

// 定义了所有需要在页面跳转时复位的UI
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const LoginModal = lazy(() => import('@auth/ui/modals/LoginModal'));
const SignupModal = lazy(() => import('@auth/ui/modals/SignupModal'));
const ForgotPasswordModal = lazy(() => import('@auth/ui/modals/ForgotPasswordModal'));
const ChangePasswordModal = lazy(() => import('@auth/ui/modals/ChangePasswordModal'));
const AddPropertyModal = lazy(() => import('@addProperty/AddPropertyModal'));
const ScrollToTop = lazy(() => import('@sharedUI/ScrollToTop'));

export default function Template({ children }: { children: ReactNode }) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <NavbarWrapper>
        <Navbar />
      </NavbarWrapper>
      <div style={{ paddingTop: 'var(--nav-h, 80px)' }}>{children}</div>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginModal />
        <SignupModal />
        <ForgotPasswordModal />
        <ChangePasswordModal />
        <AddPropertyModal />
      </Suspense>
      <Suspense fallback={<div>Loading...</div>}>
        <ScrollToTop />
      </Suspense>
    </div>
  );
}
