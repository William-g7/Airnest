import Image from 'next/image';
import { PropertyType } from '@/app/constants/propertyType';
import { CurrencyIsland } from './CurrencyIsland';
import { WishlistIsland } from './WishlistIsland';
import { PropertyCardClickable } from './PropertyCardClickable';
import { getTranslations } from 'next-intl/server';
import StarRating from '../reviews/StarRating';
import ReviewTag from '../reviews/ReviewTag';
import { getReviewHighlights } from './PropertyHilights';

interface PropertyCardSSRProps {
  property: PropertyType;
  locale: string;
  isFirstScreen?: boolean;
  isLCPCandidate?: boolean; // 是否是LCP候选者（通常是第一个元素）
  translations?: {
    title?: string;
    city?: string;
    country?: string;
  };
}

export default async function PropertyCardSSR({ 
  property, 
  locale,
  isFirstScreen = false,
  isLCPCandidate = false,
  translations 
}: PropertyCardSSRProps) {
  const t = await getTranslations('properties');
  
  // 获取最佳图片URL
  const getOptimalPropertyImage = () => {
    if (!property.images || property.images.length === 0) {
      return '/placeholder.jpg';
    }
    
    const mainImage = property.images[0];
    
    // 服务器端默认使用中等质量图片，避免客户端匹配水化不一致
    const imageUrl = mainImage.mediumURL || mainImage.imageURL;
    return imageUrl;
  };

  // 处理翻译后的内容
  const displayTitle = locale !== 'en' && translations?.title 
    ? translations.title 
    : property.title;
  
  const displayCity = locale !== 'en' && translations?.city 
    ? translations.city 
    : property.city;
    
  const displayCountry = locale !== 'en' && translations?.country 
    ? translations.country 
    : property.country;

  // 获取评论亮点
  const reviewHighlights = property.most_popular_tags && property.most_popular_tags.length > 0
    ? property.most_popular_tags.map(tag => tag.name)
    : getReviewHighlights(property, locale);

  return (
    <div className="relative group">
      <PropertyCardClickable propertyId={property.id}>
        <div className="overflow-hidden rounded-xl bg-white transition-all duration-300 ease-in-out hover:shadow-md h-full flex flex-col">
        <div className="relative overflow-hidden aspect-square rounded-t-xl flex-shrink-0">
          <Image
            src={getOptimalPropertyImage()}
            alt={property.title}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            fill
            className="object-cover w-full h-full"
            quality={85}
            priority={isLCPCandidate} // 只对LCP候选者设置priority
            loading={isFirstScreen ? "eager" : "lazy"} // 首屏都用eager，但只有LCP候选者是priority
            fetchPriority={isLCPCandidate ? "high" : (isFirstScreen ? "auto" : "auto")}
          />
          
          {/* 价格标签 - 使用服务器端组件 */}
          <div className="absolute bottom-3 left-3 bg-white bg-opacity-90 py-1 px-2 rounded-lg shadow-sm">
            <p className="text-sm font-semibold text-gray-900">
              <CurrencyIsland amount={property.price_per_night} />
              <span className="text-xs font-medium text-gray-600 ml-1">{t('perNight')}</span>
            </p>
          </div>
        </div>

        <div className="p-3 flex flex-col flex-grow">
          {/* 标题 - 固定2行高度 */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 h-14 flex items-center">
            {displayTitle}
          </h3>

          {/* 位置 - 固定1行高度 */}
          <p className="text-sm text-gray-600 mt-1 line-clamp-1 h-5">
            {displayCity}, {displayCountry}
          </p>

          {/* 评分和评论 - 固定高度 */}
          <div className="mt-2 h-6 flex items-center">
            {property.average_rating && property.total_reviews && property.total_reviews > 0 ? (
              <div className="flex items-center space-x-2">
                <StarRating rating={property.average_rating} readOnly size="small" />
                <span className="text-sm text-gray-600">
                  {property.average_rating.toFixed(1)} · {property.total_reviews} {t('reviews')}
                </span>
              </div>
            ) : (
              <div></div>
            )}
          </div>

          {/* 标签和心愿单按钮 - 固定高度，推到底部 */}
          <div className="mt-2 flex-grow flex items-end">
            <div className="w-full flex items-center justify-between">
              <div className="flex flex-wrap gap-2 max-h-8 overflow-hidden">
                {property.most_popular_tags && property.most_popular_tags.length > 0 ? (
                  property.most_popular_tags.slice(0, 2).map((tag) => (
                    <ReviewTag
                      key={tag.key}
                      tag={{
                        tag_key: tag.key,
                        name: tag.name,
                        color: tag.color
                      }}
                      size="small"
                    />
                  ))
                ) : (
                  reviewHighlights.slice(0, 2).map((highlight, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs font-medium text-gray-800 truncate max-w-20"
                    >
                      {highlight}
                    </span>
                  ))
                )}
              </div>

              {/* 心愿单按钮 - 客户端岛屿 */}
              <div className="ml-2 flex-shrink-0">
                <WishlistIsland propertyId={property.id} />
              </div>
            </div>
          </div>
        </div>
        </div>
      </PropertyCardClickable>
    </div>
  );
}