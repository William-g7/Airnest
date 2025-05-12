'use client'

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { PropertyType } from "@/app/constants/propertyType";
import DatePicker from './DatePicker';
import apiService from '@/app/services/apiService';
import { useLoginModal } from '../hooks/useLoginModal';
import { useTranslations } from 'next-intl';
import { formatDateForAPI, calculateNights } from '@/app/utils/dateUtils';
import { useAuth } from '@/app/hooks/useAuth';
import toast from 'react-hot-toast';
import CurrencyDisplay from '../common/CurrencyDisplay';

const ReservationSideBar = ({ property }: { property: PropertyType }) => {
    const t = useTranslations('property');
    const [dates, setDates] = useState<[Date | null, Date | null]>([null, null]);
    const [guests, setGuests] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const loginModal = useLoginModal();
    const [bookedDates, setBookedDates] = useState<string[]>([]);
    const [partiallyBookedDates, setPartiallyBookedDates] = useState<string[]>([]);
    const { isAuthenticated } = useAuth();

    const getNights = () => {
        if (dates[0] && dates[1]) {
            return calculateNights(dates[0], dates[1]);
        }
        return 0;
    };

    const calculateTotal = () => {
        const nights = getNights();
        const subtotal = property.price_per_night * nights;
        const cleaningFee = subtotal * 0.1;
        const serviceFee = subtotal * 0.15;
        const taxes = subtotal * 0.12;

        return {
            subtotal,
            cleaningFee,
            serviceFee,
            taxes,
            total: subtotal + cleaningFee + serviceFee + taxes
        };
    };

    const totals = calculateTotal();

    const handleReservation = async () => {
        if (!dates[0] || !dates[1]) {
            toast.error(t('selectDates'));
            return;
        }

        if (!isAuthenticated) {
            console.log('User not logged in, opening login modal');
            loginModal.onOpen();
            return;
        }

        try {
            setIsLoading(true);

            // 使用 dateUtils 中的函数格式化日期
            const checkInDateStr = formatDateForAPI(dates[0]);
            const checkOutDateStr = formatDateForAPI(dates[1]);

            const response = await apiService.post(`/api/properties/${property.id}/reserve/`, {
                check_in: checkInDateStr,
                check_out: checkOutDateStr,
                guests: guests,
                total_price: totals.total
            });

            if (response.success) {
                toast.success(t('reservationSuccess'));
                router.push({
                    pathname: '/myreservations'
                });
            } else {
                toast.error(response.error || t('reservationFailed'));
            }
        } catch (err: any) {
            console.error('Error making reservation:', err);

            if (err.response?.status === 401 ||
                err.message?.includes('authentication') ||
                err.message?.includes('token')) {
                loginModal.onOpen();
            } else {
                toast.error(t('reservationFailed'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchBookedDates = async () => {
            try {
                const response = await apiService.get(`/api/properties/${property.id}/booked-dates/`);

                // 处理完全预订的日期
                setBookedDates(response.booked_dates || []);
                // 处理部分预订的日期
                setPartiallyBookedDates(response.partially_booked_dates || []);

            } catch (error) {
                console.error('Error fetching booked dates:', error);
            }
        };

        fetchBookedDates();
    }, [property.id]);

    return (
        <aside className="mt-6 p-6 border border-gray-200 rounded-xl shadow-md">
            <div className="flex items-baseline mb-6">
                <span className="text-2xl font-bold">
                    <CurrencyDisplay amount={property.price_per_night} />
                </span>
                <span className="text-lg text-gray-500 ml-2">{t('perNight')}</span>
            </div>

            <DatePicker
                checkIn={dates[0]}
                checkOut={dates[1]}
                onChange={(newDates) => setDates(newDates)}
                bookedDates={bookedDates}
                partiallyBookedDates={partiallyBookedDates}
                propertyTimezone={property.timezone}
            />

            <div className="border-t border-gray-300 p-4">
                <label className="text-xs font-bold block mb-1">{t('guests').toUpperCase()}</label>
                <select
                    className="w-full -ml-1 text-sm"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                >
                    {[...Array(property.guests)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                </select>
            </div>

            {dates[0] && dates[1] && (
                <>
                    <div className="mt-4 space-y-4">
                        <div className="flex justify-between">
                            <span className="underline">
                                <CurrencyDisplay amount={property.price_per_night} /> x {getNights()} {t('nights')}
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
                        <span><CurrencyDisplay amount={totals.total} showOriginal={true} /></span>
                    </div>
                </>
            )}

            <button
                onClick={handleReservation}
                disabled={isLoading || !dates[0] || !dates[1]}
                className={`
                    w-full bg-airbnb hover:bg-airbnb_dark text-white py-4 rounded-lg mt-6 font-semibold
                    ${(isLoading || !dates[0] || !dates[1]) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {isLoading ? t('reserving') : t('reserve')}
            </button>
        </aside>
    );
};

export default ReservationSideBar;