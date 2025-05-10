'use client'

import { useState, useEffect } from 'react';
import { useLoginModal } from '@/app/components/hooks/useLoginModal';
import { useAddPropertyModal } from '@/app/components/hooks/useAddPropertyModal';
import apiService from '@/app/services/apiService';
import { useAuthStore } from '@/app/stores/authStore';
import WishlistButton from '@/app/components/properties/WishlistButton';
import Image from "next/image";
import { Link } from '@/i18n/navigation';
import { PropertyType } from '@/app/constants/propertyType';
import dynamic from 'next/dynamic';
import ContactButton from "@/app/components/ContactButton";
import { useTranslations } from 'next-intl';
import CustomButton from '@/app/components/forms/CustomButton';
import toast from 'react-hot-toast';
import { useTranslate } from '@/app/hooks/useTranslate';

const PropertyImageCarousel = dynamic(
    () => import('./PropertyImageCarousel'),
    {
        loading: () => (
            <div className="animate-pulse bg-gray-200 h-[60vh] rounded-lg" />
        ),
        ssr: true
    }
);

const ReservationSideBar = dynamic(
    () => import('./ReservationSideBar'),
    {
        loading: () => (
            <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
        ),
        ssr: true
    }
);

const PropertyDetail = ({ property }: { property: PropertyType }) => {
    const t = useTranslations('property');
    const tFavorites = useTranslations('favorites');
    const [isFavorited, setIsFavorited] = useState(false);
    const loginModal = useLoginModal();
    const addPropertyModal = useAddPropertyModal();
    const authStore = useAuthStore();
    const isLandlord = authStore.userId && property.landlord && authStore.userId === property.landlord.id.toString();
    const { useLiveTranslation } = useTranslate();

    const { translation: translatedTitle, isLoading: titleLoading } = useLiveTranslation(property.title);
    const { translation: translatedDescription, isLoading: descLoading } = useLiveTranslation(property.description);
    const { translation: translatedCity, isLoading: cityLoading } = useLiveTranslation(property.city);
    const { translation: translatedCountry, isLoading: countryLoading } = useLiveTranslation(property.country);

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

                if (response.status === 'added') {
                    toast.success(tFavorites('added'));
                } else {
                    toast.success(tFavorites('removed'));
                }
            }
        } catch (error: any) {
            if (error.message === 'No authentication token available') {
                loginModal.onOpen();
            } else {
                console.error('Error toggling wishlist:', error);
                toast.error(tFavorites('error'));
            }
        }
    };

    const handleEditProperty = () => {
        addPropertyModal.onOpenForEdit(property);
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
                    <h1 className="text-4xl font-semibold mb-4">
                        {titleLoading ? (
                            <span className="animate-pulse">{property.title}</span>
                        ) : (
                            translatedTitle
                        )}
                    </h1>

                    <div className="text-lg text-gray-600 mb-2">
                        <p>📍 {cityLoading ? property.city : translatedCity},
                            {countryLoading ? property.country : translatedCountry}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-lg text-gray-600 mb-2">
                        <span>👤 {property.guests} {t('guests')}</span>
                        <span>·</span>
                        <span>🛏️ {property.bedrooms} {t('bedrooms')}</span>
                        <span>·</span>
                        <span>🛌 {property.beds} {t('beds')}</span>
                        <span>·</span>
                        <span>🛁 {property.bathrooms} {t('bathrooms')}</span>
                    </div>

                    <div className="text-lg text-gray-600 mb-6">
                        {property.place_type === 'entire' && (
                            <p>🏠 {t('entirePlace', { category: property.category.toLowerCase() })}</p>
                        )}
                        {property.place_type === 'room' && (
                            <p>🛏️ {t('privateRoom', { category: property.category.toLowerCase() })}</p>
                        )}
                        {property.place_type === 'shared' && (
                            <p>🛏️ {t('sharedRoom')}</p>
                        )}
                    </div>

                    <hr className="my-6" />

                    <div className="flex items-center justify-between">
                        <Link href={{ pathname: '/landlords/[id]', params: { id: property.landlord.id.toString() } }} className="flex-grow">
                            {property.landlord.avatar_url ? (
                                <div className="py-6 flex items-center space-x-4">
                                    <Image
                                        src={property.landlord.avatar_url || '/profile-placeholder.jpg'}
                                        alt={t('hostAlt')}
                                        width={50}
                                        height={50}
                                        className="rounded-full"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-lg font-semibold">
                                            {property.landlord.name || property.landlord.username}
                                        </span>
                                        <span className="text-sm text-gray-500">{t('host')}</span>
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
                            {isLandlord ? (
                                <CustomButton
                                    onClick={handleEditProperty}
                                    label={t('editProperty')}
                                    className="w-full"
                                />
                            ) : (
                                <ContactButton landlordId={property.landlord.id} />
                            )}
                        </div>
                    </div>

                    <hr className="my-6" />

                    <div className="py-6">
                        <h2 className="text-2xl font-semibold mb-4">{t('aboutPlace')}</h2>
                        <p className="text-gray-600 whitespace-pre-line">
                            {descLoading ? (
                                <span className="animate-pulse">{property.description}</span>
                            ) : (
                                translatedDescription
                            )}
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