'use client';

import { useTranslations } from 'next-intl';
import StarRating from './StarRating';
import ReviewTag from './ReviewTag';
import Image from 'next/image';
import { format } from 'date-fns';
import { useLocaleStore } from '@/app/stores/localeStore';

interface ReviewCardProps {
  review: {
    id: string;
    user: {
      id: string;
      name: string;
      avatar_url?: string;
    };
    rating: number;
    title: string;
    content: string;
    tags: Array<{
      tag_key: string;
      name_en: string;
      name_zh: string;
      name_fr: string;
      color: string;
    }>;
    created_at: string;
    is_verified: boolean;
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const t = useTranslations('reviews');
  const { locale } = useLocaleStore();
  
  // 根据当前语言环境获取标签名称
  const getTagName = (tag: any) => {
    switch(locale) {
      case 'zh':
        return tag.name_zh;
      case 'fr':
        return tag.name_fr;
      default:
        return tag.name_en;
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM yyyy');
    } catch {
      return dateString;
    }
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* 用户信息和评分 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10">
            <Image
              src={review.user.avatar_url || '/images/default-avatar.png'}
              alt={review.user.name}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900">{review.user.name}</h4>
              {review.is_verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {t('verified')}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
          </div>
        </div>
        
        <StarRating rating={review.rating} readOnly size="small" />
      </div>
      
      {/* 评论标题 */}
      {review.title && (
        <h5 className="font-medium text-gray-900 mb-2">
          {review.title}
        </h5>
      )}
      
      {/* 评论内容 */}
      <p className="text-gray-700 leading-relaxed mb-4">
        {review.content}
      </p>
      
      {/* 标签 */}
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.tags.map((tag) => (
            <ReviewTag
              key={tag.tag_key}
              tag={{
                tag_key: tag.tag_key,
                name: getTagName(tag),
                color: tag.color
              }}
              size="small"
            />
          ))}
        </div>
      )}
    </div>
  );
}