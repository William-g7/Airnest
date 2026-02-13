'use client';

import StarRating from '@/src/features/properties/reviews/StarRating';
import Button from '@sharedUI/Button';
import { useTranslations } from 'next-intl';

interface Props {
  rating: number;
  title: string;
  content: string;
  onChangeRating: (r: number) => void;
  onChangeTitle: (s: string) => void;
  onChangeContent: (s: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function ReviewsForm({
  rating,
  title,
  content,
  onChangeRating,
  onChangeTitle,
  onChangeContent,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  const t = useTranslations('reviews');

  return (
    <div className="mb-6 p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4">{t('writeReview')}</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('rating')}
        </label>
        <StarRating rating={rating} onRatingChange={onChangeRating} readOnly={false} size="large" />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('title')} ({t('optional')})
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-airbnb"
          placeholder={t('titlePlaceholder')}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('content')} *
        </label>
        <textarea
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-airbnb"
          placeholder={t('contentPlaceholder')}
          required
        />
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onSubmit}
          label={submitting ? t('submitting') : t('submitReview')}
          disabled={submitting || !content.trim()}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
        />
        <Button
          onClick={onCancel}
          label={t('cancel')}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
        />
      </div>
    </div>
  );
}
