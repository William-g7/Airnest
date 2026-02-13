import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import AuthProvider from '@auth/ui/AuthProvider';
import ErrorBoundary from '@errors/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import AuthStatusDetector from '@auth/ui/AuthStatusDetector';
import './globals.css';

// 整个应用的root layout, 定义全站通用的框架，样式与长期存活的提供器
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap', 
  preload: false,  
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono', 
  subsets: ['latin'],
  display: 'swap', 
  preload: false,  
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://airnest.com'),
  title: 'Airnest — Your Home Above the Ground',
  description:
    'Stay light, stay free, yet always feel at home. Find and book unique accommodations worldwide.',
  keywords: ['vacation rentals', 'holiday homes', 'apartment rentals', 'house rentals', 'airnest'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://media.airnest.me" crossOrigin="" />
        <link rel="dns-prefetch" href="https://media.airnest.me" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <Toaster position="top-center" />
          <AuthProvider>
            <ErrorBoundary>
              <AuthStatusDetector />
              {children}
            </ErrorBoundary>
          </AuthProvider>
      </body>
    </html>
  );
}
