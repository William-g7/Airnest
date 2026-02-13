import Image from 'next/image';
import { Link } from '@i18n/navigation';
import { getTranslations } from 'next-intl/server';
import CurrencySSR from '@currency/server/CurrencySSR';
import { WishlistIsland } from '@favorites/ui/WishlistIsland';
import StarRating from '@properties/reviews/StarRating';
import PriceBadge from './PriceBadge';
import TagsLine from './TagsLine';
import type { PropertyType } from '@properties/types/Property';
import React from 'react';

interface PropertyCardSSRProps {
  property: PropertyType;
  locale: string;
  isFirstScreen?: boolean;
  isLCPCandidate?: boolean; 
  isHero?: boolean;
  isInitiallyFavorited?: boolean;
  translations?: {
    title?: string;
    city?: string;
    country?: string;
  };
}

export default async function PropertyCardSSR({
  property,
  locale,
  isLCPCandidate = false,
  isHero = false,
  isInitiallyFavorited = false,
  translations,
}: PropertyCardSSRProps) {
  const t = await getTranslations('properties');
  const tTags = await getTranslations('tags');

  const imageSrc = property.images?.[0]?.imageURL ?? '/placeholder.jpg';

  const displayTitle =
    locale !== 'en' && translations?.title ? translations.title : property.title;
  const displayCity =
    locale !== 'en' && translations?.city ? translations.city : property.city;
  const displayCountry =
    locale !== 'en' && translations?.country ? translations.country : property.country;

    const tagIds = property.property_tags ?? [];

  const chipBase = 'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs';

  return (
    <div className={`relative group ${isHero ? 'lg:col-span-2' : ''} animate-fade-in hover:-translate-y-0.5 transition-all duration-300 ease-in-out` }>
      <div className={'relative overflow-hidden rounded-xl bg-white transition-all duration-300 ease-in-out hover:shadow-md h-full flex flex-col'}>
        <Link
          href={{ pathname: '/properties/[id]', params: { id: property.id } }}
          aria-label={'Open property'}
          className="absolute inset-0 z-10"
        />

        {/* 图片 */}
        <div
          className={[
            'relative overflow-hidden rounded-t-xl flex-shrink-0 block',
            isHero ? 'aspect-square lg:aspect-[2/1]' : 'aspect-square',
          ].join(' ')}
        >
          <Image
            src={imageSrc}
            alt={property.title || 'property image'}
            sizes={
              isHero
                ? '(min-width:1280px) 40vw, (min-width:1024px) 50vw, 100vw'
                : '(min-width:1280px) 20vw, (min-width:1024px) 25vw, (min-width:768px) 33vw, (min-width:640px) 50vw, 100vw'
            }
            fill
            className="object-cover w-full h-full"
            quality={85}
            priority={isLCPCandidate}
            loading={isLCPCandidate ? 'eager' : 'lazy'}
            fetchPriority={isLCPCandidate ? 'high' : 'low'}
          />

          {/* 价格徽章 */}
          <div className="relative z-5">
            <PriceBadge
              priceNode={<CurrencySSR amountUSD={property.price_per_night} locale={locale} />}
              perNightLabel={t('perNight')}
            />
          </div>
        </div>

        <div className="p-3 flex flex-col flex-grow relative z-5">
          {/* 标题 */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 h-14 flex items-center">
            {displayTitle}
          </h3>

          {/* 位置行：城市 + Trending（仅 hero） */}
          <div className="mt-1 h-5 flex items-center justify-between">
            <p className="text-sm text-gray-600 line-clamp-1">
              {displayCity}, {displayCountry}
            </p>

            {isHero && (
              <span className={`${chipBase} hidden lg:inline-flex border-gray-200 bg-gray-50 text-gray-700`}>
                <SvgIcon src="/icons/trending.svg" className="h-3.5 w-3.5" />
                <span>{t('trending')}</span>
              </span>
            )}
          </div>

          {/* 评分行：评分 + 两个徽章（仅 hero） */}
          <div className="mt-2 h-6 flex items-center justify-between">
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

              {isHero && (
                <div className="hidden lg:flex items-center gap-2">
                  <span className={`${chipBase} border-gray-200 bg-gray-50 text-gray-700`}>
                    <SvgIcon src="/icons/star.svg" className="h-3.5 w-3.5" />
                    <span>{t('newThisWeek')}</span>
                  </span>
                  <span className={`${chipBase} border-transparent bg-airbnb text-white shadow-sm`}>
                    <SvgIcon src="/icons/discount.svg" className="h-3.5 w-3.5 text-white" />
                    <span>{t('todaysDeal')}</span>
                  </span>
                </div>
              )}
          </div>

          {/* 标签 + 收藏 */}
          <div className="mt-2 flex-grow flex items-end">
            <div className="w-full flex items-center justify-between">
              <TagsLine
                tagIds={tagIds}
                max={isHero ? 4 : 2}
                expand={false}
                 className="relative z-20 max-h-8 overflow-hidden lg:max-h-none lg:overflow-visible"
                renderTag={(id) => (
                  <span
                    key={id}
                    className='inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700 px-2 py-0.5 text-xs'
                  >
                    {tTags(id)}
                  </span>
                )}
              />

              {/* 收藏按钮 */}
              <div className="ml-2 flex-shrink-0 relative z-30">
                <WishlistIsland
                  propertyId={property.id}
                  initialIsFavorited={isInitiallyFavorited}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SvgIcon - 使用 public/icons 下的外链 SVG，并用 CSS mask 让图标继承文字颜色（currentColor）。
 * 这样无需内联 SVG，代码更简洁，且可通过父元素的 text-* 类改变图标颜色。
 */
function SvgIcon({ src, className = '' }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block align-middle bg-current ${className}`}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
      } as React.CSSProperties}
    />
  );
}
