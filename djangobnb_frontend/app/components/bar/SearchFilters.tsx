'use client'

import { useState, useEffect } from 'react';
import { useSearchStore } from '@/app/stores/searchStore';
import { useSearchParamsSync } from '@/app/hooks/useSearchParamsSync';
import DatePicker from '@/app/components/properties/DatePicker';
import SearchModal from '@/app/components/modals/SearchModal';
import { useTranslations } from 'next-intl';
import { formatLocalizedDate, formatDateForAPI } from '@/app/utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

const SearchFilters = () => {
    const { location, checkIn, checkOut, guests, setLocation, setDates, setGuests } = useSearchStore();
    const t = useTranslations('search');

    useSearchParamsSync();

    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [showFullSearch, setShowFullSearch] = useState(false);

    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocation(e.target.value);
    };

    const handleDateChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        const startStr = start ? formatDateForAPI(start) : null;
        const endStr = end ? formatDateForAPI(end) : null;
        setDates(startStr, endStr);

        if (start && end && activeFilter) {
            setTimeout(() => {
                setActiveFilter(null);
            }, 2000);
        }
    };

    const handleGuestsChange = (value: number) => {
        if (value >= 1) {
            setGuests(value);
        }
    };

    const toggleFilter = (filter: string) => {
        setActiveFilter(activeFilter === filter ? null : filter);
    };

    const handleSearch = () => {
        if (window.innerWidth >= 1024) {
            setActiveFilter(null);
        } else {
            if (!showFullSearch) {
                setShowFullSearch(true);
            } else {
                setShowFullSearch(false);
                setActiveFilter(null);
            }
        }
    };

    const handleCloseFullSearch = () => {
        setShowFullSearch(false);
        setActiveFilter(null);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.search-filters-container') && activeFilter) {
                setActiveFilter(null);
            }

            if (showFullSearch && !target.closest('.full-search-modal') && !target.closest('.search-btn-container')) {
                setShowFullSearch(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeFilter, showFullSearch]);

    return (
        <>
            {/* The search filter bar for large screens */}
            <div
                className="hidden lg:flex search-filters-container w-full items-center justify-between border rounded-full transition-all duration-500 ease-in-out relative"
                style={{ height: 'var(--search-height, 48px)' }}
            >
                <div className="flex-1 flex">
                    <div className="flex flex-row items-center justify-between w-full">
                        {/* The location filter */}
                        <div
                            className={`px-4 flex flex-col justify-center text-center rounded-full hover:bg-gray-100 transition-all duration-200 cursor-pointer ${activeFilter === 'location' ? 'bg-gray-100' : ''}`}
                            onClick={() => toggleFilter('location')}
                        >
                            <p className={`text-xs font-semibold ${activeFilter === 'location' ? 'text-airbnb' : ''}`}>{t('where')}</p>
                            <p className="text-sm truncate">{location || t('anywhere')}</p>
                        </div>

                        <span className="h-6 w-[1px] bg-gray-300 mx-2"></span>

                        {/* The check-in date filter */}
                        <div
                            className={`px-4 flex flex-col justify-center text-center rounded-full hover:bg-gray-100 transition-all duration-200 cursor-pointer ${activeFilter === 'checkIn' ? 'bg-gray-100' : ''}`}
                            onClick={() => toggleFilter('checkIn')}
                        >
                            <p className={`text-xs font-semibold ${activeFilter === 'checkIn' ? 'text-airbnb' : ''}`}>{t('checkIn')}</p>
                            <p className="text-sm truncate">
                                {checkIn ? formatLocalizedDate(checkIn, 'UTC', 'short') : t('addDate')}
                            </p>
                        </div>

                        <span className="h-6 w-[1px] bg-gray-300 mx-2"></span>

                        {/* The check-out date filter */}
                        <div
                            className={`px-4 flex flex-col justify-center text-center rounded-full hover:bg-gray-100 transition-all duration-200 cursor-pointer ${activeFilter === 'checkOut' ? 'bg-gray-100' : ''}`}
                            onClick={() => toggleFilter('checkOut')}
                        >
                            <p className={`text-xs font-semibold ${activeFilter === 'checkOut' ? 'text-airbnb' : ''}`}>{t('checkOut')}</p>
                            <p className="text-sm truncate">
                                {checkOut ? formatLocalizedDate(checkOut, 'UTC', 'short') : t('addDate')}
                            </p>
                        </div>

                        <span className="h-6 w-[1px] bg-gray-300 mx-2"></span>

                        {/* The guests number filter */}
                        <div
                            className={`px-4 flex flex-col justify-center text-center rounded-full hover:bg-gray-100 transition-all duration-200 cursor-pointer ${activeFilter === 'guests' ? 'bg-gray-100' : ''}`}
                            onClick={() => toggleFilter('guests')}
                        >
                            <p className={`text-xs font-semibold ${activeFilter === 'guests' ? 'text-airbnb' : ''}`}>{t('who')}</p>
                            <p className="text-sm truncate">{`${guests} ${t('guest')}`}</p>
                        </div>
                    </div>

                    {/* The search button for large screens */}
                    <div className="ml-2">
                        <button
                            className="cursor-pointer flex items-center justify-center bg-airbnb hover:bg-airbnb_dark transition-all duration-300 rounded-full text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                            onClick={handleSearch}
                            aria-label={t('search')}
                            style={{
                                width: `calc(var(--search-height, 48px) * 0.8)`,
                                height: `calc(var(--search-height, 48px) * 0.8)`,
                                minWidth: '40px',
                                minHeight: '40px'
                            }}
                        >
                            <svg
                                viewBox="0 0 32 32"
                                style={{ display: 'block', fill: 'none', height: '18px', width: '18px', stroke: 'currentColor', strokeWidth: 4, overflow: 'visible' }}
                                aria-hidden="true" role="presentation" focusable="false"
                            >
                                <path fill="none" d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* The filter panel */}
                <AnimatePresence>
                    {activeFilter && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute z-50 left-0 right-0 top-full mt-1 bg-white shadow-md rounded-3xl p-4 border"
                        >
                            {activeFilter === 'location' && (
                                <div className="p-4">
                                    <h3 className="font-semibold mb-2 text-center">{t('whereTo')}</h3>
                                    <input
                                        type="text"
                                        value={location}
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
                                    <DatePicker
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
                                                onClick={() => handleGuestsChange(Math.max(1, guests - 1))}
                                                className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-100 transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="mx-3">{guests}</span>
                                            <button
                                                onClick={() => handleGuestsChange(guests + 1)}
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

            {/* The small screen version - simplified search bar */}
            <div className="lg:hidden search-btn-container flex items-center">
                <div
                    className="h-[46px] w-[180px] sm:w-[220px] border rounded-full flex items-center justify-between px-2 sm:px-3 relative cursor-pointer transition-all duration-300 hover:shadow-md hover:bg-gray-50"
                    onClick={handleSearch}
                >
                    <div className="flex items-center flex-1">
                        <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-[140px]">
                            {location ? location : t('anywhere')}
                        </span>
                    </div>

                    {/* The search button for small screens */}
                    <button
                        className="w-9 h-9 flex items-center justify-center bg-airbnb hover:bg-airbnb_dark transition-all duration-300 rounded-full text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSearch();
                        }}
                        aria-label={t('search')}
                    >
                        <svg
                            viewBox="0 0 32 32"
                            style={{ display: 'block', fill: 'none', height: '15px', width: '15px', stroke: 'currentColor', strokeWidth: 4, overflow: 'visible' }}
                            aria-hidden="true" role="presentation" focusable="false"
                        >
                            <path fill="none" d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showFullSearch && (
                    <SearchModal
                        location={location}
                        checkIn={checkIn}
                        checkOut={checkOut}
                        guests={guests}
                        setLocation={setLocation}
                        setDates={setDates}
                        setGuests={setGuests}
                        onClose={handleCloseFullSearch}
                        onSearch={() => {
                            setShowFullSearch(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default SearchFilters;