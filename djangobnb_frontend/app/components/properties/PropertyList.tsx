"use client";

import { useEffect, useState } from "react";
import apiService from "../../services/apiService";
import PropertyListItem from "./PropertyListItem";
import { PropertyType } from "@/app/constants/propertyType";
interface PropertyListProps {
    isMyProperties?: boolean;
    isWishlist?: boolean;
}

const PropertyList: React.FC<PropertyListProps> = ({ isMyProperties, isWishlist }) => {
    const [properties, setProperties] = useState<PropertyType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const getProperties = async () => {
        try {
            let endpoint = '/api/properties/';
            if (isMyProperties) {
                endpoint = '/api/properties/my/';
            } else if (isWishlist) {
                endpoint = '/api/properties/wishlist/';
            }

            const data = (isMyProperties || isWishlist)
                ? await apiService.getwithtoken(endpoint)
                : await apiService.get(endpoint);
            setProperties(data);
        } catch (error) {
            setError("Failed to load properties");
            console.error("Error fetching properties:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getProperties();
    }, [isMyProperties, isWishlist]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (properties.length === 0) {
        return (
            <div className="text-center py-10">
                <h3 className="text-lg font-semibold">No properties found</h3>
                {isMyProperties && (
                    <p className="text-gray-500 mt-2">
                        You haven't listed any properties yet.
                    </p>
                )}
            </div>
        );
    }

    return (
        <>
            {properties.map((property) => (
                <PropertyListItem
                    key={property.id}
                    property={property}
                />
            ))}
        </>
    );
};

export default PropertyList;