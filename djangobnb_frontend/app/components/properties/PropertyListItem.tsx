'use client'

import { PropertyType } from "@/app/constants/propertyType";
import Image from "next/image";
import WishlistButton from "./WishlistButton";
import { useState, useEffect } from "react";
import { useLoginModal } from "../hooks/useLoginModal";
import apiService from "@/app/services/apiService";
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

interface PropertyListItemProps {
    property: PropertyType;
}

const PropertyListItem: React.FC<PropertyListItemProps> = ({ property }) => {
    const t = useTranslations('properties');
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
            } else {
                console.error('Error toggling wishlist:', error);
            }
        }
    };

    return (
        <div className="relative group">
            <WishlistButton
                propertyId={property.id}
                isFavorited={isFavorited}
                onToggle={handleToggleWishlist}
            />
            <div className="cursor-pointer"
                onClick={() => router.push({ pathname: '/properties/[id]', params: { id: property.id } })}>
                <div className="relative overflow-hidden aspect-square rounded-xl">
                    <Image
                        src={property.images?.[0]?.imageURL || '/placeholder.jpg'}
                        alt={property.title}
                        sizes="(max-width: 768px) 768px, (max-width: 1200px) 768px, 768px"
                        fill
                        className="hover:scale-105 transition-all duration-300 ease-in-out object-cover w-full h-full"
                    />
                </div>

                <div className="mt-2">
                    <p className="text-lg font-semibold">{property.title}</p>
                </div>

                <div className="mt-2">
                    <p className="text-sm text-gray-500"><strong>{t('location')}:</strong> {property.city}, {property.country}</p>
                </div>

                <div className="mt-2">
                    <p className="text-sm text-gray-500"><strong>{t('price')}:</strong> ${property.price_per_night}</p>
                </div>
            </div>
        </div>
    )
};

export default PropertyListItem;