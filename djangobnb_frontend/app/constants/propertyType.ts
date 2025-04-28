export type PropertyType = {
    id: string;
    title: string;
    price_per_night: number;
    category: string;
    place_type: string;
    images: Array<{
        imageURL: string;
    }>;
    address: string;
    city: string;
    country: string;
    postal_code: string;
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    description: string;
    landlord: {
        id: string;
        name?: string;
        username: string;
        avatar_url?: string;
    };
};