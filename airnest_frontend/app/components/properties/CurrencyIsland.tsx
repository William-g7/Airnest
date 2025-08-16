'use client';

import { useMemo } from 'react';
import { useLocaleStore } from '@/app/stores/localeStore';

interface CurrencyIslandProps {
  amount: number;
  className?: string;
}

export function CurrencyIsland({ amount, className = "" }: CurrencyIslandProps) {
  const { locale } = useLocaleStore();
  
  const formattedAmount = useMemo(() => {
    const currencyMap: Record<string, { currency: string; locale: string }> = {
      'en': { currency: 'USD', locale: 'en-US' },
      'zh': { currency: 'CNY', locale: 'zh-CN' },
      'fr': { currency: 'EUR', locale: 'fr-FR' },
    };
    
    const config = currencyMap[locale] || currencyMap['en'];
    
    try {
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      return `$${amount}`;
    }
  }, [amount, locale]);

  return <span className={className}>{formattedAmount}</span>;
}