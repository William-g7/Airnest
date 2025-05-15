'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaTrash } from 'react-icons/fa';
import apiService from '../../services/apiService';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

export interface ImageData {
  id: number;
  imageURL: string;
  thumbnailURL?: string | null;
  is_main: boolean;
  order: number;
}

interface SortableImageItemProps {
  imageURL: string;
  thumbnailURL?: string | null;
  isMain: boolean;
  onDelete: () => void;
  id: number;
}

interface ImageManagerProps {
  propertyId: string;
  initialImages: ImageData[];
  onImagesChange?: (images: ImageData[]) => void;
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: DeleteConfirmModalProps) => {
  const t = useTranslations('property');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

// 单个可拖拽图片项
const SortableImageItem = ({
  imageURL,
  thumbnailURL,
  isMain,
  onDelete,
  id,
}: SortableImageItemProps) => {
  const t = useTranslations('property');
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const imageSrc = thumbnailURL ? thumbnailURL : imageURL ? imageURL : '/placeholder.jpg';
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group border border-gray-300 rounded-md overflow-hidden"
    >
      <div {...attributes} {...listeners} className="relative w-full h-40 cursor-move">
        <Image
          src={imageSrc}
          alt={`Property image ${id}`}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="group-hover:opacity-80 transition"
          key={`image-${id}-${imageSrc}`}
        />
      </div>

      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          onClick={handleDelete}
          className="p-2 rounded-full bg-white text-red-500 opacity-90 hover:opacity-100 transition"
          title={t('deletePicture')}
          type="button"
        >
          <FaTrash size={16} />
        </button>
      </div>

      {isMain && (
        <div className="absolute bottom-0 left-0 right-0 bg-airbnb opacity-80 text-white text-xs text-center py-1 z-10">
          {t('mainImage')}
        </div>
      )}
    </div>
  );
};

// 图片管理器组件
const ImageManager = ({ propertyId, initialImages, onImagesChange }: ImageManagerProps) => {
  const t = useTranslations('property');
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({
    reorder: false,
    delete: false,
  });
  const [error, setError] = useState<string | null>(null);
  
  // 删除确认状态
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  // 再次将后端传来的图片数据按照order排序
  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      const sortedImages = [...initialImages].sort((a, b) => a.order - b.order);
      setImages(sortedImages);
    }
  }, [initialImages]);

  // 初始化传感器，支持鼠标和键盘拖拽
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽逻辑，首先将进行拖拽后的图片数据进行排序
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldImages = [...images];

      const activeIndex = images.findIndex(item => item.id === active.id);
      const overIndex = images.findIndex(item => item.id === over.id);

      const newImages = arrayMove([...images], activeIndex, overIndex);

      const updatedImages = newImages.map((img, index) => ({
        ...img,
        is_main: index === 0,
        order: index,
      }));

      setImages(updatedImages);

      // 更新后端图片顺序
      try {
        setLoading(prev => ({ ...prev, reorder: true }));
        setError(null);

        const orderData = updatedImages.map((img, index) => ({
          id: img.id,
          order: index,
        }));

        const response = await apiService.updatePropertyImagesOrder(propertyId, orderData);

        if (response && Array.isArray(response)) {
          const backendImages = [...response]
            .map(img => ({
              id: img.id,
              imageURL: img.imageURL,
              thumbnailURL: img.thumbnailURL,
              is_main: img.is_main || img.order === 0,
              order: img.order,
            }))
            .sort((a, b) => a.order - b.order);

          setImages(backendImages);

          // 通知父组件图片变更
          if (onImagesChange) {
            onImagesChange(backendImages);
          }
        } else if (onImagesChange) {
          onImagesChange(updatedImages);
        }

        toast.success(t('imageOrderUpdated'));
      } catch (err) {
        console.error('更新图片顺序失败:', err);
        setError('Failed to update image order. Please try again.');
        toast.error(t('updateFailed'));
        setImages(oldImages);
      } finally {
        setLoading(prev => ({ ...prev, reorder: false }));
      }
    }
  };

  const handleDeleteImageRequest = (imageId: number) => {
    setImageToDelete(imageId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;
    
    try {
      setLoading(prev => ({ ...prev, delete: true }));
      setError(null);
      
      setDeleteConfirmOpen(false);

      await apiService.deletePropertyImage(propertyId, imageToDelete);

      const updatedImages = images.filter(img => img.id !== imageToDelete);

      if (updatedImages.length > 0) {
        updatedImages[0].is_main = true;
        for (let i = 1; i < updatedImages.length; i++) {
          updatedImages[i].is_main = false;
        }
      }

      setImages(updatedImages);

      if (onImagesChange) {
        onImagesChange(updatedImages);
      }

      toast.success(t('imageDeleted'));
    } catch (err) {
      console.error('删除图片失败:', err);
      setError('Failed to delete image. Please try again.');
      toast.error(t('deleteFailed'));
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
      setImageToDelete(null);
    }
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setImageToDelete(null);
  };

  if (images.length === 0) {
    return <p className="text-gray-500 italic">{t('noImages')}</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('manageImages')}</h3>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map(img => (
              <SortableImageItem
                key={img.id}
                id={img.id}
                imageURL={img.imageURL}
                thumbnailURL={img.thumbnailURL}
                isMain={img.is_main}
                onDelete={() => handleDeleteImageRequest(img.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {(loading.reorder || loading.delete) && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
      )}

      <p className="text-sm text-gray-500">{t('dragDropImages')}</p>
      
      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteImage}
        title={t('deletePictureTitle')}
        message={t('deleteImageConfirm')}
      />
    </div>
  );
};

export default ImageManager;
