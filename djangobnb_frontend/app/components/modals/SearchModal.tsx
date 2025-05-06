'use client'

import { format } from 'date-fns';
import DatePicker from '@/app/components/properties/DatePicker';
import { useTranslations } from 'next-intl';

interface SearchModalProps {
    location: string;
    checkIn: string | null;
    checkOut: string | null;
    guests: number;
    setLocation: (location: string) => void;
    setDates: (checkIn: string | null, checkOut: string | null) => void;
    setGuests: (guests: number) => void;
    onClose: () => void;
    onSearch: () => void;
}

const SearchModal = ({
    location,
    checkIn,
    checkOut,
    guests,
    setLocation,
    setDates,
    setGuests,
    onClose,
    onSearch
}: SearchModalProps) => {
    const t = useTranslations('search');
    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocation(e.target.value);
    };

    const handleDateChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        const startStr = start ? format(start, 'yyyy-MM-dd') : null;
        const endStr = end ? format(end, 'yyyy-MM-dd') : null;
        setDates(startStr, endStr);
    };

    const handleGuestsChange = (value: number) => {
        if (value >= 1) {
            setGuests(value);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 full-search-modal lg:hidden">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{t('search')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100"
                        aria-label={t('closeModal')}
                    >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* 位置搜索 */}
                <div className="mb-6">
                    <h3 className="font-semibold mb-2">{t('whereTo')}</h3>
                    <input
                        type="text"
                        value={location}
                        onChange={handleLocationChange}
                        placeholder={t('searchDestinations')}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
                    />
                </div>

                {/* 日期选择 */}
                <div className="mb-6">
                    <h3 className="font-semibold mb-2">{t('when')}</h3>
                    <DatePicker
                        checkIn={checkInDate}
                        checkOut={checkOutDate}
                        onChange={handleDateChange}
                        bookedDates={[]}
                    />
                </div>

                {/* 客人数量 */}
                <div className="mb-8">
                    <h3 className="font-semibold mb-2">{t('whosComing')}</h3>
                    <div className="flex items-center justify-between py-2">
                        <span>{guests > 1 ? t('guests') : t('guest')}</span>
                        <div className="flex items-center">
                            <button
                                onClick={() => handleGuestsChange(Math.max(1, guests - 1))}
                                className="w-8 h-8 flex items-center justify-center border rounded-full"
                            >
                                -
                            </button>
                            <span className="mx-3">{guests}</span>
                            <button
                                onClick={() => handleGuestsChange(guests + 1)}
                                className="w-8 h-8 flex items-center justify-center border rounded-full"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* 搜索按钮 */}
                <button
                    className="w-full py-3 bg-airbnb hover:bg-airbnb_dark transition text-white rounded-lg font-medium"
                    onClick={onSearch}
                >
                    {t('search')}
                </button>
            </div>
        </div>
    );
};

export default SearchModal; 