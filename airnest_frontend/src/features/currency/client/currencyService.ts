'use client';

import type { Rates } from '@currency/utils/shared';

const CACHE_KEY = 'exchangeRates';
const CACHE_TS  = 'exchangeRatesTime';
const TTL = 86_400_000;

export async function getExchangeRatesClient(): Promise<Rates> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const ts = localStorage.getItem(CACHE_TS);
    if (cached && ts && Date.now() - Number(ts) < TTL) {
      return JSON.parse(cached);
    }
  } catch {}

  const res = await fetch('/api/currency/rates', { cache: 'no-store' });
  const json = await res.json();
  const rates: Rates = json?.rates ?? { USD: 1, CNY: 7.2, EUR: 0.93 };

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
    localStorage.setItem(CACHE_TS, Date.now().toString());
  } catch {}

  return rates;
}
