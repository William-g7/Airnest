import { NextIntlClientProvider } from 'next-intl';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import { locales } from '../../i18n/routing';

// 引入字体
const inter = Inter({ subsets: ['latin'] });

// 类型定义
type Props = {
    children: ReactNode;
    params: { locale: string };
};

// 生成元数据
export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

// 动态加载语言资源
async function getMessages(locale: string) {
    try {
        return (await import(`../../messages/${locale}.json`)).default;
    } catch (error) {
        console.error(`Failed to load messages for locale: ${locale}`, error);
        // 出错时使用英文作为回退
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