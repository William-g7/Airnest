'use client';

import { useTranslations } from 'next-intl';

interface PropertyTagProps {
  tagId: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export default function PropertyTag({
  tagId,
  size = 'medium',
  className = '',
  onClick,
  selected = false,
  disabled = false
}: PropertyTagProps) {
  const t = useTranslations('tags');

  const sizeClasses = {
    small:  'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large:  'px-4 py-2 text-base',
  }[size];

  return (
    <span
      role={onClick ? 'button' : undefined}
      aria-pressed={onClick ? selected : undefined}
      onClick={disabled ? undefined : onClick}
      className={[
        'inline-flex items-center rounded-full border transition-all select-none',
        sizeClasses,
        selected
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
        disabled ? 'opacity-50 cursor-not-allowed' : (onClick ? 'cursor-pointer' : ''),
        className
      ].join(' ')}
    >
      {t(tagId)}
    </span>
  );
}
