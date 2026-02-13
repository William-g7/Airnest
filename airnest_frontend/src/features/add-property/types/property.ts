interface PlaceTypeProps {
  title: string;
  description: string;
  value: string;
  icon: string;
}

export const placeTypeOptions: PlaceTypeProps[] = [
  {
    title: 'An entire place',
    description: 'Guests have the whole place to themselves.',
    value: 'entire',
    icon: '/placetypes/room.svg',
  },
  {
    title: 'A room',
    description: 'Guests have their own room in a home, plus access to shared spaces.',
    value: 'room',
    icon: '/placetypes/door.svg',
  },
  {
    title: 'A shared room in a hostel',
    description: 'Guests sleep in a shared room in a managed hostel with staff on-site 24/7.',
    value: 'shared',
    icon: '/placetypes/hostel.svg',
  },
];

export const TAG_CATEGORIES = [
  'amenities',
  'location',
  'experience',
  'comfort',
  'service',
] as const;

export type TagCategory = (typeof TAG_CATEGORIES)[number];

export const PREDEFINED_PROPERTY_TAGS = [
  // amenities
  { id: 'wifi',           category: 'amenities' },
  { id: 'parking',        category: 'amenities' },
  { id: 'pool',           category: 'amenities' },
  { id: 'gym',            category: 'amenities' },
  { id: 'kitchen',        category: 'amenities' },
  { id: 'laundry',        category: 'amenities' },
  // comfort
  { id: 'ac',             category: 'comfort'   },
  { id: 'heating',        category: 'comfort'   },
  { id: 'luxury',         category: 'comfort'   },
  { id: 'spacious',       category: 'comfort'   },
  { id: 'cozy',           category: 'comfort'   },
  { id: 'great_view',     category: 'comfort'   },
  // location
  { id: 'city_center',    category: 'location'  },
  { id: 'beach_nearby',   category: 'location'  },
  { id: 'mountain_view',  category: 'location'  },
  { id: 'quiet_area',     category: 'location'  },
  { id: 'metro_access',   category: 'location'  },
  // experience
  { id: 'unique_architecture', category: 'experience' },
  { id: 'historic',            category: 'experience' },
  { id: 'modern_design',       category: 'experience' },
  { id: 'local_culture',       category: 'experience' },
  // service
  { id: 'excellent_host',  category: 'service'  },
  { id: 'fast_checkin',    category: 'service'  },
  { id: 'pet_friendly',    category: 'service'  },
  { id: 'family_friendly', category: 'service'  },
  { id: 'business_ready',  category: 'service'  },
] as const;

export type PropertyTagId = (typeof PREDEFINED_PROPERTY_TAGS)[number]['id'];

export const ALLOWED_TAG_IDS: PropertyTagId[] =
  PREDEFINED_PROPERTY_TAGS.map(t => t.id);

export const getTagById = (id: PropertyTagId) =>
  PREDEFINED_PROPERTY_TAGS.find(t => t.id === id);

export const getTagsByCategory = (category: TagCategory) =>
  PREDEFINED_PROPERTY_TAGS.filter(t => t.category === category);

// —— Add Property 表单相关类型 ——
export interface BasicInfoType {
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
}

export interface LocationType {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  timezone: string;
}

export interface PropertyDetailsType {
  title: string;
  description: string;
  price: number;
  property_tags: PropertyTagId[]; 
}

export interface EditableProperty {
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

  country: string;
  state: string;
  city: string;
  address: string;
  postal_code: string;
  timezone: string;
  property_tags?: string[];

  images?: Array<{
    id?: string | number;
    imageURL: string;
    order: number;
    is_main: boolean;
    alt_text?: string;
  }>;
}