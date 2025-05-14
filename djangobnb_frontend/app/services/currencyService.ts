const BASE_CURRENCY = 'USD';

export const CURRENCY_LOCALE_MAP: Record<string, string> = {
  USD: 'en',
  CNY: 'zh',
  EUR: 'fr',
};

export function getCurrencyForLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    en: 'USD',
    zh: 'CNY',
    fr: 'EUR',
  };
  return localeMap[locale] || 'USD';
}

async function fetchRatesFromAPI(): Promise<Record<string, number>> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();

    if (data.rates) {
      return data.rates;
    }
    throw new Error('Cannot acquire currency data.');
  } catch (error) {
    console.error('Fetch currency failed:', error);
    return {
      USD: 1,
      CNY: 7.2,
      EUR: 0.93,
    };
  }
}

export async function getExchangeRates(): Promise<Record<string, number>> {
  const cachedRates = localStorage.getItem('exchangeRates');
  const cacheTime = localStorage.getItem('exchangeRatesTime');

  if (cachedRates && cacheTime && Date.now() - parseInt(cacheTime) < 86400000) {
    return JSON.parse(cachedRates);
  }

  const rates = await fetchRatesFromAPI();

  localStorage.setItem('exchangeRates', JSON.stringify(rates));
  localStorage.setItem('exchangeRatesTime', Date.now().toString());

  return rates;
}

export function convertCurrency(
  amount: number,
  fromCurrency: string = BASE_CURRENCY,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency || !rates) {
    return amount;
  }

  if (!rates[fromCurrency] || !rates[toCurrency]) {
    return amount;
  }

  const amountInUSD = fromCurrency === BASE_CURRENCY ? amount : amount / rates[fromCurrency];

  return amountInUSD * rates[toCurrency];
}
