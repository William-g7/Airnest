export type Rates = Record<string, number>;

export const BASE_CURRENCY = 'USD' as const;

export const localeToCurrency: Record<string, string> = {
  en: 'USD',
  zh: 'CNY',
  fr: 'EUR'
};

export function getCurrencyForLocale(locale: string): string {
  return localeToCurrency[locale] ?? 'USD';
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Rates
): number {
  if (!rates || fromCurrency === toCurrency) return amount;
  const from = rates[fromCurrency];
  const to = rates[toCurrency];
  if (!from || !to) return amount;
  const inUSD = fromCurrency === BASE_CURRENCY ? amount : amount / from;
  return Math.round(inUSD * to * 100) / 100;
}