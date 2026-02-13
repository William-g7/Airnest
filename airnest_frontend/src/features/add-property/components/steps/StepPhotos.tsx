'use client';

import { useTranslations } from 'next-intl';
import ImageManager from '@addProperty/components/ImageManager';
import type { ImagePreviewData, R2ImageData } from '@addProperty/types';

interface StepPhotosProps {
  imagePreviewData: ImagePreviewData[];
  setImagePreviewData: (imgs: ImagePreviewData[]) => void;
  existingImages: R2ImageData[];
  isEditMode: boolean;
}

export default function StepPhotos({
  imagePreviewData,
  setImagePreviewData,
  existingImages,
  isEditMode
}: StepPhotosProps) {
  const t = useTranslations('addProperty');

  return (
    <div className="space-y-6">
      <ImageManager
        images={imagePreviewData}
        onImagesChange={setImagePreviewData}
        maxImages={5}
        maxSizeKB={5120}
      />

      {imagePreviewData.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            {t('imagesSelectedWillUpload', { count: imagePreviewData.length })}
          </p>
        </div>
      )}

      {isEditMode && existingImages.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">{t('existingImages')}</h3>
          <div className="grid grid-cols-3 gap-4">
            {existingImages.map((img, index) => (
              <div key={img.id || index} className="relative aspect-square rounded-lg overflow-hidden border">
                <img
                  src={img.fileUrl}
                  alt={t('existingImageAlt', { index: index + 1 })}
                  className="w-full h-full object-cover"
                />
                {img.isMain && (
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                    {t('mainPhoto')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
