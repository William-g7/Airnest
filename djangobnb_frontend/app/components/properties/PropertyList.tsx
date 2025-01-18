"use client";

import { useEffect, useState } from "react";
import apiService from "../../services/apiService";
import PropertyListItem from "./PropertyListItem";

export type PropertyType = {
    id: number;
    title: string;
    price_per_night: number;
    imageURL: string;
    city: string;
    country: string;
};

const PropertyList = () => {
    const [properties, setProperties] = useState<PropertyType[]>([]);

    const getProperties = async () => {
        const data = await apiService.get('/api/properties/');
        setProperties(data);
    };

    useEffect(() => {
        getProperties();
    }, []);

    return (
        <>
            {properties.map((property) => (
                <PropertyListItem
                    key={property.id}
                    property={property}
                />
            ))}
        </>
    )
};

export default PropertyList;