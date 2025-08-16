'use client';

import { PropertyType } from '@/app/constants/propertyType';
import Image from 'next/image';
import WishlistButton from './WishlistButton';
import { useCallback, useRef, useMemo, useState, useEffect, memo } from 'react';
import { useLoginModal } from '../hooks/useLoginModal';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { useFavoritesStore } from '@/app/stores/favoritesStore';
import { debounce } from '@/app/utils/debounce';
import toast from 'react-hot-toast';
import { useLocaleStore } from '@/app/stores/localeStore';
import CurrencyDisplay from '../common/CurrencyDisplay';
import { getReviewHighlights } from './PropertyHilights';
import { useIntersectionObserver } from '@/app/hooks/useIntersectionObserver';
import StarRating from '../reviews/StarRating';
import ReviewTag from '../reviews/ReviewTag';

interface PropertyListItemProps {
  property: PropertyType;
  isFirstScreen?: boolean;
  translations?: {
    title: string;
    city: string;
    country: string;
  };
}

const PropertyListItem = memo(({ property, translations, isFirstScreen }: PropertyListItemProps) => {
  const t = useTranslations('properties');
  const tFavorites = useTranslations('favorites');
  const router = useRouter();
  const loginModal = useLoginModal();
  const itemRef = useRef<HTMLDivElement>(null);
  const { locale } = useLocaleStore();
  
  const isInViewport = useIntersectionObserver(itemRef, {
    rootMargin: '200px',
    threshold: 0.1
  });
  
  const [screenWidth, setScreenWidth] = useState<number>(1024);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      setScreenWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);
  
  const getOptimalPropertyImage = useMemo(() => {
    if (!property.images || property.images.length === 0) {
      return '/placeholder.jpg';
    }
    
    const mainImage = property.images[0];

    if (screenWidth >= 1024) {
      return mainImage.mediumURL || mainImage.imageURL;
    }
    
    if (screenWidth >= 768) {
      return mainImage.mediumURL || mainImage.imageURL;
    }
    
    return mainImage.mediumURL || mainImage.thumbnailURL || mainImage.imageURL;
  }, [property.images, screenWidth]);

  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  // 获取评论亮点 - 优先使用真实数据，fallback到虚假数据
  const reviewHighlights = useMemo(() => {
    const hasRealReviewData = property.most_popular_tags && property.most_popular_tags.length > 0;
    return hasRealReviewData 
      ? property.most_popular_tags!.map(tag => tag.name)
      : getReviewHighlights(property, locale);
  }, [property, locale]);

  const translatedTitle =
    locale !== 'en' && translations?.title ? translations.title : property.title;

  const translatedCity = locale !== 'en' && translations?.city ? translations.city : property.city;

  const translatedCountry =
    locale !== 'en' && translations?.country ? translations.country : property.country;

  const debouncedToggleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      const handleToggle = debounce(async () => {
        if (!isAuthenticated) {
          loginModal.onOpen();
          return;
        }

        try {
          const wasInFavorites = isFavorite(property.id);
          await toggleFavorite(property.id);

          if (wasInFavorites) {
            toast.success(tFavorites('removed'));
          } else {
            toast.success(tFavorites('added'));
          }
        } catch (error: any) {
          if (error.message === 'No authentication token available') {
            loginModal.onOpen();
          } else {
            console.error('Error toggling wishlist:', error);
            toast.error(tFavorites('error'));
          }
        }
      }, 300);

      handleToggle();
    },
    [property.id, isAuthenticated, loginModal, toggleFavorite, isFavorite, tFavorites]
  );

  return (
    <div
      className="relative group animate-fade-in hover:-translate-y-0.5 transition-all duration-300 ease-in-out"
      ref={itemRef}
    >
      <div
        className="cursor-pointer overflow-hidden rounded-xl bg-white transition-all duration-300 ease-in-out hover:shadow-md h-full flex flex-col"
        onClick={() => router.push({ pathname: '/properties/[id]', params: { id: property.id } })}
      >
        <div className="relative overflow-hidden aspect-square rounded-t-xl flex-shrink-0">
          {/* Image */}
          <Image
            src={getOptimalPropertyImage}
            alt={property.title}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            fill
            className="object-cover w-full h-full"
            quality={screenWidth >= 1024 ? 80 : 75}
            loading={isFirstScreen ? "eager" : isInViewport ? "eager" : "lazy"}
            priority={isFirstScreen || isInViewport}
            fetchPriority={isFirstScreen ? "high" : "auto"}
          />
          {/* Pricetag */}
          <div className="absolute bottom-3 left-3 bg-white bg-opacity-90 py-1 px-2 rounded-lg shadow-sm">
            <p className="text-sm font-semibold text-gray-900">
              <CurrencyDisplay amount={property.price_per_night} />{' '}
              <span className="text-xs font-medium text-gray-600">{t('perNight')}</span>
            </p>
          </div>
        </div>

        <div className="p-3 flex flex-col flex-grow">
          {/* Title - 固定2行高度 */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 h-14 flex items-center">
            {translatedTitle}
          </h3>

          {/* Location - 固定1行高度 */}
          <p className="text-sm text-gray-600 mt-1 line-clamp-1 h-5">
            {translatedCity}, {translatedCountry}
          </p>

          {/* Rating & Reviews - 固定高度 */}
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

          {/* Highlights/Tags - 固定高度，推到底部 */}
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

              {/* Wishlist Button */}
              <div onClick={e => e.stopPropagation()} className="ml-2 flex-shrink-0">
                <WishlistButton
                  isFavorited={isFavorite(property.id)}
                  onToggle={debouncedToggleWishlist}
                  isInline={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PropertyListItem;
