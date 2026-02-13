import React from 'react';

interface PriceBadgeProps {
  priceNode: React.ReactNode;
  perNightLabel: string;
  className?: string;
}

/** 统一的价格徽章样式（放在图片容器里） */
export default function PriceBadge({
  priceNode,
  perNightLabel,
  className = '',
}: PriceBadgeProps) {
  return (
    <div
      className={
        'absolute bottom-3 left-3 bg-white bg-opacity-90 py-1 px-2 rounded-lg shadow-sm ' +
        className
      }
    >
      <p className="text-sm font-semibold text-gray-900">
        {priceNode}
        <span className="text-xs font-medium text-gray-600 ml-1">
          {perNightLabel}
        </span>
      </p>
    </div>
  );
}
