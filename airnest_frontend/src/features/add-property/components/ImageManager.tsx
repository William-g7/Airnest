'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ImagePreviewData } from '@addProperty/types';

interface ImageManagerProps {
  images: ImagePreviewData[];
  onImagesChange: (images: ImagePreviewData[]) => void;
  maxImages?: number;
  maxSizeKB?: number;
  enableReorder?: boolean;
  className?: string;
}

// 生成预览URL
const createPreview = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });

export default function ImageManager({
  images,
  onImagesChange,
  maxImages = 5,
  maxSizeKB = 5120,
  enableReorder = true,
  className = ''
}: ImageManagerProps) {
  const t = useTranslations('addProperty');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadInputId] = useState(() => `image-upload-${Math.random().toString(36).slice(2, 11)}`);

  // 新文件添加
  const handleFilesAdd = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const currentCount = images.length;
      const availableSlots = Math.max(0, maxImages - currentCount);

      if (availableSlots <= 0) {
        alert(t('maxImagesReached', { max: maxImages }));
        return;
      }

      const filesToProcess = fileArray.slice(0, availableSlots);
      const newImages: ImagePreviewData[] = [];
      const oversize: File[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        if (!file.type.startsWith('image/')) continue;

        if (file.size > maxSizeKB * 1024) {
          oversize.push(file);
          continue;
        }

        const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const preview = await createPreview(file);

        newImages.push({
          id,
          file,
          preview,
          order: currentCount + i,
        });
      }

      if (oversize.length > 0) {
        const msg =
          oversize.length === 1
            ? (() => {
                try {
                  return t('fileTooLarge', { name: oversize[0].name, maxKB: maxSizeKB });
                } catch {
                  return `“${oversize[0].name}” exceeds the ${maxSizeKB} KB limit`;
                }
              })()
            : (() => {
                try {
                  return t('filesTooLarge', { count: oversize.length, maxKB: maxSizeKB });
                } catch {
                  return `${oversize.length} files exceed the ${maxSizeKB} KB limit`;
                }
              })();
        alert(msg);
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
      }
    },
    [images, maxImages, maxSizeKB, onImagesChange, t]
  );

  // 删除图片
  const removeImage = useCallback(
    (imageId: string) => {
      const updated = images
        .filter((img) => img.id !== imageId)
        .map((img, idx) => ({ ...img, order: idx }));
      onImagesChange(updated);
    },
    [images, onImagesChange]
  );

  // 拖拽排序
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const reordered = [...images];
    const [dragged] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, dragged);

    const updated = reordered.map((img, idx) => ({ ...img, order: idx }));
    onImagesChange(updated);
    setDraggedIndex(null);
  };

  const ordered = useMemo(() => [...images].sort((a, b) => a.order - b.order), [images]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 预览网格 */}
      {ordered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ordered.map((imageData, index) => (
            <div
              key={imageData.id}
              draggable={enableReorder}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`relative group bg-gray-100 rounded-lg overflow-hidden aspect-square ${
                enableReorder ? 'cursor-move' : ''
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="relative w-full h-full">
                <Image src={imageData.preview} alt={`preview ${index + 1}`} fill className="object-cover" />
              </div>

              {/* 删除 */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => removeImage(imageData.id)}
                  className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                  title={t('deleteImage')}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 主图标识（第一张） */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded">
                  {t('mainPhoto')}
                </div>
              )}

              {/* 文件信息 */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                <div className="text-xs space-y-1">
                  <div className="truncate">{imageData.file.name}</div>
                  <div className="flex justify-between items-center">
                    <span>{formatFileSize(imageData.file.size)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 拖拽/选择区域 */}
      <div
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer.files;
          if (files.length > 0) handleFilesAdd(files);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) handleFilesAdd(e.target.files);
          }}
          className="hidden"
          id={uploadInputId}
        />
        <label htmlFor={uploadInputId} className="cursor-pointer block">
          <div className="text-gray-600">
            <p className="text-lg mb-2">📷</p>
            <p className="font-medium">{t('uploadPrompt')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('supportedFormats')}</p>
            <p className="text-sm text-gray-500">
              {t('uploadCount', { max: maxImages, current: images.length })}
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
