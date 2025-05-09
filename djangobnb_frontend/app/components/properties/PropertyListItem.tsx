'use client'

import { PropertyType } from "@/app/constants/propertyType";
import Image from "next/image";
import WishlistButton from "./WishlistButton";
import { useCallback } from "react";
import { useLoginModal } from "../hooks/useLoginModal";
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from "@/app/hooks/useAuth";
import { useFavoritesStore } from "@/app/stores/favoritesStore";
import { debounce } from "@/app/utils/debounce";
import toast from 'react-hot-toast';

interface PropertyListItemProps {
    property: PropertyType;
}

const PropertyListItem: React.FC<PropertyListItemProps> = ({ property }) => {
    const t = useTranslations('properties');
    const tFavorites = useTranslations('favorites');
    const router = useRouter();
    const loginModal = useLoginModal();

    const { isAuthenticated } = useAuth();
    const { isFavorite, toggleFavorite } = useFavoritesStore();

    const debouncedToggleWishlist = useCallback(
        debounce(async (e: React.MouseEvent) => {
            e.stopPropagation();

            if (!isAuthenticated) {
                loginModal.onOpen();
                return;
            }

            try {
                const wasInFavorites = isFavorite(property.id);
                await toggleFavorite(property.id);

                if (wasInFavorites) {
                    toast.success(tFavorites('removed'));
                } else {
                    toast.success(tFavorites('added'));
                }
            } catch (error: any) {
                if (error.message === 'No authentication token available') {
                    loginModal.onOpen();
                } else {
                    console.error('Error toggling wishlist:', error);
                    toast.error(tFavorites('error'));
                }
            }
        }, 300),
        [property.id, isAuthenticated, loginModal, toggleFavorite, isFavorite, tFavorites]
    );

    return (
        <div className="relative group">
            <WishlistButton
                propertyId={property.id}
                isFavorited={isFavorite(property.id)}
                onToggle={debouncedToggleWishlist}
            />
            <div className="cursor-pointer"
                onClick={() => router.push({ pathname: '/properties/[id]', params: { id: property.id } })}>
                <div className="relative overflow-hidden aspect-square rounded-xl">
                    <Image
                        src={property.images?.[0]?.thumbnailURL || property.images?.[0]?.imageURL || '/placeholder.jpg'}
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