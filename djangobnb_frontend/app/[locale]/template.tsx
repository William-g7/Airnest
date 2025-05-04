import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Navbar from "../components/bar/Navbar";
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

export const metadata: Metadata = {
    title: "DjangoBnb - Your Home Away from Home",
    description: "Find and book unique accommodations worldwide. Choose from apartments, houses, and unique stays.",
    keywords: ["vacation rentals", "holiday homes", "apartment rentals", "house rentals"],
    openGraph: {
        type: 'website',
        title: 'DjangoBnb - Your Home Away from Home',
        description: 'Find and book unique accommodations worldwide',
        url: 'https://djangobnb.com',
        siteName: 'DjangoBnb',
        images: [{
            url: '/images/og-image.jpg',
            width: 1200,
            height: 630,
            alt: 'DjangoBnb - Your Home Away from Home'
        }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'DjangoBnb - Your Home Away from Home',
        description: 'Find and book unique accommodations worldwide',
        images: ['/images/twitter-card.jpg'],
        creator: '@djangobnb'
    },
    alternates: {
        canonical: 'https://djangobnb.com',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: 'your-google-verification-code',
    }
};

export default function Template({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <Navbar />
            <div className="pt-32">{children}</div>
            <Suspense fallback={<div>Loading...</div>}>
                <LoginModal />
                <SignupModal />
                <AddPropertyModal />
            </Suspense>
        </div>
    );
} 