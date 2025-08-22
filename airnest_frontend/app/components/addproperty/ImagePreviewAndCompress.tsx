'use client';

import React, { useState, useCallback} from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface ImagePreviewData {
  id: string;
  file: File;
  originalFile: File;
  preview: string;
  compressed?: boolean;
  compressionRatio?: number;
  order: number;
}

interface ImagePreviewAndCompressProps {
  images: ImagePreviewData[];
  onImagesChange: (images: ImagePreviewData[]) => void;
  maxImages?: number;
  maxSizeKB?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  enableReorder?: boolean;
  className?: string;
}

// 图片压缩工具函数
const compressImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();

    img.onload = () => {
      // 计算新尺寸，保持宽高比
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('压缩失败'));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        file.type,
        quality / 100
      );
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
};

// 生成预览URL
const createPreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
};

export default function ImagePreviewAndCompress({
  images,
  onImagesChange,
  maxImages = 5,
  maxSizeKB = 5120,
  quality = 85,
  maxWidth = 1920,
  maxHeight = 1080,
  enableReorder = true,
  className = ''
}: ImagePreviewAndCompressProps) {
  const t = useTranslations('addProperty');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState<Set<string>>(new Set());
  const [uploadInputId] = useState(() => `image-upload-${Math.random().toString(36).substr(2, 9)}`);

  /**
   * 处理新文件添加
   */
  const handleFilesAdd = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const currentCount = images.length;
    const availableSlots = maxImages - currentCount;
    
    if (availableSlots <= 0) {
      alert(t('maxImagesReached', { max: maxImages }));
      return;
    }

    const filesToProcess = fileArray.slice(0, availableSlots);
    const newImages: ImagePreviewData[] = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      
      if (!file.type.startsWith('image/')) {
        continue;
      }

      const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const preview = await createPreview(file);

      const imageData: ImagePreviewData = {
        id,
        file,
        originalFile: file,
        preview,
        order: currentCount + i,
        compressed: false
      };

      newImages.push(imageData);
    }

    const updatedImages = [...images, ...newImages];
    onImagesChange(updatedImages);

    // 自动压缩大文件（适度压缩）
    newImages.forEach((imageData) => {
      if (imageData.file.size > 2048 * 1024) { // 大于2MB才压缩
        compressImageData(imageData.id);
      }
    });
  }, [images, maxImages, maxSizeKB, onImagesChange]);

  /**
   * 压缩指定图片
   */
  const compressImageData = useCallback(async (imageId: string) => {
    setIsCompressing(prev => new Set(prev).add(imageId));

    try {
      const imageData = images.find(img => img.id === imageId);
      if (!imageData) return;

      const compressedFile = await compressImage(
        imageData.originalFile,
        maxWidth,
        maxHeight,
        quality
      );

      const compressionRatio = (1 - compressedFile.size / imageData.originalFile.size) * 100;
      const preview = await createPreview(compressedFile);

      const updatedImages = images.map(img =>
        img.id === imageId
          ? {
              ...img,
              file: compressedFile,
              preview,
              compressed: true,
              compressionRatio
            }
          : img
      );

      onImagesChange(updatedImages);
    } catch (error) {
      console.error('压缩失败:', error);
      alert(t('compressionFailed'));
    } finally {
      setIsCompressing(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  }, [images, maxWidth, maxHeight, quality, onImagesChange]);


  /**
   * 删除图片
   */
  const removeImage = useCallback((imageId: string) => {
    const updatedImages = images
      .filter(img => img.id !== imageId)
      .map((img, index) => ({ ...img, order: index }));
    
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  /**
   * 拖拽排序处理
   */
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

    const reorderedImages = [...images];
    const [draggedImage] = reorderedImages.splice(draggedIndex, 1);
    reorderedImages.splice(dropIndex, 0, draggedImage);

    // 更新order
    const updatedImages = reorderedImages.map((img, index) => ({
      ...img,
      order: index
    }));

    onImagesChange(updatedImages);
    setDraggedIndex(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 图片预览网格 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images
            .sort((a, b) => a.order - b.order)
            .map((imageData, index) => (
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
                {/* 图片 */}
                <div className="relative w-full h-full">
                  <Image
                    src={imageData.preview}
                    alt={`预览 ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  
                  {/* 加载遮罩 */}
                  {isCompressing.has(imageData.id) && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-xs">{t('compressing')}</div>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* 删除按钮 */}
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

                {/* 主图标识 */}
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
                      {imageData.compressed && imageData.compressionRatio && imageData.compressionRatio > 10 && (
                        <span className="text-green-300">
                          {t('compressed')} {imageData.compressionRatio.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}


      {/* 文件拖拽区域 */}
      <div
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            handleFilesAdd(files);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) {
              handleFilesAdd(e.target.files);
            }
          }}
          className="hidden"
          id={uploadInputId}
        />
        <label
          htmlFor={uploadInputId}
          className="cursor-pointer block"
        >
          <div className="text-gray-600">
            <p className="text-lg mb-2">📷</p>
            <p className="font-medium">{t('uploadPrompt')}</p>
            <p className="text-sm text-gray-500 mt-1">
              {t('supportedFormats')}
            </p>
            <p className="text-sm text-gray-500">
              {t('uploadCount', { max: maxImages, current: images.length })}
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}