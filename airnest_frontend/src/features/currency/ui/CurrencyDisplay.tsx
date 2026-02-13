'use client';

import { useMemo } from 'react';
import { useFormatter } from 'next-intl';
import { useCurrency } from '@currency/client/CurrencyProvider';
import { convertCurrency, BASE_CURRENCY } from '@currency/utils/shared';

type CurrencyDisplayProps = {
  amount: number | string;
  fromCurrency?: string;
  showOriginal?: boolean;
  className?: string;
};

export default function CurrencyDisplay({
  amount,
  fromCurrency = BASE_CURRENCY,
  showOriginal = false,
  className = ''
}: CurrencyDisplayProps) {
  const formatter = useFormatter();
  const { rates, isLoading, currentCurrency } = useCurrency();

  // 1) 先解析为 number
  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
  const safeAmount = Number.isFinite(parsed) ? parsed : 0;

  // 2) 有汇率则换算；若结果不是有限数，回退到原价
  const converted = useMemo(() => {
    if (!rates) return safeAmount;
    const v = convertCurrency(safeAmount, fromCurrency, currentCurrency, rates);
    return Number.isFinite(v) ? v : safeAmount;
  }, [rates, safeAmount, fromCurrency, currentCurrency]);

  // 3) 加载中 → 直接显示原价原币种，避免“换了符号没换值”的错觉
  if (isLoading) {
    return (
      <span className={className}>
        {formatter.number(safeAmount, { style: 'currency', currency: fromCurrency })}
      </span>
    );
  }

  return (
    <span className={className}>
      {formatter.number(converted, { style: 'currency', currency: currentCurrency })}
      {showOriginal && currentCurrency !== fromCurrency && (
        <span className="text-xs text-gray-500 ml-1">
          ({formatter.number(safeAmount, { style: 'currency', currency: fromCurrency })})
        </span>
      )}
    </span>
  );
}
