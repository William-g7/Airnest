'use client';

import {useState, useEffect, useMemo, Suspense} from 'react';
import {useTranslations, useFormatter} from 'next-intl';
import {motion, AnimatePresence} from 'framer-motion';
import DatePickerDynamic from '@daysPicker/DayPickerDynamic';
import SearchModal from '@search/components/SearchModal';
import {parseLocalISODate, formatDateYYYYMMDD} from '@daysPicker/dateUtils';
import {useSearchQuery} from '@search/hooks/useSearchQuery';
import {useDebouncedCallback} from '@search/hooks/useDebouncedCallback';

function SearchFiltersContent() {
  const t = useTranslations('search');
  const f = useFormatter();

  const {state, replaceUrl, isPending} = useSearchQuery();

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showFullSearch, setShowFullSearch] = useState(false);

  // 让输入时更顺滑，避免每键都 replace
  const debouncedSetLocation = useDebouncedCallback((v: string) => {
    replaceUrl({location: v});
  }, 300);

  // 解析 URL 中的 YYYY-MM-DD -> 本地 Date（避免时区偏移）
  const checkInDate = useMemo(
    () => (state.check_in ? parseLocalISODate(state.check_in) : null),
    [state.check_in]
  );
  const checkOutDate = useMemo(
    () => (state.check_out ? parseLocalISODate(state.check_out) : null),
    [state.check_out]
  );

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetLocation(e.target.value);
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    replaceUrl({
      check_in: start ? formatDateYYYYMMDD(start) : null,
      check_out: end ? formatDateYYYYMMDD(end) : null,
    });
    if (start && end && activeFilter) setTimeout(() => setActiveFilter(null), 2000);
  };

  const handleGuestsChange = (value: number) => {
    replaceUrl({guests: Math.max(1, value)});
  };

  const toggleFilter = (filter: string) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  const handleSearch = () => {
    if (window.innerWidth >= 1024) {
      setActiveFilter(null);
    } else {
      setShowFullSearch(s => !s);
      if (showFullSearch) setActiveFilter(null);
    }
  };

  const handleCloseFullSearch = () => {
    setShowFullSearch(false);
    setActiveFilter(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-filters-container') && activeFilter) setActiveFilter(null);
      if (
        showFullSearch &&
        !target.closest('.full-search-modal') &&
        !target.closest('.search-btn-container')
      ) {
        setShowFullSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeFilter, showFullSearch]);

  // 展示标签
  const checkInLabel = checkInDate
    ? f.dateTime(checkInDate, {month: 'short', day: '2-digit'})
    : t('addDate');
  const checkOutLabel = checkOutDate
    ? f.dateTime(checkOutDate, {month: 'short', day: '2-digit'})
    : t('addDate');

  return (
    <>
      {/* 大屏搜索条 */}
      <div
        className="hidden lg:flex search-filters-container w-full items-center justify-between border rounded-full transition-all duration-500 ease-in-out relative"
        style={{height: 'var(--search-height, 48px)'}}
      >
        <div className="flex-1 flex">
          <div className="flex flex-row items-center justify-between w-full">
            {/* 目的地 */}
            <div
              className={`px-4 flex flex-col justify-center text-center rounded-full hover:bg-gray-100 transition-all duration-200 cursor-pointer ${activeFilter === 'location' ? 'bg-gray-100' : ''}`}
              onClick={() => toggleFilter('location')}
            >
              <p className={`text-xs font-semibold ${activeFilter === 'location' ? 'text-airbnb' : ''}`}>
                {t('where')}
              </p>
              <p className="text-sm truncate">{state.location || t('anywhere')}</p>
            </div>

            <span className="h-6 w-[1px] bg-gray-300 mx-2"></span>

            {/* 入住 */}
            <div
              className={`px-4 flex flex-col justify-center text-center rounded-full hover:bg-gray-100 transition-all duration-200 cursor-pointer ${activeFilter === 'checkIn' ? 'bg-gray-100' : ''}`}
              onClick={() => toggleFilter('checkIn')}
            >
              <p className={`text-xs font-semibold ${activeFilter === 'checkIn' ? 'text-airbnb' : ''}`}>
                {t('checkIn')}
              </p>
              <p className="text-sm truncate">{checkInLabel}</p>
            </div>

            <span className="h-6 w-[1px] bg-gray-300 mx-2"></span>

            {/* 退房 */}
            <div
              className={`px-4 flex flex-col justify-center text-center rounded-full hover:bg-gray-100 transition-all duration-200 cursor-pointer ${activeFilter === 'checkOut' ? 'bg-gray-100' : ''}`}
              onClick={() => toggleFilter('checkOut')}
            >
              <p className={`text-xs font-semibold ${activeFilter === 'checkOut' ? 'text-airbnb' : ''}`}>
                {t('checkOut')}
              </p>
              <p className="text-sm truncate">{checkOutLabel}</p>
            </div>

            <span className="h-6 w-[1px] bg-gray-300 mx-2"></span>

            {/* 人数 */}
            <div
              className={`px-4 flex flex-col justify-center text-center rounded-full hover:bg-gray-100 transition-all duration-200 cursor-pointer ${activeFilter === 'guests' ? 'bg-gray-100' : ''}`}
              onClick={() => toggleFilter('guests')}
            >
              <p className={`text-xs font-semibold ${activeFilter === 'guests' ? 'text-airbnb' : ''}`}>
                {t('who')}
              </p>
              <p className="text-sm truncate">{`${state.guests} ${t('guest')}`}</p>
            </div>
          </div>

          {/* 搜索按钮（大屏） */}
          <div className="ml-2">
            <button
              className="cursor-pointer flex items-center justify-center bg-airbnb hover:bg-airbnb_dark transition-all duration-300 rounded-full text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-60"
              onClick={handleSearch}
              aria-label={t('search')}
              disabled={isPending}
              style={{
                width: `calc(var(--search-height, 48px) * 0.8)`,
                height: `calc(var(--search-height, 48px) * 0.8)`,
                minWidth: '40px',
                minHeight: '40px'
              }}
            >
              {/* 放大镜 */}
              <svg
                viewBox="0 0 32 32"
                style={{display:'block', fill:'none', height:'18px', width:'18px', stroke:'currentColor', strokeWidth:4, overflow:'visible'}}
                aria-hidden="true" role="presentation" focusable="false"
              >
                <path fill="none" d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* 下拉面板 */}
        <AnimatePresence>
          {activeFilter && (
            <motion.div
              initial={{opacity: 0, y: -10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -10}}
              transition={{duration: 0.2, ease: 'easeOut'}}
              className="absolute z-50 left-0 right-0 top-full mt-1 bg-white shadow-md rounded-3xl p-4 border"
            >
              {activeFilter === 'location' && (
                <div className="p-4">
                  <h3 className="font-semibold mb-2 text-center">{t('whereTo')}</h3>
                  <input
                    type="text"
                    defaultValue={state.location}
                    onChange={handleLocationChange}
                    placeholder={t('searchDestinations')}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
                    autoFocus
                  />
                </div>
              )}

              {(activeFilter === 'checkIn' || activeFilter === 'checkOut') && (
                <div className="p-4">
                  <h3 className="font-semibold mb-2 text-center">{t('when')}</h3>
                  <DatePickerDynamic
                    checkIn={checkInDate}
                    checkOut={checkOutDate}
                    onChange={handleDateChange}
                    bookedDates={[]}
                  />
                </div>
              )}

              {activeFilter === 'guests' && (
                <div className="p-4">
                  <h3 className="font-semibold mb-2 text-center">{t('whosComing')}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span>{t('guests')}</span>
                    <div className="flex items-center">
                      <button
                        onClick={() => handleGuestsChange(Math.max(1, state.guests - 1))}
                        className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-100 transition-colors"
                      >
                        -
                      </button>
                      <span className="mx-3">{state.guests}</span>
                      <button
                        onClick={() => handleGuestsChange(state.guests + 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 小屏精简搜索条 */}
      <div className="lg:hidden search-btn-container flex items-center">
        <div
          className="h-[46px] w-[180px] sm:w-[220px] border rounded-full flex items-center justify-between px-2 sm:px-3 relative cursor-pointer transition-all duration-300 hover:shadow-md hover:bg-gray-50"
          onClick={handleSearch}
        >
          <div className="flex items-center flex-1">
            <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-[140px]">
              {state.location ? state.location : t('anywhere')}
            </span>
          </div>
          <button
            className="w-9 h-9 flex items-center justify-center bg-airbnb hover:bg-airbnb_dark transition-all duration-300 rounded-full text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
            onClick={e => { e.stopPropagation(); handleSearch(); }}
            aria-label={t('search')}
          >
            <svg
              viewBox="0 0 32 32"
              style={{display:'block', fill:'none', height:'15px', width:'15px', stroke:'currentColor', strokeWidth:4, overflow:'visible'}}
              aria-hidden="true" role="presentation" focusable="false"
            >
              <path fill="none" d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9"></path>
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFullSearch && (
          <SearchModal onClose={handleCloseFullSearch} />
        )}
    </AnimatePresence>
    </>
  );
}

const SearchFilters = () => (
  <Suspense
    fallback={
      <div className="w-full flex items-center justify-center">
        {/* 大屏版骨架屏 */}
        <div className="hidden lg:flex items-center space-x-2 bg-white border rounded-full shadow-sm px-6 py-3 min-h-[48px] w-full max-w-2xl">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        {/* 小屏版骨架屏 */}
        <div className="lg:hidden flex items-center">
          <div className="h-[46px] w-[220px] bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    }
  >
    <SearchFiltersContent />
  </Suspense>
);

export default SearchFilters;
