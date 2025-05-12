'use client';

import { useFormatter } from 'next-intl';
import { convertCurrency } from '@/app/services/currencyService';
import { useCurrency } from '@/app/providers/CurrencyProvider';

interface CurrencyDisplayProps {
    amount: number;
    showOriginal?: boolean;
    className?: string;
}

export const CurrencyDisplay = ({
    amount,
    showOriginal = false,
    className = '',
}: CurrencyDisplayProps) => {
    const formatter = useFormatter();
    const { rates, isLoading, currentCurrency } = useCurrency();

    if (isLoading) {
        return (
            <span className={className}>
                {formatter.number(amount, { style: 'currency', currency: 'USD' })}
            </span>
        );
    }

    const convertedAmount = rates
        ? convertCurrency(amount, 'USD', currentCurrency, rates)
        : amount;

    return (
        <span className={className}>
            {formatter.number(convertedAmount, {
                style: 'currency',
                currency: currentCurrency
            })}

            {showOriginal && currentCurrency !== 'USD' && (
                <span className="text-xs text-gray-500 ml-1">
                    ({formatter.number(amount, { style: 'currency', currency: 'USD' })})
                </span>
            )}
        </span>
    );
};

export default CurrencyDisplay; 