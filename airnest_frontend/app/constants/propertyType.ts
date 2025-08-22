export interface PropertyType {
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
  most_popular_tags?: Array<{
    key: string;
    name: string;
    count: number;
    color: string;
  }>;
}

export interface PropertyImage {
  id: number;
  imageURL: string;
  order: number;
  is_main: boolean;
  alt_text?: string;
}
