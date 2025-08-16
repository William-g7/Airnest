'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface ImageUploadProps {
  images: string[];
  setImages: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  setImages,
  maxImages = 3,
  maxSizeMB = 5,
}) => {
  const t = useTranslations('addProperty');
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setError(null);

      if (images.length + files.length > maxImages) {
        setError(t('tooManyImages', { maxImages }));
        return;
      }

      files.forEach(file => {
        if (!file.type.startsWith('image/')) {
          setError(t('invalidFileType'));
          return;
        }

        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
          setError(t('fileTooLarge', { maxSizeMB }));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          setImages([...images, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          id="image-upload"
          disabled={images.length >= maxImages}
        />
        <label
          htmlFor="image-upload"
          className={`cursor-pointer text-gray-600 hover:text-gray-900 ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="p-6">
            <p>{t('dragImages')}</p>
            <p className="text-sm text-gray-500">
              {t('uploadImagesLimit', { maxImages, maxSizeMB })}
            </p>
            {images.length >= maxImages && (
              <p className="text-sm text-amber-600 mt-2">{t('maxImagesReached')}</p>
            )}
          </div>
        </label>
      </div>

      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
              <Image
                src={image}
                alt={`Property image ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                onClick={() => setImages(images.filter((_, i) => i !== index))}
                className="absolute top-2 right-2 bg-white rounded-full p-1 hover:bg-gray-100"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
