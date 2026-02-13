'use client';

import {useMemo} from 'react';
import {useLocale, useFormatter} from 'next-intl';

type Props = { amount: number; className?: string };

export function CurrencyIsland({amount, className = ''}: Props) {
  const locale = useLocale();
  const format = useFormatter();

  const currencyByLocale: Record<string, string> = {
    en: 'USD',
    zh: 'CNY',
    fr: 'EUR'
  };
  const currency = currencyByLocale[locale] ?? 'USD';

  const formatted = useMemo(() => {
    if (!Number.isFinite(amount)) return '';
    return format.number(amount, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }, [amount, currency, format]);

  return <span className={className}>{formatted}</span>;
}
