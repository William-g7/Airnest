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

  // 评论统计数据（可选，仅在需要时提供）
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
  // 缩略图URL - 列表和卡片视图中使用
  thumbnailURL: string | null;
  // 中等尺寸图片URL - 详情页轮播图使用
  mediumURL: string | null;
  // 大尺寸图片URL - 大屏幕设备上的详情页轮播图使用
  largeURL: string | null;
  // 超大尺寸图片URL - 4K等高分辨率显示器上使用
  xlargeURL: string | null;
  // 高质量JPG主图 - 轮播图首图使用
  mainJpgURL: string | null;
  // 高清原图URL - 点击查看大图时使用
  originalURL: string | null;
  // 图片顺序和主图标记
  order: number;
  is_main: boolean;
}
