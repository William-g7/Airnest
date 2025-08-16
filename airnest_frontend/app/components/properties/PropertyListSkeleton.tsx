'use client';

import { memo } from 'react';

// 使用memo包装组件，防止不必要的重新渲染
const PropertySkeleton = memo(({ index }: { index: number }) => (
  <div
    className="bg-white rounded-xl overflow-hidden shadow-sm"
    style={{ 
      animationDelay: `${index * 0.05}s`,
      opacity: 1
    }}
  >
    <div className="relative overflow-hidden aspect-square rounded-t-xl bg-gray-200 animate-pulse" />
    <div className="p-3">
      <div className="h-6 bg-gray-200 rounded-md animate-pulse mb-2" />
      <div className="h-4 bg-gray-200 rounded-md animate-pulse w-3/4 mb-2" />
      <div className="flex gap-2 mt-2">
        <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
));

// 设置组件显示名称，便于开发调试
PropertySkeleton.displayName = 'PropertySkeleton';

// 使用memo包装整个骨架屏组件
const PropertyListSkeleton = memo(({ count = 10 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
      {[...Array(count)].map((_, index) => (
        <PropertySkeleton key={index} index={index} />
      ))}
    </div>
  );
});

PropertyListSkeleton.displayName = 'PropertyListSkeleton';

export default PropertyListSkeleton; 