'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { getExchangeRates, getCurrencyForLocale } from '@/app/services/currencyService';

interface CurrencyContextType {
    rates: Record<string, number> | null;
    isLoading: boolean;
    currentCurrency: string;
}

const CurrencyContext = createContext<CurrencyContextType>({
    rates: null,
    isLoading: true,
    currentCurrency: 'USD',
});

export const useCurrency = () => useContext(CurrencyContext);

interface CurrencyProviderProps {
    children: ReactNode;
}

export const CurrencyProvider = ({ children }: CurrencyProviderProps) => {
    const [rates, setRates] = useState<Record<string, number> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const locale = useLocale();
    const currentCurrency = getCurrencyForLocale(locale);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const exchangeRates = await getExchangeRates();
                setRates(exchangeRates);
            } catch (error) {
                console.error('Error fetching exchange rates:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRates();
    }, []);

    const value = {
        rates,
        isLoading,
        currentCurrency,
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export default CurrencyProvider; 