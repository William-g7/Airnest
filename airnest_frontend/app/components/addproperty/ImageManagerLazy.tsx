'use client';

import { lazy, Suspense } from 'react';
import { ImageData } from './ImageManager';

// 动态导入 ImageManager 组件
const ImageManager = lazy(() => import('./ImageManager'));

interface ImageManagerLazyProps {
  propertyId: string;
  initialImages: ImageData[];
  onImagesChange?: (images: ImageData[]) => void;
}

function ImageManagerSkeleton() {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square bg-gray-200 rounded-xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export default function ImageManagerLazy(props: ImageManagerLazyProps) {
  return (
    <Suspense fallback={<ImageManagerSkeleton />}>
      <ImageManager {...props} />
    </Suspense>
  );
}