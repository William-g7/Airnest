'use client'

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { PropertyType } from "@/app/constants/propertyType";
import DatePicker from './DatePicker';
import apiService from '@/app/services/apiService';
import { useLoginModal } from '../hooks/useLoginModal';
import { useTranslations } from 'next-intl';
import { getAccessToken } from '@/app/auth/session';

const ReservationSideBar = ({ property }: { property: PropertyType }) => {
    const t = useTranslations('property');
    const [dates, setDates] = useState<[Date | null, Date | null]>([null, null]);
    const [guests, setGuests] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const loginModal = useLoginModal();
    const [bookedDates, setBookedDates] = useState<string[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const response = await apiService.getwithtoken('/api/auth/me/');
                const loggedIn = !!response?.pk;
                setIsLoggedIn(loggedIn);
            } catch (error) {
                console.error('Error checking login status:', error);
                setIsLoggedIn(false);
            }
        };

        checkLoginStatus();
    }, []);

    const calculateNights = () => {
        if (dates[0] && dates[1]) {
            const diffTime = Math.abs(dates[1].getTime() - dates[0].getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return 0;
    };

    const calculateTotal = () => {
        const nights = calculateNights();
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
        try {
            if (!dates[0] || !dates[1]) {
                alert(t('selectDates'));
                return;
            }

            try {
                const checkResponse = await apiService.getwithtoken('/api/auth/me/');
                if (!checkResponse?.pk) {
                    loginModal.onOpen();
                    return;
                }
            } catch (error) {
                console.error("Error during reservation login check:", error);
                loginModal.onOpen();
                return;
            }

            if (!isLoggedIn) {
                loginModal.onOpen();
                return;
            }

            setIsLoading(true);

            try {
                const response = await apiService.post(`/api/properties/${property.id}/reserve/`, {
                    check_in: dates[0].toISOString().split('T')[0],
                    check_out: dates[1].toISOString().split('T')[0],
                    guests: guests,
                    total_price: totals.total
                });

                if (response.success) {
                    router.push({
                        pathname: '/myreservations'
                    });
                } else {
                    alert(response.error || t('reservationFailed'));
                }
            } catch (err: any) {
                if (err.message?.includes('authentication') || err.message?.includes('token')) {
                    loginModal.onOpen();
                } else {
                    alert(t('reservationFailed'));
                }
                console.error('Error making reservation:', err);
            }
        } catch (error: any) {
            console.error('Error:', error);
            alert(t('reservationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchBookedDates = async () => {
            try {
                const response = await apiService.get(`/api/properties/${property.id}/booked-dates/`);
                setBookedDates(response.booked_dates);
            } catch (error) {
                console.error('Error fetching booked dates:', error);
            }
        };

        fetchBookedDates();
    }, [property.id]);

    return (
        <aside className="mt-6 p-6 border border-gray-200 rounded-xl shadow-md">
            <div className="flex items-baseline mb-6">
                <span className="text-2xl font-bold">${property.price_per_night}</span>
                <span className="text-lg text-gray-500 ml-2">{t('perNight')}</span>
            </div>

            <DatePicker
                checkIn={dates[0]}
                checkOut={dates[1]}
                onChange={(newDates) => setDates(newDates)}
                bookedDates={bookedDates}
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
                                ${property.price_per_night} x {calculateNights()} {t('nights')}
                            </span>
                            <span>${totals.subtotal}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="underline">{t('cleaningFee')}</span>
                            <span>${totals.cleaningFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="underline">{t('serviceFee')}</span>
                            <span>${totals.serviceFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="underline">{t('taxes')}</span>
                            <span>${totals.taxes.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-300 flex justify-between font-bold">
                        <span>{t('total')}</span>
                        <span>${totals.total.toFixed(2)}</span>
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