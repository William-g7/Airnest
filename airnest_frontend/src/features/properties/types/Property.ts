export interface PropertyImage {
    id: number;
    imageURL: string;
    order: number;
    is_main: boolean;
    alt_text?: string;
  }
  
  export interface Property {
    id: string;
    title: string;
    description: string;
    price_per_night: number;
  
    category: string;
    place_type: string;
  
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
  
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    timezone?: string; 
  
    status?: 'draft' | 'published';
  
    images: PropertyImage[];
  
    landlord: {
      id: string;
      name?: string;
      username: string;
      avatar_url?: string;
    };
  
    average_rating?: number;
    total_reviews?: number;
    positive_review_rate?: number;
    property_tags?: string[];
  }
  
  export type PropertyType = Property;

  interface CategoryOption {
    label: string;
    icon: string;
    value: string;
  }
  
  export const propertyCategories: CategoryOption[] = [
    {
      label: 'Apartment',
      icon: '/icons/apartment.svg',
      value: 'apartment',
    },
    {
      label: 'Beach',
      icon: '/icons/beach.svg',
      value: 'beach house',
    },
    {
      label: 'Bed & Breakfast',
      icon: '/icons/bed.svg',
      value: 'bed and breakfast',
    },
    {
      label: 'Castle',
      icon: '/icons/castle.svg',
      value: 'castle',
    },
    {
      label: 'Farm',
      icon: '/icons/farm.svg',
      value: 'farm house',
    },
    {
      label: 'Ferry',
      icon: '/icons/ferry.svg',
      value: 'ferry',
    },
    {
      label: 'Hotel',
      icon: '/icons/hotel.svg',
      value: 'hotel',
    },
    {
      label: 'House',
      icon: '/icons/house.svg',
      value: 'house',
    },
    {
      label: 'Treehouse',
      icon: '/icons/tree-house.svg',
      value: 'treehouse',
    },
  ];
  
  