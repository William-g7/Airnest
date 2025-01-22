'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginModal } from '@/app/components/hooks/useLoginModal';
import apiService from '@/app/services/apiService';
import WishlistButton from '@/app/components/properties/WishlistButton';
import Image from "next/image";
import Link from "next/link";
import { PropertyType } from '@/app/components/properties/PropertyList';
import ReservationSideBar from "@/app/components/properties/ReservationSideBar";
import PropertyImageCarousel from "@/app/components/properties/PropertyImageCarousel";


const PropertyDetail = ({ property }: { property: PropertyType }) => {
    const [isFavorited, setIsFavorited] = useState(false);
    const router = useRouter();
    const loginModal = useLoginModal();

    useEffect(() => {
        const checkIfFavorited = async () => {
            try {
                const response = await apiService.getwithtoken('/api/properties/wishlist/');
                const wishlist = response;
                setIsFavorited(wishlist.some((item: PropertyType) => item.id === property.id));
            } catch (error: any) {
                if (error.message !== 'HTTP error! status: 401') {
                    console.error('Error checking wishlist status:', error);
                }
            }
        };

        checkIfFavorited();
    }, [property.id]);

    const handleToggleWishlist = async (e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            const response = await apiService.post(`/api/properties/${property.id}/toggle-favorite/`, {
                propertyId: property.id
            });
            if (response.status === 'added' || response.status === 'removed') {
                setIsFavorited(response.status === 'added');
            }
        } catch (error: any) {
            if (error.message === 'No authentication token available') {
                loginModal.onOpen();
            }
            console.error('Error toggling wishlist:', error);
        }
    };

    return (
        <div className="relative">
            <WishlistButton
                propertyId={property.id}
                isFavorited={isFavorited}
                onToggle={handleToggleWishlist}
            />
            <PropertyImageCarousel
                images={property.images}
                title={property.title}
            />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-7 lg:col-span-8">
                    <h1 className="mb-4 text-4xl font-semibold">{property.title}</h1>

                    <span className="mb-6 block text-2xl text-gray-600">
                        {property.guests} guests · {property.bedrooms} bedrooms · {property.beds} beds · {property.bathrooms} baths
                    </span>

                    <hr />
                    <Link href={`/landlords/${property.landlord.id}`}>
                        {property.landlord.avatar_url ? (
                            <div className="py-6 flex items-center space-x-4">
                                <Image
                                    src={property.landlord.avatar_url || '/placeholder.jpg'}
                                    alt="Host"
                                    width={50}
                                    height={50}
                                    className="rounded-full"
                                />
                                <div className="flex flex-col">
                                    <span className="text-lg font-semibold">{property.landlord.name}</span>
                                    <span className="text-sm text-gray-500">Host</span>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 flex items-center space-x-4">
                                <div className="flex flex-col">
                                    <span className="text-lg font-semibold">{property.landlord.username}</span>
                                    <span className="text-sm text-gray-500">Host</span>
                                </div>
                            </div>
                        )}
                    </Link>
                    <hr />

                    <div className="py-6">
                        <h2 className="mb-4 text-2xl font-semibold">About this place</h2>
                        <p className="text-gray-600">
                            {property.description}
                        </p>
                    </div>
                </div>

                <div className="md:col-span-5 lg:col-span-4">
                    <ReservationSideBar property={property} />
                </div>
            </div>
        </div>
    );
};

export default PropertyDetail;