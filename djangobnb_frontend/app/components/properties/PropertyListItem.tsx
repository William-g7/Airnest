'use client'

import { PropertyType } from "./PropertyList";
import Image from "next/image";
import { useRouter } from "next/navigation";
import WishlistButton from "./WishlistButton";
import { useState, useEffect } from "react";
import { useLoginModal } from "../hooks/useLoginModal";
import apiService from "@/app/services/apiService";

interface PropertyListItemProps {
    property: PropertyType;
}

const PropertyListItem: React.FC<PropertyListItemProps> = ({ property }) => {
    const [isFavorited, setIsFavorited] = useState(false);
    const router = useRouter();
    const loginModal = useLoginModal();

    useEffect(() => {
        const checkIfFavorited = async () => {
            try {
                const response = await apiService.getwithtoken('/api/properties/wishlist/');
                const wishlist = response;
                setIsFavorited(wishlist.some((item: PropertyType) => item.id === property.id));
            } catch (error) {
                console.error('Error checking wishlist status:', error);
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
            if (error.message === 'Unauthorized') {
                loginModal.onOpen();
            }
            console.error('Error toggling wishlist:', error);
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
                onClick={() => router.push(`/properties/${property.id}`)}>
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
                    <p className="text-sm text-gray-500"><strong>Location:</strong> {property.city}, {property.country}</p>
                </div>

                <div className="mt-2">
                    <p className="text-sm text-gray-500"><strong>Price:</strong> ${property.price_per_night}</p>
                </div>
            </div>
        </div>
    )
};

export default PropertyListItem;