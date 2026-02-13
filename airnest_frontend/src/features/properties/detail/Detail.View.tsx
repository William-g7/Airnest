'use client';

import FavoriteButton from '@favorites/ui/FavoriteButton';
import ImageCarousel from '@properties/images/ImageCarousel';
import ReservationSidebar from '@properties/reservation/Reservation.Sidebar';
import Reviews from '@properties/reviews/Reviews.Container';
import type { PropertyType } from '@properties/types/Property'
import HostCard from './HostCard';
import MetaSummary from './MetaSummary';
import Description from './Description';
import Features from './Features';

type DetailViewProps = {
  property: PropertyType;
  tx: { title?: string; description?: string; city?: string; country?: string };
  txLoading: boolean;
  isLandlord: boolean;
  isFavorited: boolean;
  onToggleWishlist: () => void;
  onEdit: () => void;
};

export default function DetailView({
  property,
  tx,
  txLoading,
  isLandlord,
  isFavorited,
  onToggleWishlist,
  onEdit,
}: DetailViewProps) {
  return (
    <div className="relative">
      {/* 浮动收藏按钮 */}
      <FavoriteButton isFavorited={isFavorited} onToggle={onToggleWishlist} />

      {/* 轮播图 */}
      <ImageCarousel images={property.images} title={property.title} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* 左侧：详情 */}
        <div className="md:col-span-7 lg:col-span-8">
          <h1 className="text-4xl font-semibold mb-4">
            {txLoading ? <span className="animate-pulse">{property.title}</span> : (tx.title ?? property.title)}
          </h1>

          <p className="text-lg text-gray-600 mb-2">
            📍 {txLoading ? property.city : (tx.city ?? property.city)},
            {txLoading ? property.country : (tx.country ?? property.country)}
          </p>

          <MetaSummary property={property} />

          <hr className="my-6" />

          <HostCard
            landlord={property.landlord}
            isLandlord={isLandlord}
            onEdit={onEdit}
          />

          <hr className="my-6" />

          <Description text={tx.description ?? property.description} loading={txLoading} />

          <Features tagIds={property.property_tags ?? []} />

          <hr className="my-6" />

          <Reviews propertyId={property.id} propertyStatus={property.status} />
        </div>

        {/* 右侧：预订栏 */}
        <div className="md:col-span-5 lg:col-span-4">
          <ReservationSidebar property={property} />
        </div>
      </div>
    </div>
  );
}
