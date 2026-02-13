'use client';

import Button from '@sharedUI/Button';
import ReviewCard from './ReviewCard';
import type { Review } from './Reviews.Container';
import { useTranslations } from 'next-intl';

interface Props {
  reviews: Review[];
  total: number;
  showAll: boolean;
  onToggleShowAll: () => void;
}

export default function ReviewsList({ reviews, total, showAll, onToggleShowAll }: Props) {
  const t = useTranslations('reviews');

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">{t('noReviews')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map(r => (
        <ReviewCard key={r.id} review={r} />
      ))}

      {total > 6 && (
        <div className="text-center">
          <Button
            onClick={onToggleShowAll}
            label={showAll ? t('showLess') : t('showAllReviews', { count: total - 6 })}
            className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-6 py-2 rounded-lg font-medium"
          />
        </div>
      )}
    </div>
  );
}
