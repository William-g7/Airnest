'use client';

import {useState, useEffect, useMemo, useRef, Suspense} from 'react';
import {useTranslations, useFormatter} from 'next-intl';
import {motion, AnimatePresence} from 'framer-motion';
import DatePickerDynamic from '@daysPicker/DayPickerDynamic';
import SearchModal from '@search/components/SearchModal';
import {parseLocalISODate, formatDateYYYYMMDD} from '@daysPicker/dateUtils';
import {useSearchQuery} from '@search/hooks/useSearchQuery';
import {useAISearch} from '@search/hooks/useAISearch';
import {useDebouncedCallback} from '@search/hooks/useDebouncedCallback';

const SparkleIcon = ({className = 'w-3.5 h-3.5'}: {className?: string}) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
  </svg>
);

function SearchFiltersContent() {
  const t = useTranslations('search');
  const f = useFormatter();

  const {state, replaceUrl, isPending} = useSearchQuery();
  const {search: aiSearch, isLoading: isAILoading, isFallback} = useAISearch();

  const [isAIMode, setIsAIMode] = useState(false);
  const [aiQuery, setAIQuery] = useState('');
  const aiInputRef = useRef<HTMLInputElement>(null);

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showFullSearch, setShowFullSearch] = useState(false);

  const debouncedSetLocation = useDebouncedCallback((v: string) => {
    replaceUrl({location: v});
  }, 300);

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

  const handleAISubmit = () => {
    console.log('[SearchFilters] handleAISubmit called, aiQuery:', aiQuery, 'isAILoading:', isAILoading);
    if (!aiQuery.trim() || isAILoading) {
      console.log('[SearchFilters] Blocked: empty query or already loading');
      return;
    }
    console.log('[SearchFilters] Dispatching AI search...');
    aiSearch(aiQuery);
  };

  const handleAIKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAISubmit(); }
    if (e.key === 'Escape') { setIsAIMode(false); }
  };

  const switchToAI = () => {
    setIsAIMode(true);
    setActiveFilter(null);
    setTimeout(() => aiInputRef.current?.focus(), 80);
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

  const checkInLabel = checkInDate
    ? f.dateTime(checkInDate, {month: 'short', day: '2-digit'})
    : t('addDate');
  const checkOutLabel = checkOutDate
    ? f.dateTime(checkOutDate, {month: 'short', day: '2-digit'})
    : t('addDate');

  return (
    <>
      {/* ═══ 大屏搜索条 ═══ */}
      <AnimatePresence mode="wait">
        {isAIMode ? (
          /* ─── AI 搜索模式（大屏） ─── */
          <motion.div
            key="ai-bar"
            initial={{opacity: 0, scale: 0.97}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0.97}}
            transition={{duration: 0.18}}
            className="hidden lg:flex search-filters-container w-full items-center border rounded-full relative overflow-hidden"
            style={{height: 'var(--search-height, 48px)', background: 'linear-gradient(135deg, #fff1f3 0%, #ffe4e8 100%)'}}
          >
            <div className="flex-1 flex items-center px-4 gap-2">
              <SparkleIcon className="w-4 h-4 text-airbnb flex-shrink-0" />
              <input
                ref={aiInputRef}
                type="text"
                value={aiQuery}
                onChange={e => setAIQuery(e.target.value)}
                onKeyDown={handleAIKeyDown}
                placeholder={t('aiPlaceholder')}
                className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                disabled={isAILoading}
              />
              {isAILoading && (
                <span className="text-xs text-airbnb flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                  <span className="animate-spin w-3 h-3 border-2 border-red-200 border-t-airbnb rounded-full" />
                  {t('aiParsing')}
                </span>
              )}
              {isFallback && !isAILoading && (
                <span className="text-xs text-amber-600 flex-shrink-0 whitespace-nowrap">{t('aiFallback')}</span>
              )}
            </div>

            <div className="flex items-center gap-1 pr-1">
              {/* 返回普通搜索 */}
              <button
                type="button"
                onClick={() => setIsAIMode(false)}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-full hover:bg-white/60 transition-colors whitespace-nowrap"
              >
                {t('normalSearch')}
              </button>
              {/* AI 搜索按钮 */}
              <button
                type="button"
                onClick={handleAISubmit}
                disabled={isAILoading || !aiQuery.trim()}
                className="flex items-center justify-center bg-airbnb hover:bg-airbnb_dark text-white rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                style={{
                  width: `calc(var(--search-height, 48px) * 0.8)`,
                  height: `calc(var(--search-height, 48px) * 0.8)`,
                  minWidth: '36px',
                  minHeight: '36px'
                }}
                aria-label={t('aiSearch')}
              >
                {isAILoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <SparkleIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          /* ─── 普通筛选搜索条（大屏） ─── */
          <motion.div
            key="normal-bar"
            initial={{opacity: 0, scale: 0.97}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0.97}}
            transition={{duration: 0.18}}
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

          <div className="flex items-center gap-1 ml-2">
            {/* AI 模式切换按钮 */}
            <button
              type="button"
              onClick={switchToAI}
              className="flex items-center justify-center rounded-full text-airbnb hover:bg-red-50 transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                width: `calc(var(--search-height, 48px) * 0.7)`,
                height: `calc(var(--search-height, 48px) * 0.7)`,
                minWidth: '32px',
                minHeight: '32px'
              }}
              aria-label={t('aiToggle')}
              title={t('aiToggle')}
            >
              <SparkleIcon className="w-4 h-4" />
            </button>
            {/* 搜索按钮（大屏） */}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 小屏搜索条 ═══ */}
      <div className="lg:hidden search-btn-container flex items-center gap-2">
        {/* AI 模式切换（小屏） */}
        {!isAIMode ? (
        <div
          className="h-[46px] w-[180px] sm:w-[220px] border rounded-full flex items-center justify-between px-2 sm:px-3 relative cursor-pointer transition-all duration-300 hover:shadow-md hover:bg-gray-50"
          onClick={handleSearch}
        >
          <div className="flex items-center flex-1">
            <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-[140px]">
              {state.location ? state.location : t('anywhere')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); switchToAI(); }}
              className="w-8 h-8 flex items-center justify-center text-airbnb hover:bg-red-50 rounded-full transition-colors"
              aria-label={t('aiToggle')}
            >
              <SparkleIcon className="w-3.5 h-3.5" />
            </button>
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
        ) : (
          /* ─── AI 搜索（小屏） ─── */
          <div
            className="h-[46px] w-[220px] sm:w-[280px] border border-red-200 rounded-full flex items-center px-2 sm:px-3 relative transition-all duration-300"
            style={{background: 'linear-gradient(135deg, #fff1f3 0%, #ffe4e8 100%)'}}
          >
            <input
              ref={aiInputRef}
              type="text"
              value={aiQuery}
              onChange={e => setAIQuery(e.target.value)}
              onKeyDown={handleAIKeyDown}
              placeholder={t('aiPlaceholder')}
              className="flex-1 text-xs bg-transparent outline-none text-gray-800 placeholder:text-gray-400 min-w-0"
              disabled={isAILoading}
            />
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsAIMode(false)}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-full transition-colors"
                aria-label={t('normalSearch')}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleAISubmit}
                disabled={isAILoading || !aiQuery.trim()}
                className="w-9 h-9 flex items-center justify-center bg-airbnb hover:bg-airbnb_dark text-white rounded-full transition-all disabled:opacity-40 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                aria-label={t('aiSearch')}
              >
                {isAILoading ? (
                  <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <SparkleIcon className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
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
