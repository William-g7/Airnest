import type { Metadata } from 'next';
import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import AuthProvider from './providers/AuthProvider';
import ErrorBoundaryProvider from './providers/ErrorBoundaryProvider';
import { Toaster } from 'react-hot-toast';
import AuthStatusDetector from './components/AuthStatusDetector';
import { ClientSideCsrfInitializer } from './components/security/CsrfInitializer';
import { NonceProvider } from './providers/NonceProvider';
import WebVitalsMonitor from './components/WebVitals';
import GoogleAnalytics from './components/GoogleAnalytics';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NonceProvider>
          <GoogleAnalytics />
          <ClientSideCsrfInitializer />
          <Toaster position="top-center" />
          <AuthProvider>
            <ErrorBoundaryProvider>
              <AuthStatusDetector />
              <WebVitalsMonitor />
              {children}
            </ErrorBoundaryProvider>
          </AuthProvider>
        </NonceProvider>
      </body>
    </html>
  );
}
