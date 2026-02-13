'use client';

import { useTranslations } from 'next-intl';
import DatePickerDynamic from '@daysPicker/DayPickerDynamic';
import CurrencyDisplay from '@currency/ui/CurrencyDisplay';
import type { PropertyType } from '@properties/types/Property';
import { useBookedDates } from './useBookedDates';
import { useReservation } from './useReservation';

export default function ReservationSidebar({ property }: { property: PropertyType }) {
  const t = useTranslations('property');

  const { bookedDates, partiallyBookedDates } = useBookedDates(property.id);

  const tz =
    property.timezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone ??
    'UTC';

  const { dates, setDates, guests, setGuests, nights, totals, isSubmitting, handleReservation, } = useReservation({
    propertyId: property.id,
    pricePerNight: property.price_per_night,
    timeZone: tz
  });

  return (
    <aside className="mt-6 p-6 border border-gray-200 rounded-xl shadow-md">
      <div className="flex items-baseline mb-6">
        <span className="text-2xl font-bold">
          <CurrencyDisplay amount={property.price_per_night} />
        </span>
        <span className="text-lg text-gray-500 ml-2">{t('perNight')}</span>
      </div>

      <DatePickerDynamic
        checkIn={dates[0]}
        checkOut={dates[1]}
        onChange={(newDates) => setDates(newDates)}
        bookedDates={bookedDates}
        partiallyBookedDates={partiallyBookedDates}
        propertyTimezone={tz}
      />

      <div className="border-t border-gray-300 p-4">
        <label className="text-xs font-bold block mb-1">{t('guests').toUpperCase()}</label>
        <select
          className="w-full -ml-1 text-sm"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
        >
          {[...Array(property.guests)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>

      {dates[0] && dates[1] && (
        <>
          <div className="mt-4 space-y-4">
            <div className="flex justify-between">
              <span className="underline">
                <CurrencyDisplay amount={property.price_per_night} /> x {nights} {t('nights')}
              </span>
              <span><CurrencyDisplay amount={totals.subtotal} /></span>
            </div>
            <div className="flex justify-between">
              <span className="underline">{t('cleaningFee')}</span>
              <span><CurrencyDisplay amount={totals.cleaningFee} /></span>
            </div>
            <div className="flex justify-between">
              <span className="underline">{t('serviceFee')}</span>
              <span><CurrencyDisplay amount={totals.serviceFee} /></span>
            </div>
            <div className="flex justify-between">
              <span className="underline">{t('taxes')}</span>
              <span><CurrencyDisplay amount={totals.taxes} /></span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-300 flex justify-between font-bold">
            <span>{t('total')}</span>
            <span><CurrencyDisplay amount={totals.total} showOriginal /></span>
          </div>
        </>
      )}

      <button
        onClick={handleReservation}
        disabled={isSubmitting || !dates[0] || !dates[1]}
        className={`w-full bg-airbnb hover:bg-airbnb_dark text-white py-4 rounded-lg mt-6 font-semibold ${
          isSubmitting || !dates[0] || !dates[1] ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isSubmitting ? t('reserving') : t('reserve')}
      </button>
    </aside>
  );
}
