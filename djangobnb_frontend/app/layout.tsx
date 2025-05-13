import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "./providers/AuthProvider";
import ErrorBoundaryProvider from "./providers/ErrorBoundaryProvider";
import { Toaster } from "react-hot-toast";
import AuthStatusDetector from "./components/AuthStatusDetector";
import { ClientSideCsrfInitializer } from './components/security/CsrfInitializer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Airnest — Your Home Above the Ground",
  description: "Stay light, stay free, yet always feel at home. Find and book unique accommodations worldwide.",
  keywords: ["vacation rentals", "holiday homes", "apartment rentals", "house rentals", "airnest"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ClientSideCsrfInitializer />
        <Toaster position="top-center" />
        <AuthProvider>
          <ErrorBoundaryProvider>
            <AuthStatusDetector />
            {children}
          </ErrorBoundaryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
