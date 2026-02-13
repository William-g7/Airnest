'use client';

import { useTranslations } from 'next-intl';
import StarRating from '@/src/features/properties/reviews/StarRating';
import Image from 'next/image';
import { format } from 'date-fns';

interface ReviewCardProps {
  review: {
    id: string;
    user: { id: string; name: string; avatar_url?: string };
    rating: number;
    title?: string;
    content: string;
    created_at: string;
    is_verified?: boolean;
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const t = useTranslations('reviews');

  const fmt = (s: string) => {
    try { return format(new Date(s), 'MMM yyyy'); } catch { return s; }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10">
            <Image
              src={review.user.avatar_url || '/images/default-avatar.png'}
              alt={review.user.name || 'User'}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900">{review.user.name || 'Anonymous'}</h4>
              {review.is_verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {t('verified')}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{fmt(review.created_at)}</p>
          </div>
        </div>
        <StarRating rating={review.rating} readOnly size="small" />
      </div>

      {review.title && <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>}
      <p className="text-gray-700 leading-relaxed">{review.content}</p>
    </div>
  );
}
