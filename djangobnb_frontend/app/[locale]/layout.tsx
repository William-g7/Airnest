import { NextIntlClientProvider } from 'next-intl';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import { locales } from '../../i18n/routing';

const inter = Inter({ subsets: ['latin'] });

type Props = {
    children: ReactNode;
    params: { locale: string };
};

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
            {children}
        </NextIntlClientProvider>
    );
} 