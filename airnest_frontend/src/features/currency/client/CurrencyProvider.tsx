'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useLocale } from 'next-intl';
import type { Rates } from '@currency/utils/shared';
import { getCurrencyForLocale } from '@currency/utils/shared';

interface CurrencyContextType {
  rates: Rates | null;
  isLoading: boolean;
  currentCurrency: string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  rates: null,
  isLoading: true,
  currentCurrency: 'USD'
});

export const useCurrency = () => useContext(CurrencyContext);

type Props = {
  children: ReactNode;
  initialRates?: Rates;
  initialCurrency?: string;
};

export default function CurrencyProvider({ children, initialRates, initialCurrency }: Props) {
  const locale = useLocale();
  const [rates, setRates] = useState<Rates | null>(initialRates ?? null);
  const [isLoading, setIsLoading] = useState(!initialRates);
  const currentCurrency = initialCurrency ?? getCurrencyForLocale(locale);

  useEffect(() => {
    // 首屏已注入则不再请求；否则走 BFF，并做本地缓存
    if (rates) return;

    const cached = localStorage.getItem('exchangeRates');
    const ts = localStorage.getItem('exchangeRatesTime');
    const fresh = cached && ts && Date.now() - parseInt(ts) < 86_400_000;

    if (fresh) {
      setRates(JSON.parse(cached));
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/currency/rates', { cache: 'no-store' });
        const json = await res.json();
        if (json?.rates) {
          setRates(json.rates);
          localStorage.setItem('exchangeRates', JSON.stringify(json.rates));
          localStorage.setItem('exchangeRatesTime', Date.now().toString());
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [rates]);

  return (
    <CurrencyContext.Provider value={{ rates, isLoading, currentCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}
