import { NextIntlClientProvider } from 'next-intl';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import { locales } from '../../i18n/routing';
import { LocaleInitializer } from '../components/LocaleInitializer';
import ToasterProvider from '../providers/ToasterProvider';
import CurrencyProvider from '../providers/CurrencyProvider';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

const inter = Inter({ subsets: ['latin'] });

type Props = {
    children: ReactNode;
    params: { locale: string };
};


export async function generateMetadata({
    params: { locale }
}: {
    params: { locale: string }
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'app' });

    const siteTitle = `${t('name')} — ${t('slogan')}`;
    const siteDescription = `${t('subSlogan')}. ${t('description')}`;

    console.log('Locale:', locale);
    console.log('Translated slogan:', t('slogan'));

    return {
        title: siteTitle,
        description: siteDescription,
        keywords: ["vacation rentals", "holiday homes", "apartment rentals", "house rentals", "airnest"],
        openGraph: {
            type: 'website',
            title: siteTitle,
            description: siteDescription,
            url: 'https://airnest.com',
            siteName: t('name'),
            images: [{
                url: '/images/og-image.jpg',
                width: 1200,
                height: 630,
                alt: siteTitle
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: siteTitle,
            description: siteDescription,
            images: ['/images/twitter-card.jpg'],
            creator: '@airnest'
        },
        alternates: {
            canonical: 'https://airnest.com',
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
}
export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

async function getMessages(locale: string) {
    try {
        return (await import(`../../messages/${locale}.json`)).default;
    } catch (error) {
        console.error(`Failed to load messages for locale: ${locale}`, error);
        return (await import('../../messages/en.json')).default;
    }
}

export default async function LocaleLayout({
    children,
    params: { locale }
}: Props) {
    const messages = await getMessages(locale);

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <LocaleInitializer />
            <ToasterProvider />
            <CurrencyProvider>
                {children}
            </CurrencyProvider>
        </NextIntlClientProvider>
    );
} 