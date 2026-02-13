'use client';

import {useMemo, useRef, useState, useEffect, startTransition} from 'react';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useSearchQuery} from '@search/hooks/useSearchQuery';
import DatePickerDynamic from '@daysPicker/DayPickerDynamic';
import {parseLocalISODate, formatDateYYYYMMDD} from '@/src/features/day-picker/dateUtils';

interface Props {
  onClose: () => void;
}

export default function SearchModal({onClose}: Props) {
  const t = useTranslations('search');
  const {state, replaceUrl, isPending} = useSearchQuery();

  // 本地受控输入 + 防抖
  const [locationInput, setLocationInput] = useState(state.location);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocationInput(state.location);
  }, [state.location]);

  const checkInDate = useMemo(() => (state.check_in ? parseLocalISODate(state.check_in) : null), [state.check_in]);
  const checkOutDate = useMemo(() => (state.check_out ? parseLocalISODate(state.check_out) : null), [state.check_out]);

  const onLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocationInput(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { 
      startTransition(() => replaceUrl({ location: v.trim() }));
    }, 500);
  };

  const onDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    const ci = start ? formatDateYYYYMMDD(start) : null;
    const co = end ? formatDateYYYYMMDD(end) : null;
    startTransition(() => replaceUrl({ check_in: ci, check_out: co }));
  };

  const onGuestsChange = (next: number) => {
    if (next >= 1) startTransition(() => replaceUrl({ guests: next }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-20 full-search-modal lg:hidden">
      <motion.div
        initial={{opacity: 0, y: 20, scale: 0.95}}
        animate={{opacity: 1, y: 0, scale: 1}}
        exit={{opacity: 0, y: 20, scale: 0.95}}
        transition={{duration: 0.3, ease: [0.23, 1, 0.32, 1]}}
        className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-auto p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={t('search')}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{t('search')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={t('closeModal')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Location */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">{t('whereTo')}</h3>
          <input
            type="text"
            value={locationInput}
            onChange={onLocationChange}
            placeholder={t('searchDestinations')}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
            autoFocus
          />
        </div>

        {/* Dates */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">{t('when')}</h3>
          <DatePickerDynamic
            checkIn={checkInDate}
            checkOut={checkOutDate}
            onChange={onDateChange}
            bookedDates={[]}
          />
        </div>

        {/* Guests */}
        <div className="mb-8">
          <h3 className="font-semibold mb-2">{t('whosComing')}</h3>
          <div className="flex items-center justify-between py-2">
            <span>{t('guest')}</span>
            <div className="flex items-center">
              <button
                onClick={() => onGuestsChange(Math.max(1, state.guests - 1))}
                className="w-8 h-8 flex items-center justify-center border rounded-full"
                aria-label={t('decrease')}
              >
                -
              </button>
              <span className="mx-3" aria-live="polite">{state.guests}</span>
              <button
                onClick={() => onGuestsChange(state.guests + 1)}
                className="w-8 h-8 flex items-center justify-center border rounded-full"
                aria-label={t('increase')}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          className="w-full py-3 bg-airbnb hover:bg-airbnb_dark transition text-white rounded-lg font-medium disabled:opacity-50"
          disabled={isPending}
          onClick={() => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            startTransition(() => replaceUrl({ location: locationInput.trim() }));
            onClose();
          }}
        >
          {t('search')}
        </button>
      </motion.div>
    </div>
  );
}
