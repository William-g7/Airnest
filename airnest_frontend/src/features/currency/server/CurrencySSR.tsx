import 'server-only';
import { getServerRates } from '@currency/server/rates';
import { BASE_CURRENCY, getCurrencyForLocale, convertCurrency } from '@currency/utils/shared';


type Props = {
  amountUSD: number;           // 后端价格以 USD 存储
  locale: string;              // 传入页面的 locale
  className?: string;
  showOriginal?: boolean;
};

export default async function CurrencySSR({ amountUSD, locale, className = '', showOriginal = false }: Props) {
  const [rates] = await Promise.all([getServerRates()]);
  const currency = getCurrencyForLocale(locale);
  const converted = convertCurrency(amountUSD, BASE_CURRENCY, currency, rates);

  const fmt = new Intl.NumberFormat(locale, { style: 'currency', currency });
  const fmtUSD = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' });

  return (
    <span className={className}>
      {fmt.format(converted)}
      {showOriginal && currency !== 'USD' && (
        <span className="text-xs text-gray-500 ml-1">
          ({fmtUSD.format(amountUSD)})
        </span>
      )}
    </span>
  );
}
