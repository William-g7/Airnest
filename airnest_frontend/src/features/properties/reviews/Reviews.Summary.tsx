'use client';

import StarRating from '@properties/reviews/StarRating';
import type { ReviewStats } from './Reviews.Container';
import { useTranslations } from 'next-intl';

export default function ReviewsSummary({ stats }: { stats: ReviewStats }) {
  const t = useTranslations('reviews');

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <StarRating rating={stats.average_rating} size="large" />
          <span className="text-2xl font-semibold">{stats.average_rating}</span>
          <span className="text-gray-600">
            ({stats.total_reviews} {t('reviewsCount')})
          </span>
        </div>
      </div>
    </div>
  );
}
