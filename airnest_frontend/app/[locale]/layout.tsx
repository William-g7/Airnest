import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {locales} from '@i18n/routing';
import ToasterProvider from '@sharedUI/toast/ToasterProvider';
import CurrencyProvider from '@currency/client/CurrencyProvider';
import type {ReactNode} from 'react';

// 处理与 locale 参数相关的上下文，并在同一语言内持久存在。
export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>; 
}) {
  const { locale } = await params;
  const messages = await getMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ToasterProvider />
      <CurrencyProvider>{children}</CurrencyProvider>
    </NextIntlClientProvider>
  );
}
