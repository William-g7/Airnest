'use client'

import { useEffect, useState } from "react";
import PropertyList from "@/app/components/properties/PropertyList";
import apiService from "@/app/services/apiService";
import { PropertyType } from "../components/properties/PropertyList";

const MyWishlistsPage = () => {
    const [properties, setProperties] = useState<PropertyType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchWishlists = async () => {
            try {
                const response = await apiService.getwithtoken('/api/properties/wishlist/');
                setProperties(response);
            } catch (error) {
                setError("Failed to load wishlists");
                console.error('Error fetching wishlists:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWishlists();
    }, []);

    if (isLoading) {
        return (
            <main className="max-w-[1500px] mx-auto px-6 pb-6">
                <h1 className="text-3xl font-semibold my-8">My Wishlists</h1>
                <div className="text-center">Loading...</div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="max-w-[1500px] mx-auto px-6 pb-6">
                <h1 className="text-3xl font-semibold my-8">My Wishlists</h1>
                <div className="text-red-500 text-center">{error}</div>
            </main>
        );
    }

    return (
        <main className="max-w-[1500px] mx-auto px-6 pb-6">
            <h1 className="text-3xl font-semibold my-8">My Wishlists</h1>
            {properties.length === 0 ? (
                <div className="text-center py-10">
                    <h3 className="text-lg font-semibold">No saved properties</h3>
                    <p className="text-gray-500 mt-2">
                        Properties you save will appear here
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {properties.map((property) => (
                        <PropertyList key={property.id} isWishlist={true} />
                    ))}
                </div>
            )}
        </main>
    );
};

export default MyWishlistsPage;