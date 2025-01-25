'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginModal } from '@/app/components/hooks/useLoginModal';
import apiService from '@/app/services/apiService';
import WishlistButton from '@/app/components/properties/WishlistButton';
import Image from "next/image";
import Link from "next/link";
import { PropertyType } from '@/app/constants/propertyType';
import dynamic from 'next/dynamic';
import ContactButton from "@/app/components/ContactButton";

// 动态导入大型组件
const PropertyImageCarousel = dynamic(
    () => import('./PropertyImageCarousel'),
    {
        loading: () => (
            <div className="animate-pulse bg-gray-200 h-[60vh] rounded-lg" />
        ),
    }
);

const ReservationSideBar = dynamic(
    () => import('./ReservationSideBar'),
    {
        loading: () => (
            <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
        ),
    }
);

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
                    <h1 className="text-4xl font-semibold mb-4">{property.title}</h1>

                    <div className="text-lg text-gray-600 mb-2">
                        <p>📍 {property.city}, {property.country}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-lg text-gray-600 mb-2">
                        <span>👤 {property.guests} guests</span>
                        <span>·</span>
                        <span>🛏️ {property.bedrooms} bedrooms</span>
                        <span>·</span>
                        <span>🛌 {property.beds} beds</span>
                        <span>·</span>
                        <span>🛁 {property.bathrooms} baths</span>
                    </div>

                    <div className="text-lg text-gray-600 mb-6">
                        {property.place_type === 'entire' && (
                            <p>🏠 You'll have the {property.category.toLowerCase()} to yourself</p>
                        )}
                        {property.place_type === 'room' && (
                            <p>🛏️ You'll have a private room in a {property.category.toLowerCase()}</p>
                        )}
                        {property.place_type === 'shared' && (
                            <p>🛏️ You'll be sharing a room in a managed hostel</p>
                        )}
                    </div>

                    <hr className="my-6" />

                    <div className="flex items-center justify-between">
                        <Link href={`/landlords/${property.landlord.id}`} className="flex-grow">
                            {property.landlord.avatar_url ? (
                                <div className="py-6 flex items-center space-x-4">
                                    <Image
                                        src={property.landlord.avatar_url}
                                        alt="Host"
                                        width={50}
                                        height={50}
                                        className="rounded-full"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-lg font-semibold">
                                            {property.landlord.name || property.landlord.username}
                                        </span>
                                        <span className="text-sm text-gray-500">Host</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 flex items-center space-x-4">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-semibold">
                                            {property.landlord.username}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </Link>
                        <div className="w-[200px]">
                            <ContactButton landlordId={property.landlord.id} />
                        </div>
                    </div>

                    <hr className="my-6" />

                    <div className="py-6">
                        <h2 className="text-2xl font-semibold mb-4">About this place</h2>
                        <p className="text-gray-600 whitespace-pre-line">
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