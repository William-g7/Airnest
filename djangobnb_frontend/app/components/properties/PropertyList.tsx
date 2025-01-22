"use client";

import { useEffect, useState } from "react";
import apiService from "../../services/apiService";
import PropertyListItem from "./PropertyListItem";

export type PropertyType = {
    id: number;
    title: string;
    price_per_night: number;
    images: Array<{
        imageURL: string;
    }>;
    city: string;
    country: string;
    guests: number;
};

interface PropertyListProps {
    isMyProperties?: boolean;
}

const PropertyList: React.FC<PropertyListProps> = ({ isMyProperties }) => {
    const [properties, setProperties] = useState<PropertyType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const getProperties = async () => {
        try {
            const endpoint = isMyProperties ? '/api/properties/my/' : '/api/properties/';
            const data = isMyProperties
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
    }, [isMyProperties]);

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