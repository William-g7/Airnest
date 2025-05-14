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

  images: PropertyImage[];

  landlord: {
    id: string;
    name?: string;
    username: string;
    avatar_url?: string;
  };
}

export interface PropertyImage {
  id: number;
  imageURL: string;
  // 缩略图URL - 列表和卡片视图中使用
  thumbnailURL: string | null;
  // 中等尺寸图片URL - 详情页轮播图使用
  mediumURL: string | null;
  // 图片顺序和主图标记
  order: number;
  is_main: boolean;
}
