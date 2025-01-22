'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyType } from "./PropertyList";
import DatePicker from './DatePicker';
import apiService from '@/app/services/apiService';
import { useLoginModal } from '../hooks/useLoginModal';

const ReservationSideBar = ({ property }: { property: PropertyType }) => {
    const [dates, setDates] = useState<[Date | null, Date | null]>([null, null]);
    const [guests, setGuests] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const loginModal = useLoginModal();
    const [bookedDates, setBookedDates] = useState<string[]>([]);

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
                alert('Please select check-in and check-out dates');
                return;
            }

            setIsLoading(true);

            console.log('Sending reservation request:', {
                check_in: dates[0].toISOString().split('T')[0],
                check_out: dates[1].toISOString().split('T')[0],
                guests: guests,
                total_price: totals.total
            });

            const response = await apiService.post(`/api/properties/${property.id}/reserve/`, {
                check_in: dates[0].toISOString().split('T')[0],
                check_out: dates[1].toISOString().split('T')[0],
                guests: guests,
                total_price: totals.total
            });

            if (response.success) {
                router.push('/myreservations');
                router.refresh();
            } else {
                alert(response.error || 'Failed to make reservation');
            }
        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                loginModal.onOpen();
            } else {
                console.log('error:', error);

            }
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
                <span className="text-lg text-gray-500 ml-2">night</span>
            </div>

            <DatePicker
                checkIn={dates[0]}
                checkOut={dates[1]}
                onChange={(newDates) => setDates(newDates)}
                bookedDates={bookedDates}
            />

            <div className="border-t border-gray-300 p-4">
                <label className="text-xs font-bold block mb-1">GUESTS</label>
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

            <button
                onClick={handleReservation}
                disabled={isLoading || !dates[0] || !dates[1]}
                className={`
                    w-full bg-airbnb hover:bg-airbnb_dark text-white p-3 rounded-lg mt-4 font-semibold
                    ${(isLoading || !dates[0] || !dates[1]) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {isLoading ? 'Reserving...' : 'Reserve'}
            </button>

            {dates[0] && dates[1] && (
                <>
                    <div className="mt-4 space-y-4">
                        <div className="flex justify-between">
                            <span className="underline">
                                ${property.price_per_night} x {calculateNights()} nights
                            </span>
                            <span>${totals.subtotal}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="underline">Cleaning fee</span>
                            <span>${totals.cleaningFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="underline">Service fee</span>
                            <span>${totals.serviceFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="underline">Taxes</span>
                            <span>${totals.taxes.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-300 flex justify-between font-bold">
                        <span>Total</span>
                        <span>${totals.total.toFixed(2)}</span>
                    </div>
                </>
            )}
        </aside>
    );
};

export default ReservationSideBar;