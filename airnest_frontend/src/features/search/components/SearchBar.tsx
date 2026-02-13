'use client';

import {useEffect, useRef, useState, useCallback, startTransition} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useSearchQuery} from '@search/hooks/useSearchQuery';
import DatePickerDynamic from '@daysPicker/DayPickerDynamic';
import {formatDateYYYYMMDD, parseLocalISODate} from '@daysPicker/dateUtils';

export default function SearchBar() {
  const t = useTranslations('search');
  const {state, replaceUrl, isPending} = useSearchQuery();
  const formRef = useRef<HTMLFormElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const [activeField, setActiveField] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState(state.location);
  const [isLocationDebouncing, setIsLocationDebouncing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 展示用日期格式：e.g. "Apr 5"
  const fmtDisplay = (ymd: string | null) =>
    ymd
      ? parseLocalISODate(ymd).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })
      : t('addDate');

  // URL → 输入框
  useEffect(() => {
    setLocationInput(state.location);
  }, [state.location]);

  // 防抖提交地点
  const debouncedUpdateLocation = useCallback(
    (value: string) => {
      setIsLocationDebouncing(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        startTransition(() => { replaceUrl({ location: value.trim() }); });
        setIsLocationDebouncing(false);
      }, 500);
    },
    [replaceUrl]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const onLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocationInput(v);
    debouncedUpdateLocation(v);
  };

  const onDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    const check_in  = start ? formatDateYYYYMMDD(start) : null;
    const check_out = end   ? formatDateYYYYMMDD(end)   : null;
    startTransition(() => replaceUrl({ check_in, check_out }));
  };

  const onGuestsChange = (delta: number) => {
    const next = Math.max(1, Math.min(20, state.guests + delta));
    startTransition(() => replaceUrl({ guests: next }));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      startTransition(() => replaceUrl({ location: locationInput.trim() }));
      setActiveField(null);
    }
    if (e.key === 'Escape') setActiveField(null);
  };

  // 点击外部关闭 popover
  useEffect(() => {
    const handler = (evt: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(evt.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form ref={formRef} className="relative bg-white rounded-full shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center divide-x divide-gray-200">
          {/* 地点 */}
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={() => setActiveField(activeField === 'where' ? null : 'where')}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="text-xs font-semibold text-gray-900 mb-1">{t('where')}</div>
              <div className="text-sm text-gray-600">{locationInput || t('anywhere')}</div>
            </button>

            <AnimatePresence>
              {activeField === 'where' && (
                <motion.div
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, y: 10}}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border z-50"
                >
                  <div className="p-4">
                    <input
                      ref={locationInputRef}
                      type="text"
                      value={locationInput}
                      onChange={onLocationChange}
                      onKeyDown={onKeyDown}
                      placeholder={t('searchDestination')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb focus:border-transparent"
                      autoFocus
                    />
                    {isLocationDebouncing && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center">
                        <div className="animate-spin w-3 h-3 border border-gray-300 border-t-airbnb rounded-full mr-2" />
                        {t('searching')}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 入住 */}
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={() => setActiveField(activeField === 'checkin' ? null : 'checkin')}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="text-xs font-semibold text-gray-900 mb-1">{t('checkIn')}</div>
              <div className="text-sm text-gray-600">{fmtDisplay(state.check_in)}</div>
            </button>
          </div>

          {/* 退房 */}
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={() => setActiveField(activeField === 'checkout' ? null : 'checkout')}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="text-xs font-semibold text-gray-900 mb-1">{t('checkOut')}</div>
              <div className="text-sm text-gray-600">{fmtDisplay(state.check_out)}</div>
            </button>
          </div>

          {/* 人数 */}
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={() => setActiveField(activeField === 'guests' ? null : 'guests')}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="text-xs font-semibold text-gray-900 mb-1">{t('who')}</div>
              <div className="text-sm text-gray-600">
                {state.guests === 1 ? t('oneGuest') : t('guestCount', {count: state.guests})}
              </div>
            </button>

            <AnimatePresence>
              {activeField === 'guests' && (
                <motion.div
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, y: 10}}
                  className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border z-50 w-80"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t('guests')}</div>
                        <div className="text-sm text-gray-600">{t('agesInfo')}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => onGuestsChange(-1)}
                          disabled={state.guests <= 1}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{state.guests}</span>
                        <button
                          type="button"
                          onClick={() => onGuestsChange(1)}
                          disabled={state.guests >= 20}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 搜索按钮（可选） */}
          <div className="pr-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                replaceUrl({ location: locationInput.trim() });
                setActiveField(null);
              }}
              className="bg-airbnb hover:bg-airbnb-dark text-white p-4 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label={t('search')}
            >
              {isPending ? (
                <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 日期选择器浮层 */}
        <AnimatePresence>
          {(activeField === 'checkin' || activeField === 'checkout') && (
            <motion.div
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: 10}}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-xl border z-50"
            >
              <div className="p-4">
                <DatePickerDynamic
                  checkIn={state.check_in ? parseLocalISODate(state.check_in) : null}
                  checkOut={state.check_out ? parseLocalISODate(state.check_out) : null}
                  onChange={onDateChange}
                  bookedDates={[]}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
