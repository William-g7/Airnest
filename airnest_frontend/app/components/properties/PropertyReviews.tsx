'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/app/stores/authStore';
import { useLoginModal } from '@/app/components/hooks/useLoginModal';
import apiService from '@/app/services/apiService';
import StarRating from '../reviews/StarRating';
import ReviewTag from '../reviews/ReviewTag';
import CustomButton from '../common/CustomButton';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  rating: number;
  title?: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  tags: Array<{
    tag_key: string;
    name_en: string;
    name_zh: string;
    name_fr: string;
    color: string;
    category: string;
  }>;
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  most_popular_tags: Array<{
    key: string;
    name: string;
    color: string;
    count: number;
  }>;
}

interface ReviewTag {
  tag_key: string;
  name_en: string;
  name_zh: string;
  name_fr: string;
  color: string;
  category: string;
}

interface PropertyReviewsProps {
  propertyId: string;
  propertyStatus?: string; // 添加房源状态参数
}

export default function PropertyReviews({ propertyId, propertyStatus }: PropertyReviewsProps) {
  const t = useTranslations('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [availableTags, setAvailableTags] = useState<ReviewTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Review form state
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authStore = useAuthStore();
  const loginModal = useLoginModal();

  useEffect(() => {
    // 草稿房源不加载评论
    if (propertyStatus !== 'draft') {
      fetchReviewsAndStats();
      fetchAvailableTags();
    } else {
      setIsLoading(false);
    }
  }, [propertyId, propertyStatus]);

  const fetchReviewsAndStats = async () => {
    try {
      setIsLoading(true);
      const [reviewsData, statsData] = await Promise.all([
        apiService.getPropertyReviews(propertyId),
        apiService.getPropertyReviewStats(propertyId)
      ]);
      
      
      setReviews(reviewsData.reviews || reviewsData.results || []);
      setReviewStats(statsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      console.error('Error details:', {
        message: (error as any)?.message || 'Unknown error',
        statusCode: (error as any)?.statusCode || 'Unknown',
        errorType: (error as any)?.errorType || 'Unknown'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const tagsData = await apiService.getReviewTags();
      setAvailableTags(tagsData);
    } catch (error) {
      console.error('Error fetching review tags:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!authStore.isAuthenticated) {
      loginModal.onOpen();
      return;
    }

    if (!formContent.trim()) {
      toast.error(t('contentRequired'));
      return;
    }

    try {
      setIsSubmitting(true);
      await apiService.createPropertyReview(propertyId, {
        rating: formRating,
        title: formTitle.trim() || undefined,
        content: formContent.trim(),
        tag_keys: formTags
      });

      toast.success(t('reviewSubmitted'));
      setShowReviewForm(false);
      setFormRating(5);
      setFormTitle('');
      setFormContent('');
      setFormTags([]);
      fetchReviewsAndStats(); // Refresh reviews
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tagKey: string) => {
    setFormTags(prev => 
      prev.includes(tagKey) 
        ? prev.filter(key => key !== tagKey)
        : [...prev, tagKey]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const displayedReviews = showAllReviews ? safeReviews : safeReviews.slice(0, 6);

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          {t('reviews')} {reviewStats && `(${reviewStats.total_reviews})`}
        </h2>
        
        {authStore.isAuthenticated && (
          <CustomButton
            onClick={() => setShowReviewForm(!showReviewForm)}
            label={showReviewForm ? t('cancelReview') : t('writeReview')}
            className="bg-airbnb hover:bg-airbnb_dark text-white px-6 py-2 rounded-lg font-medium"
          />
        )}
      </div>

      {/* Review Stats Summary */}
      {reviewStats && reviewStats.total_reviews > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <StarRating rating={reviewStats.average_rating} size="large" />
              <span className="text-2xl font-semibold">{reviewStats.average_rating}</span>
              <span className="text-gray-600">({reviewStats.total_reviews} {t('reviewsCount')})</span>
            </div>
          </div>

          {/* Popular Tags */}
          {reviewStats.most_popular_tags && reviewStats.most_popular_tags.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-2">
                {reviewStats.most_popular_tags.slice(0, 6).map(tag => (
                  <ReviewTag
                    key={tag.key}
                    tag={{
                      tag_key: tag.key,
                      name: tag.name,
                      color: tag.color,
                      count: tag.count
                    }}
                    size="medium"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="mb-6 p-4 border rounded-lg bg-white">
          <h3 className="text-lg font-semibold mb-4">{t('writeReview')}</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('rating')}
            </label>
            <StarRating 
              rating={formRating}
              onRatingChange={setFormRating}
              readOnly={false}
              size="large"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('title')} ({t('optional')})
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-airbnb"
              placeholder={t('titlePlaceholder')}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('content')} *
            </label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-airbnb"
              placeholder={t('contentPlaceholder')}
              required
            />
          </div>

          {/* Tag Selection */}
          {availableTags.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('selectTags')} ({t('optional')})
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag.tag_key}
                    onClick={() => toggleTag(tag.tag_key)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      formTags.includes(tag.tag_key)
                        ? 'bg-airbnb text-white border-airbnb'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-airbnb'
                    }`}
                  >
                    {tag.name_en}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <CustomButton
              onClick={handleSubmitReview}
              label={isSubmitting ? t('submitting') : t('submitReview')}
              disabled={isSubmitting || !formContent.trim()}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
            />
            <CustomButton
              onClick={() => setShowReviewForm(false)}
              label={t('cancel')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
            />
          </div>
        </div>
      )}

      {/* Reviews List */}
      {safeReviews.length > 0 ? (
        <div className="space-y-6">
          {displayedReviews.map(review => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {review.user.avatar_url ? (
                    <img
                      src={review.user.avatar_url}
                      alt={review.user.name || 'User'}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 text-lg font-semibold">
                        {(review.user.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{review.user.name || 'Anonymous'}</h4>
                    <StarRating rating={review.rating} size="small" />
                    <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                  </div>
                  
                  {review.title && (
                    <h5 className="font-medium text-gray-800 mb-2">{review.title}</h5>
                  )}
                  
                  <p className="text-gray-700 mb-3 whitespace-pre-line">{review.content}</p>
                  
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {review.tags.map(tag => (
                        <ReviewTag
                          key={tag.tag_key}
                          tag={{
                            tag_key: tag.tag_key,
                            name: tag.name_en, // Use English by default, can be made dynamic
                            color: tag.color
                          }}
                          size="small"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {safeReviews.length > 6 && (
            <div className="text-center">
              <CustomButton
                onClick={() => setShowAllReviews(!showAllReviews)}
                label={showAllReviews ? t('showLess') : t('showAllReviews', { count: safeReviews.length - 6 })}
                className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-6 py-2 rounded-lg font-medium"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('noReviews')}</p>
        </div>
      )}
    </div>
  );
}