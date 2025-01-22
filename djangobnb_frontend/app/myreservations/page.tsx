'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import apiService from "@/app/services/apiService";

interface Reservation {
    id: string;
    property: {
        id: number;
        title: string;
        images: Array<{ imageURL: string }>;
    };
    check_in: string;
    check_out: string;
    guests: number;
    total_price: number;
    created_at: string;
}

const MyReservationsPage = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const response = await apiService.getwithtoken('/api/properties/reservations/');
                setReservations(response);
            } catch (error) {
                setError("Failed to load reservations");
                console.error('Error fetching reservations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReservations();
    }, []);

    if (isLoading) {
        return (
            <main className="max-w-[1500px] mx-auto px-6 pb-6">
                <h1 className="text-3xl font-semibold my-8">My reservations</h1>
                <div className="text-center">Loading...</div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="max-w-[1500px] mx-auto px-6 pb-6">
                <h1 className="text-3xl font-semibold my-8">My reservations</h1>
                <div className="text-red-500 text-center">{error}</div>
            </main>
        );
    }

    const calculateNights = (checkIn: string, checkOut: string) => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <main className="max-w-[1500px] mx-auto px-6 pb-6">
            <h1 className="text-3xl font-semibold my-8">My reservations</h1>

            {reservations.length === 0 ? (
                <div className="text-center text-gray-500">
                    You don't have any reservations yet.
                </div>
            ) : (
                <div className="space-y-6">
                    {reservations.map((reservation) => (
                        <div
                            key={reservation.id}
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-6">
                                {/* Image Section */}
                                <div className="col-span-1">
                                    <div className="relative overflow-hidden aspect-square rounded-xl">
                                        <Image
                                            fill
                                            src={`http://localhost:8000${reservation.property.images[0]?.imageURL}` || '/placeholder.jpg'}
                                            className="hover:scale-105 transition-transform duration-500 object-cover"
                                            alt={reservation.property.title}
                                        />
                                    </div>
                                </div>

                                {/* Details Section */}
                                <div className="col-span-1 md:col-span-4">
                                    <h2 className="text-2xl font-semibold mb-4">{reservation.property.title}</h2>

                                    <div className="space-y-3 text-gray-600">
                                        <div className="flex items-center space-x-2">
                                            <div>
                                                <span className="font-medium"><strong>Check in: </strong></span>
                                                <span>{new Date(reservation.check_in).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <div>
                                                <span className="font-medium"><strong>Check out: </strong></span>
                                                <span>{new Date(reservation.check_out).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <div>
                                                <span className="font-medium"><strong>Duration: </strong></span>
                                                <span>{calculateNights(reservation.check_in, reservation.check_out)} nights</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <div>
                                                <span className="font-medium"><strong>Total price: </strong></span>
                                                <span>${reservation.total_price}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button Section */}
                                    <div className="mt-6 flex items-center">
                                        <Link
                                            href={`/properties/${reservation.property.id}`}
                                            className="inline-flex items-center px-6 py-3 bg-airbnb text-white font-semibold rounded-lg hover:bg-airbnb_dark transition-colors duration-300"
                                        >
                                            <span>View Property</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
};

export default MyReservationsPage;