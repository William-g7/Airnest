'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@auth/client/authStore';
import { useLoginModal } from '@auth/client/modalStore';
import apiService from '@auth/client/clientApiService';
import toast from 'react-hot-toast';
import ReviewsSummary from './Reviews.Summary';
import ReviewsAIInsights from './Reviews.AIInsights';
import ReviewsList from './Reviews.List';
import ReviewsForm from './Reviews.Form';
import Button from '@sharedUI/Button';

export type Review = {
  id: string;
  rating: number;
  title?: string;
  content: string;
  created_at: string;
  is_verified?: boolean;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
};

export type ReviewStats = {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number; 4: number; 3: number; 2: number; 1: number;
  };
};

interface ReviewsProps {
  propertyId: string;
  propertyStatus?: string; // 'draft' 时不取数
}

export default function Reviews({ propertyId, propertyStatus }: ReviewsProps) {
  const t = useTranslations('reviews');
  const authStore = useAuthStore();
  const loginModal = useLoginModal();

  // data
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  // ui state
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (propertyStatus === 'draft') {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const [r, s] = await Promise.all([
          apiService.getPropertyReviews(propertyId),
          apiService.getPropertyReviewStats(propertyId),
        ]);
        setReviews(r.reviews || r.results || []);
        setStats(s);
      } catch (e) {
        console.error('fetch reviews error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId, propertyStatus]);

  const handleSubmit = async () => {
    if (!authStore.isAuthenticated) {
      loginModal.open();
      return;
    }
    if (!formContent.trim()) {
      toast.error(t('contentRequired'));
      return;
    }
    try {
      setSubmitting(true);
      await apiService.createPropertyReview(propertyId, {
        rating: formRating,
        title: formTitle.trim() || undefined,
        content: formContent.trim(),
      });
      toast.success(t('reviewSubmitted'));
      setShowForm(false);
      setFormRating(5);
      setFormTitle('');
      setFormContent('');
      // refresh
      const [r, s] = await Promise.all([
        apiService.getPropertyReviews(propertyId),
        apiService.getPropertyReviewStats(propertyId),
      ]);
      setReviews(r.reviews || r.results || []);
      setStats(s);
    } catch (e) {
      console.error('submit review error', e);
      toast.error(t('submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-16 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const safe = Array.isArray(reviews) ? reviews : [];
  const displayed = showAll ? safe : safe.slice(0, 6);

  return (
    <div className="py-6">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          {t('reviews')} {stats ? `(${stats.total_reviews})` : ''}
        </h2>
        {authStore.isAuthenticated && (
          <Button
            onClick={() => setShowForm(v => !v)}
            label={showForm ? t('cancelReview') : t('writeReview')}
            className="bg-airbnb hover:bg-airbnb_dark text-white px-6 py-2 rounded-lg font-medium"
          />
        )}
      </div>

      {/* summary */}
      {stats && stats.total_reviews > 0 && (
        <ReviewsSummary stats={stats} />
      )}

      {/* AI insights */}
      {stats && (
        <ReviewsAIInsights propertyId={propertyId} totalReviews={stats.total_reviews} />
      )}

      {/* form */}
      {showForm && (
        <ReviewsForm
          rating={formRating}
          title={formTitle}
          content={formContent}
          onChangeRating={setFormRating}
          onChangeTitle={setFormTitle}
          onChangeContent={setFormContent}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* list */}
      <ReviewsList
        reviews={displayed}
        total={safe.length}
        showAll={showAll}
        onToggleShowAll={() => setShowAll(v => !v)}
      />
    </div>
  );
}
