'use client';

import { useState, useEffect, useActionState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAddPropertyModal } from '@addProperty/hooks/useAddPropertyModal';
import { useLoginModal } from '@auth/client/modalStore';
import { useAuthStore } from '@auth/client/authStore';
import Modal from '@sharedUI/Modal';
import StepCatogories from '@addProperty/components/steps/StepCatogories';
import StepPlaceTypes from '@addProperty/components/steps/StepPlaceTypes';
import StepLocation from '@addProperty/components/steps/StepLocation';
import StepBasicInfo from '@addProperty/components/steps/StepBasicInfo';
import StepDetails from '@addProperty/components/steps/StepDetails';
import StepPhotos from '@addProperty/components/steps/StepPhotos';
import { ensureDraftId, uploadImagesIfNeeded, publishProperty } from '@addProperty/services/publishProperty';
import type { ImagePreviewData, R2ImageData, PropertyDetailsType, BasicInfoType, LocationType, PropertyTagId } from '@addProperty/types';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

type SubmitState = { ok: boolean; error: string | null };

export default function AddPropertyModal() {
  const t = useTranslations('addProperty');
  const commonT = useTranslations('common');
  const TOTAL_STEPS = 6;

  const [currentStep, setCurrentStep] = useState(1);
  const [category, setCategory] = useState('');
  const [placeType, setPlaceType] = useState('');

  const [location, setLocation] = useState<LocationType>({
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    timezone: 'UTC',
  });

  const [basicInfo, setBasicInfo] = useState<BasicInfoType>({
    guests: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
  });

  const [imagePreviewData, setImagePreviewData] = useState<ImagePreviewData[]>([]);
  const [existingImages, setExistingImages] = useState<R2ImageData[]>([]);
  const [currentPropertyId, setCurrentPropertyId] = useState<string>('');

  const [propertyDetails, setPropertyDetails] = useState<PropertyDetailsType>({
    title: '',
    description: '',
    price: 0,
    property_tags: [] as PropertyTagId[],
  });

  const addPropertyModal = useAddPropertyModal();
  const loginModal = useLoginModal();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  // 编辑模式：回填
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
        property_tags: (property.property_tags ?? []) as PropertyTagId[],
      });

      if (property.images && property.images.length > 0) {
        const mappedImages: R2ImageData[] = property.images.map((img: any) => ({
          id: img.id?.toString(),
          objectKey: img.imageURL,
          fileUrl: img.imageURL,
          fileSize: 0,
          contentType: 'image/jpeg',
          isMain: img.is_main,
          order: img.order,
        }));
        setExistingImages(mappedImages);
      } else {
        setExistingImages([]);
      }
    } else if (!addPropertyModal.isOpen) {
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
        property_tags: [],
      });
      setCurrentPropertyId('');
    }
  }, [addPropertyModal.isOpen, addPropertyModal.isEditMode, addPropertyModal.propertyToEdit]);

  // 未登录拦截
  useEffect(() => {
    if (addPropertyModal.isOpen && !isAuthenticated) {
      addPropertyModal.onClose();
      loginModal.open();
    }
  }, [addPropertyModal.isOpen, isAuthenticated, addPropertyModal, loginModal]);

  const onBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
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
          propertyDetails.price > 0 &&
          (propertyDetails.property_tags?.length ?? 0) >= 1 &&
          (propertyDetails.property_tags?.length ?? 0) <= 5
        );
      default:
        return false;
    }
  };

  const onNext = () => {
    if (validateStep()) {
      if (currentStep < TOTAL_STEPS) setCurrentStep(prev => prev + 1);
    } else {
      alert(t('formIncomplete'));
    }
  };

  const submitAction = async (_prev: SubmitState): Promise<SubmitState> => {
    try {
      // 1) 决定要提交的 propertyId（编辑模式用已有 id，创建模式确保草稿 id）
      const targetId = addPropertyModal.isEditMode && addPropertyModal.propertyToEdit
        ? String(addPropertyModal.propertyToEdit.id)
        : await ensureDraftId({
            currentPropertyId,
            draftTitle: propertyDetails.title || t('draftTitle'),
            category,
            placeType,
            city: location.city,
          });

      if (!addPropertyModal.isEditMode && targetId !== currentPropertyId) {
        setCurrentPropertyId(targetId);
      }

      // 2) 处理图片（有新图则直传R2，否则沿用旧图）
      const imagesToSend = await uploadImagesIfNeeded(imagePreviewData, targetId, existingImages);

      // 3) 组装表单数据
      const payload = {
        title: propertyDetails.title,
        description: propertyDetails.description,
        price_per_night: propertyDetails.price,
        category,
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
        property_tags: propertyDetails.property_tags,
        images: imagesToSend,
      };

      // 4) 发布/更新
      const res = await publishProperty(targetId, payload);

      if (res.success) {
        toast.success(addPropertyModal.isEditMode ? t('updateSuccess') : t('createSuccess'));
        addPropertyModal.onClose();
        addPropertyModal.isEditMode ? router.refresh() : router.push('/');
        return { ok: true, error: null };
      } else {
        if (!addPropertyModal.isEditMode) toast.error(t('publishFailedDraftSaved'));
        return { ok: false, error: res.error || (addPropertyModal.isEditMode ? t('updateFailed') : t('createFailed')) };
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      return { ok: false, error: err?.message || 'An error occurred' };
    }
  };

  const [submitState, runSubmit, isSubmitting] = useActionState<SubmitState>(submitAction, { ok: false, error: null });

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex-grow">
        {currentStep === 1 && (
          <>
            <h2 className="mb-6 text-2xl font-semibold">{t('categoryDescription')}</h2>
            <StepCatogories selectedCategory={category} setSelectedCategory={setCategory} />
          </>
        )}

        {currentStep === 2 && (
          <>
            <h2 className="mb-6 text-2xl font-semibold">{t('placeTypeDescription')}</h2>
            <StepPlaceTypes selectedType={placeType} setSelectedType={setPlaceType} />
          </>
        )}

        {currentStep === 3 && (
          <>
            <h2 className="mb-6 text-2xl font-semibold">{t('locationDescription')}</h2>
            <p className="text-gray-500 mb-6">{t('locationNote')}</p>
            <StepLocation location={location} setLocation={setLocation} />
          </>
        )}

        {currentStep === 4 && (
          <>
            <h2 className="mb-6 text-2xl font-semibold">{t('basicsDescription')}</h2>
            <p className="text-gray-500 mb-6">{t('basicsNote')}</p>
            <StepBasicInfo basicInfo={basicInfo} setBasicInfo={setBasicInfo} />
          </>
        )}

        {currentStep === 5 && (
          <>
            <h2 className="mb-6 text-2xl font-semibold">{t('photosDescription')}</h2>
            <p className="text-gray-500 mb-6">{t('photosNote')}</p>
            <StepPhotos
              imagePreviewData={imagePreviewData}
              setImagePreviewData={setImagePreviewData}
              existingImages={existingImages}
              isEditMode={addPropertyModal.isEditMode}
            />
          </>
        )}

        {currentStep === 6 && (
          <>
            <h2 className="mb-6 text-2xl font-semibold">{t('detailsDescription')}</h2>
            <p className="text-gray-500 mb-6">{t('detailsNote')}</p>
            <StepDetails details={propertyDetails} setDetails={setPropertyDetails} />
          </>
        )}

        {submitState.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {submitState.error}
          </div>
        )}
      </div>

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
              onClick={currentStep === TOTAL_STEPS ? () => startTransition(() => runSubmit() ): onNext} 
              disabled={isSubmitting || !validateStep()}
              className={`px-6 py-2 rounded-lg ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : validateStep()
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting
                ? currentStep === TOTAL_STEPS
                  ? t('creating')
                  : commonT('loading')
                : currentStep === TOTAL_STEPS
                ? addPropertyModal.isEditMode
                  ? t('updateListing')
                  : t('createListing')
                : commonT('next')}
            </button>

            {isSubmitting && currentStep === TOTAL_STEPS && (
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
      title={addPropertyModal.isEditMode ? t('editTitle') : t('title')}
      open={addPropertyModal.isOpen}
      onClose={addPropertyModal.onClose}
      children={content}
    />
  );
}
