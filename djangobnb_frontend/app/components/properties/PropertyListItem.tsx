'use client'

import { PropertyType } from "@/app/constants/propertyType";
import Image from "next/image";
import WishlistButton from "./WishlistButton";
import { useCallback, useRef } from "react";
import { useLoginModal } from "../hooks/useLoginModal";
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from "@/app/hooks/useAuth";
import { useFavoritesStore } from "@/app/stores/favoritesStore";
import { debounce } from "@/app/utils/debounce";
import toast from 'react-hot-toast';
import { useLocaleStore } from '@/app/stores/localeStore';

interface PropertyListItemProps {
    property: PropertyType;
    translations?: {
        title: string;
        city: string;
        country: string;
    };
}

const PropertyListItem = ({ property, translations }: PropertyListItemProps) => {
    const t = useTranslations('properties');
    const tFavorites = useTranslations('favorites');
    const router = useRouter();
    const loginModal = useLoginModal();
    const itemRef = useRef<HTMLDivElement>(null);
    const { locale } = useLocaleStore();

    const { isAuthenticated } = useAuth();
    const { isFavorite, toggleFavorite } = useFavoritesStore();

    // 使用传入的翻译，或者如果没有提供翻译，则使用原始文本
    const translatedTitle = locale !== 'en' && translations?.title
        ? translations.title
        : property.title;

    const translatedCity = locale !== 'en' && translations?.city
        ? translations.city
        : property.city;

    const translatedCountry = locale !== 'en' && translations?.country
        ? translations.country
        : property.country;

    const debouncedToggleWishlist = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();

            const handleToggle = debounce(async () => {
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
            }, 300);

            handleToggle();
        },
        [property.id, isAuthenticated, loginModal, toggleFavorite, isFavorite, tFavorites]
    );

    return (
        <div className="relative group" ref={itemRef}>
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
                    <p className="text-lg font-semibold">{translatedTitle}</p>
                </div>

                <div className="mt-2">
                    <p className="text-sm text-gray-500"><strong>{t('location')}:</strong> {translatedCity}, {translatedCountry}</p>
                </div>

                <div className="mt-2">
                    <p className="text-sm text-gray-500"><strong>{t('price')}:</strong> ${property.price_per_night}</p>
                </div>
            </div>
        </div>
    )
};

export default PropertyListItem;