'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Link } from '@i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@auth/hooks/useAuth';
import { useLoginModal } from '@auth/client/modalStore';
import { useFavoritesStore } from '@favorites/client/favoritesStore';
import CurrencyDisplay from '@currency/ui/CurrencyDisplay';
import FavoriteButton from '@favorites/ui/FavoriteButton';
import StarRating from '@properties/reviews/StarRating';
import PriceBadge from './PriceBadge';
import TagsLine from './TagsLine';
import toast from 'react-hot-toast';
import type { PropertyType } from '@properties/types/Property';

interface PropertyCardCSRProps {
  property: PropertyType;
  isFirstScreen?: boolean;
  isInitiallyFavorited?: boolean;
  translations?: {
    title: string;
    city: string;
    country: string;
  };
}

export default function PropertyCardCSR({
  property,
  translations,
  isFirstScreen = false,
  isInitiallyFavorited = false,
}: PropertyCardCSRProps) {
  const t = useTranslations('properties');
  const tTags = useTranslations('tags');
  const { isAuthenticated } = useAuth();
  const loginModal = useLoginModal();
  const locale = useLocale();

  const [screenWidth, setScreenWidth] = useState<number>(1024);
  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    setScreenWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const imageSrc = property.images?.[0]?.imageURL ?? '/placeholder.jpg';

  // 收藏：store 为单一真源 + SSR 水合保护
  const initialized     = useFavoritesStore(s => s.initialized);
  const toggleFavorite  = useFavoritesStore(s => s.toggleFavorite);
  const isFavFromStore  = useFavoritesStore(s => s.favorites.has(property.id));
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const ready = hydrated && initialized;
  const isFavoritedForUI = ready ? isFavFromStore : isInitiallyFavorited;

  const onToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated) {
        loginModal.open();
        return;
      }
      try {
        const after = await toggleFavorite(property.id);
        toast.success(after ? t('added', { namespace: 'favorites' } as any) : t('removed', { namespace: 'favorites' } as any));
      } catch {
        toast.error('Error');
      }
    },
    [isAuthenticated, loginModal, toggleFavorite, property.id, t]
  );

  const tagIds = property.property_tags ?? [];
  const displayTitle   = locale !== 'en' && translations?.title   ? translations.title   : property.title;
  const displayCity    = locale !== 'en' && translations?.city    ? translations.city    : property.city;
  const displayCountry = locale !== 'en' && translations?.country ? translations.country : property.country;

  return (
    <div className="relative group animate-fade-in hover:-translate-y-0.5 transition-all duration-300 ease-in-out">
      <div className="overflow-hidden rounded-xl bg-white transition-all duration-300 ease-in-out hover:shadow-md h-full flex flex-col">
        
        <Link
          href={{ pathname: '/properties/[id]', params: { id: property.id } }}
          aria-label={displayTitle || property.title || 'Open property'}
          className="absolute inset-0 z-10"
        />
          <div
            className="relative overflow-hidden aspect-square rounded-t-xl flex-shrink-0 block"
          >
          {/* 图片 */}
          <Image
            src={imageSrc}
            alt={displayTitle || property.title || 'property image'}
            sizes="(min-width:1280px) 20vw, (min-width:1024px) 25vw, (min-width:768px) 33vw, (min-width:640px) 50vw, 100vw"
            fill
            className="object-cover w-full h-full"
            quality={screenWidth >= 1024 ? 80 : 75}
            loading={isFirstScreen ? 'eager' : 'lazy'}
            priority={isFirstScreen}
          />
          <PriceBadge
            priceNode={<CurrencyDisplay amount={Number(property.price_per_night as any)} />}
            perNightLabel={t('perNight')}
          />
        </div>

        <div className="p-3 flex flex-col flex-grow">
          {/* 标题/地点*/}
          <div className='block'>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 h-14 flex items-center">
              {displayTitle}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1 h-5">
              {displayCity}, {displayCountry}
            </p>
          </div>

          {/* 评分 */}
          <div className="mt-2 h-6 flex items-center">
            {property.average_rating && property.total_reviews && property.total_reviews > 0 ? (
              <div className="flex items-center space-x-2">
                <StarRating rating={property.average_rating} readOnly size="small" />
                <span className="text-sm text-gray-600">
                  {property.average_rating.toFixed(1)} · {property.total_reviews} {t('reviews')}
                </span>
              </div>
            ) : (
              <div />
            )}
          </div>

          {/* 标签 + 收藏*/}
          <div className="mt-2 flex-grow flex items-end">
            <div className="w-full flex items-center justify-between">
              <TagsLine
                tagIds={tagIds}
                renderTag={(id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700 px-2 py-0.5 text-xs"
                  >
                    {tTags(id)}
                  </span>
                )}
              />

              <div
               className="ml-2 flex-shrink-0 relative z-30"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <FavoriteButton isFavorited={isFavoritedForUI} onToggle={onToggle} isInline />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
