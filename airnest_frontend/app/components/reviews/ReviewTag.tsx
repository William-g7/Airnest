'use client';

import { useTranslations } from 'next-intl';

interface ReviewTagProps {
  tag: {
    tag_key: string;
    name: string;
    color: string;
    count?: number;
  };
  onClick?: () => void;
  selected?: boolean;
  size?: 'small' | 'medium';
}

export default function ReviewTag({ 
  tag, 
  onClick, 
  selected = false, 
  size = 'medium' 
}: ReviewTagProps) {
  const t = useTranslations('reviewTags');
  
  // 简单直接：直接使用tag_key作为翻译键值
  const displayText = t(tag.tag_key);
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm'
  };
  
  const baseClasses = `
    inline-flex items-center rounded-full font-medium transition-all duration-200
    ${sizeClasses[size]}
    ${onClick ? 'cursor-pointer hover:scale-105' : ''}
  `;
  
  const colorStyle = selected 
    ? { 
        backgroundColor: '#F3F4F6', 
        color: '#1F2937',
        borderColor: 'transparent'
      }
    : { 
        backgroundColor: '#F3F4F6', 
        color: '#1F2937',
        borderColor: 'transparent'
      };
  
  return (
    <span
      className={`${baseClasses} border`}
      style={colorStyle}
      onClick={onClick}
    >
      {displayText}
      {tag.count && (
        <span className="ml-1 text-xs opacity-75">
          ({tag.count})
        </span>
      )}
    </span>
  );
}