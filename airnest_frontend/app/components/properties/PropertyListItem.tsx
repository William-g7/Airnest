'use client';

import { PropertyType } from '@/app/constants/propertyType';
import Image from 'next/image';
import WishlistButton from './WishlistButton';
import { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import { useLoginModal } from '../hooks/useLoginModal';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { useFavoritesStore } from '@/app/stores/favoritesStore';
import { debounce } from '@/app/utils/debounce';
import toast from 'react-hot-toast';
import { useLocaleStore } from '@/app/stores/localeStore';
import CurrencyDisplay from '../common/CurrencyDisplay';
import { motion } from 'framer-motion';
import { getReviewHighlights } from './PropertyHilights';
import { useIntersectionObserver } from '@/app/hooks/useIntersectionObserver';

interface PropertyListItemProps {
  property: PropertyType;
  translations?: {
    title: string;
    city: string;
    country: string;
  };
}

const PropertyListItem = ({ property, translations }: PropertyListItemProps) => {
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

  const reviewHighlights = useMemo(() => getReviewHighlights(property, locale), [property, locale]);

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
    <motion.div
      className="relative group"
      ref={itemRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      <div
        className="cursor-pointer overflow-hidden rounded-xl bg-white transition-all duration-300 ease-in-out hover:shadow-md"
        onClick={() => router.push({ pathname: '/properties/[id]', params: { id: property.id } })}
      >
        <div className="relative overflow-hidden aspect-square rounded-t-xl">
          {/* Image */}
          <Image
            src={getOptimalPropertyImage}
            alt={property.title}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            fill
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
            quality={screenWidth >= 1024 ? 85 : 80}
            loading={isInViewport ? "eager" : "lazy"}
            priority={isInViewport}
          />
          {/* Pricetag */}
          <div className="absolute bottom-3 left-3 bg-white bg-opacity-90 py-1 px-2 rounded-lg shadow-sm">
            <p className="text-sm font-semibold text-gray-900">
              <CurrencyDisplay amount={property.price_per_night} />{' '}
              <span className="text-xs font-medium text-gray-600">{t('perNight')}</span>
            </p>
          </div>
        </div>

        <div className="p-3">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{translatedTitle}</h3>

          {/* Location */}
          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
            {translatedCity}, {translatedCountry}
          </p>

          {/* Highlights */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {reviewHighlights.map((highlight, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs font-medium text-gray-800"
                >
                  {highlight}
                </span>
              ))}
            </div>

            {/* Wishlist Button */}
            <div onClick={e => e.stopPropagation()} className="ml-2">
              <WishlistButton
                isFavorited={isFavorite(property.id)}
                onToggle={debouncedToggleWishlist}
                isInline={true}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyListItem;
