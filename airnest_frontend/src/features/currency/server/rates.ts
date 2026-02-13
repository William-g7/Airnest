import 'server-only';
import type { Rates } from '@currency/utils/shared';

const ENDPOINT = 'https://api.exchangerate-api.com/v4/latest/USD';
const REVALIDATE_SECONDS = 60 * 60 * 12;

export async function getServerRates(): Promise<Rates> {
  const res = await fetch(ENDPOINT, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) return { USD: 1, CNY: 7.2, EUR: 0.93 };
  const data = await res.json();
  return data?.rates ?? { USD: 1, CNY: 7.2, EUR: 0.93 };
}