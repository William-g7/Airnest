'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAddPropertyModal } from '../hooks/useAddPropertyModal';
import { useLoginModal } from '../hooks/useLoginModal';
import { useAuthStore } from '@/app/stores/authStore';
import Modal from './Modal';
import Categories from '../addproperty/Catogories';
import PlaceTypes from '../addproperty/PlaceTypes';
import LocationForm from '../addproperty/LocationForm';
import BasicInfoForm from '../addproperty/BasicInfoForm';
import PropertyDetailsForm from '../addproperty/PropertyDetailsForm';
import apiService from '@/app/services/apiService';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import ImagePreviewAndCompress from '../addproperty/ImagePreviewAndCompress';
import { R2ImageData } from '../../constants/upload';

const TOTAL_STEPS = 6;

export default function AddPropertyModal() {
  const t = useTranslations('addProperty');
  const commonT = useTranslations('common');
  const [currentStep, setCurrentStep] = useState(1);
  const [category, setCategory] = useState('');
  const [placeType, setPlaceType] = useState('');

  const [location, setLocation] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    timezone: 'UTC',
  });
  const [basicInfo, setBasicInfo] = useState({
    guests: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
  });
  const [imagePreviewData, setImagePreviewData] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<R2ImageData[]>([]);
  const [currentPropertyId, setCurrentPropertyId] = useState<string>('');

  const [propertyDetails, setPropertyDetails] = useState({
    title: '',
    description: '',
    price: 0,
  });

  const addPropertyModal = useAddPropertyModal();
  const loginModal = useLoginModal();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 移除了复杂的上传队列，使用简化的直接上传

  useEffect(() => {
    if (addPropertyModal.isOpen && addPropertyModal.isEditMode && addPropertyModal.propertyToEdit) {
      const property = addPropertyModal.propertyToEdit;

      setCategory(property.category);
      setPlaceType(property.place_type);
      setLocation({
        street: property.address,
        city: property.city,
        state: property.state,
        country: property.country,
        postalCode: property.postal_code,
        timezone: property.timezone || 'UTC',
      });
      setBasicInfo({
        guests: property.guests,
        bedrooms: property.bedrooms,
        beds: property.beds,
        bathrooms: property.bathrooms,
      });
      setPropertyDetails({
        title: property.title,
        description: property.description,
        price: property.price_per_night,
      });

      if (property.images && property.images.length > 0) {
        const mappedImages: R2ImageData[] = property.images.map(img => ({
          id: img.id?.toString(),
          objectKey: img.imageURL, // 使用imageURL作为objectKey的临时方案
          fileUrl: img.imageURL,
          fileSize: 0, // 无法从旧数据获取
          contentType: 'image/jpeg',
          isMain: img.is_main,
          order: img.order,
        }));
        setExistingImages(mappedImages);
      } else {
        setExistingImages([]);
      }
    } else {
      setCurrentStep(1);
      setCategory('');
      setPlaceType('');
      setLocation({
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        timezone: 'UTC',
      });
      setBasicInfo({
        guests: 1,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
      });
      setImagePreviewData([]);
      setExistingImages([]);
      setPropertyDetails({
        title: '',
        description: '',
        price: 0,
      });
      
      // 清理图片预览数据（modal关闭时）
    }
  }, [addPropertyModal.isOpen, addPropertyModal.isEditMode, addPropertyModal.propertyToEdit]);

  useEffect(() => {
    if (addPropertyModal.isOpen && !isAuthenticated) {
      addPropertyModal.onClose();
      loginModal.onOpen();
    }
  }, [addPropertyModal.isOpen, isAuthenticated, addPropertyModal, loginModal]);

  const onBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return category !== '';
      case 2:
        return placeType !== '';
      case 3:
        return (
          location.street !== '' &&
          location.city !== '' &&
          location.country !== '' &&
          location.postalCode !== '' &&
          location.timezone !== ''
        );
      case 4:
        return true;
      case 5:
        return addPropertyModal.isEditMode ? true : imagePreviewData.length > 0;
      case 6:
        return (
          propertyDetails.title !== '' &&
          propertyDetails.description !== '' &&
          propertyDetails.price > 0
        );
      default:
        return false;
    }
  };

  const onNext = () => {
    if (validateStep()) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      alert(t('formIncomplete'));
    }
  };

  const handleImagesChange = (updatedImages: R2ImageData[]) => {
    setExistingImages(updatedImages);
  };

  // 创建草稿房源并获取property_id
  const createDraftProperty = async (): Promise<string> => {
    if (currentPropertyId) return currentPropertyId;
    
    const draftData = {
      title: propertyDetails.title || t('draftTitle'),
      category: category,
      place_type: placeType,
      city: location.city,
    };
    
    const response = await apiService.post('/api/properties/draft/', draftData);
    if (response.success && response.data.id) {
      const propertyId = response.data.id.toString();
      setCurrentPropertyId(propertyId);
      return propertyId;
    }
    throw new Error(t('draftCreationFailed'));
  };

  // 简化的图片上传函数
  const uploadImagesToR2 = async (images: any[], propertyId: string): Promise<R2ImageData[]> => {
    if (images.length === 0) {
      return [];
    }

    const uploadedImages: R2ImageData[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const imgData = images[i];
      
      try {
        // 获取预签名URL
        const presignedResponse = await apiService.getPresignedUploadUrl({
          file_type: imgData.file.type,
          file_size: imgData.file.size,
          propertyId: propertyId,
        });
        
        if (!presignedResponse.success) {
          throw new Error(presignedResponse.error || '获取预签名URL失败');
        }
        
        // 直接上传到R2
        const response = await fetch(presignedResponse.data.upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': imgData.file.type,
          },
          body: imgData.file,
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`);
        }
        
        uploadedImages.push({
          objectKey: presignedResponse.data.object_key,
          fileUrl: presignedResponse.data.file_url,
          fileSize: imgData.file.size,
          contentType: imgData.file.type,
          order: i,
          isMain: i === 0
        });
        
      } catch (error) {
        console.error(`Failed to upload ${imgData.file.name}:`, error);
        throw new Error(`图片 ${imgData.file.name} 上传失败: ${(error as any)?.message || 'Unknown error'}`);
      }
    }
    
    return uploadedImages;
  };

  // 简化的提交逻辑
  const onSubmit = async () => {
    try {
      setIsLoading(true);
      setError('');

      let propertyId = currentPropertyId;
      
      // 如果是新建房源且没有propertyId，先创建草稿
      if (!addPropertyModal.isEditMode && !propertyId) {
        propertyId = await createDraftProperty();
      }

      // 上传图片（如果有的话）
      let uploadedImages: R2ImageData[] = [];
      if (imagePreviewData.length > 0) {
        uploadedImages = await uploadImagesToR2(imagePreviewData, propertyId);
      }

      // 准备房源数据
      const propertyData = {
        title: propertyDetails.title,
        description: propertyDetails.description,
        price_per_night: propertyDetails.price,
        category: category,
        place_type: placeType,
        guests: basicInfo.guests,
        bedrooms: basicInfo.bedrooms,
        beds: basicInfo.beds,
        bathrooms: basicInfo.bathrooms,
        country: location.country,
        state: location.state,
        city: location.city,
        address: location.street,
        postal_code: location.postalCode,
        timezone: location.timezone,
      };

      if (addPropertyModal.isEditMode && addPropertyModal.propertyToEdit) {
        // 编辑模式：更新房源信息
        const response = await apiService.patch(
          `/api/properties/${addPropertyModal.propertyToEdit.id}/`,
          propertyData
        );

        if (response.success) {
          // 如果有新上传的图片，更新图片信息
          if (uploadedImages.length > 0) {
            await apiService.patch(
              `/api/properties/${addPropertyModal.propertyToEdit.id}/`,
              { images: uploadedImages }
            );
          }
          
          toast.success(t('updateSuccess'));
          addPropertyModal.onClose();
          router.refresh();
        } else {
          setError(response.errors || response.error || t('updateFailed'));
        }
      } else {
        // 新建模式：发布草稿房源
        const publishData = {
          ...propertyData,
          images: uploadedImages
        };
        
        const response = await apiService.post(`/api/properties/${propertyId}/publish/`, publishData);

        if (response.success) {
          toast.success(t('createSuccess'));
          addPropertyModal.onClose();
          router.push('/');
          router.refresh();
        } else {
          // 发布失败，房源作为草稿保存
          setError(response.errors || response.error || t('createFailed'));
          toast.error(t('publishFailedDraftSaved'));
        }
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      setError(error?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex-grow">
        {currentStep === 1 && (
          <>
            <h2 className="mb-6 text-2xl font-semibold">{t('categoryDescription')}</h2>
            <Categories selectedCategory={category} setSelectedCategory={setCategory} />
          </>
        )}
        {currentStep === 2 && (
          <>
            <h2 className="mb-6 text-2xl font-semibold">{t('placeTypeDescription')}</h2>
            <PlaceTypes selectedType={placeType} setSelectedType={setPlaceType} />
          </>
        )}
        {currentStep === 3 && (
          <>
            <h2 className="mb-6 text-2xl font-semibold">{t('locationDescription')}</h2>
            <p className="text-gray-500 mb-6">{t('locationNote')}</p>
            <LocationForm location={location} setLocation={setLocation} />
          </>
        )}
        {currentStep === 4 && (
          <>
            <h2 className="mb-6 text-2xl font-semibold">{t('basicsDescription')}</h2>
            <p className="text-gray-500 mb-6">{t('basicsNote')}</p>
            <BasicInfoForm basicInfo={basicInfo} setBasicInfo={setBasicInfo} />
          </>
        )}
        {currentStep === 5 && (
          <>
            <h2 className="mb-6 text-2xl font-semibold">{t('photosDescription')}</h2>
            <p className="text-gray-500 mb-6">{t('photosNote')}</p>
            
            {/* 新的R2直传图片管理 */}
            <div className="space-y-6">
              <ImagePreviewAndCompress
                images={imagePreviewData}
                onImagesChange={setImagePreviewData}
                maxImages={5}
                maxSizeKB={5120} // 5MB
                quality={85}
                className=""
              />
              
              {/* 图片选择提示 */}
              {imagePreviewData.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    {t('imagesSelectedWillUpload', { count: imagePreviewData.length })}
                  </p>
                </div>
              )}
              
              {/* 编辑模式下显示已有图片 */}
              {addPropertyModal.isEditMode && existingImages.length > 0 && (
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
          </>
        )}
        {currentStep === 6 && (
          <>
            <h2 className="mb-6 text-2xl font-semibold">{t('detailsDescription')}</h2>
            <p className="text-gray-500 mb-6">{t('detailsNote')}</p>
            <PropertyDetailsForm details={propertyDetails} setDetails={setPropertyDetails} />
          </>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* Progress Bar and Navigation */}
      <div className="mt-8 border-t pt-4">
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className={`px-4 py-2 hover:underline ${currentStep === 1 ? 'text-gray-400' : 'text-gray-900'}`}
          >
            {commonT('previous')}
          </button>

          <div className="flex-grow mx-4">
            <div className="relative h-1 bg-gray-200 rounded">
              <div
                className="absolute h-1 bg-gray-900 rounded transition-all duration-300"
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-end">
            <button
              onClick={currentStep === TOTAL_STEPS ? onSubmit : onNext}
              disabled={isLoading || !validateStep()}
              className={`
                              px-6 py-2 rounded-lg
                              ${
                                isLoading
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : validateStep()
                                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }
                          `}
            >
              {isLoading
                ? currentStep === TOTAL_STEPS
                  ? t('creating')
                  : commonT('loading')
                : currentStep === TOTAL_STEPS
                  ? addPropertyModal.isEditMode
                    ? t('updateListing')
                    : t('createListing')
                  : commonT('next')}
            </button>
            
            {/* 发布时的加载状态显示 */}
            {isLoading && currentStep === TOTAL_STEPS && (
              <div className="mt-2 text-sm text-gray-600 flex items-center">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                <span>{addPropertyModal.isEditMode ? t('updating') : t('creating')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      label={addPropertyModal.isEditMode ? t('editTitle') : t('title')}
      isOpen={addPropertyModal.isOpen}
      close={addPropertyModal.onClose}
      content={content}
    />
  );
}
