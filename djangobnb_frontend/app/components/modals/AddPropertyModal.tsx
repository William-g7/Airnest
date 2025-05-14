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
import ImageUpload from '../addproperty/ImageUpload';
import PropertyDetailsForm from '../addproperty/PropertyDetailsForm';
import apiService from '@/app/services/apiService';
import { useTranslations } from 'next-intl';
import ImageManager from '../addproperty/ImageManager';
import toast from 'react-hot-toast';
import { ImageData } from '../addproperty/ImageManager';

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
  const [images, setImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ImageData[]>([]);

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
        const mappedImages = property.images.map(img => ({
          id: img.id,
          imageURL: img.imageURL,
          thumbnailURL: img.thumbnailURL,
          is_main: img.is_main,
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
      setImages([]);
      setExistingImages([]);
      setPropertyDetails({
        title: '',
        description: '',
        price: 0,
      });
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
        return addPropertyModal.isEditMode ? true : images.length > 0;
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

  const handleImagesChange = (updatedImages: ImageData[]) => {
    setExistingImages(updatedImages as any);
  };

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      setError('');

      const formData = new FormData();

      formData.append('title', propertyDetails.title);
      formData.append('description', propertyDetails.description);
      formData.append('price_per_night', propertyDetails.price.toString());
      formData.append('category', category);
      formData.append('place_type', placeType);
      formData.append('guests', basicInfo.guests.toString());
      formData.append('bedrooms', basicInfo.bedrooms.toString());
      formData.append('beds', basicInfo.beds.toString());
      formData.append('bathrooms', basicInfo.bathrooms.toString());
      formData.append('country', location.country);
      formData.append('state', location.state);
      formData.append('city', location.city);
      formData.append('address', location.street);
      formData.append('postal_code', location.postalCode);
      formData.append('timezone', location.timezone);

      if (addPropertyModal.isEditMode && addPropertyModal.propertyToEdit) {
        for (const [index, image] of images.entries()) {
          const file = await fetch(image).then(r => r.blob());
          formData.append('new_images', file, `image${index}.jpg`);
        }

        const response = await apiService.patch(
          `/api/properties/${addPropertyModal.propertyToEdit.id}/`,
          formData
        );

        if (response.success) {
          toast.success(t('updateSuccess'));
          addPropertyModal.onClose();
          router.refresh();
        } else {
          setError(response.errors || response.error || t('updateFailed'));
        }
      } else {
        for (const [index, image] of images.entries()) {
          const file = await fetch(image).then(r => r.blob());
          formData.append('images', file, `image${index}.jpg`);
        }

        const response = await apiService.post('/api/properties/create/', formData);

        if (response.success) {
          toast.success(t('createSuccess'));
          addPropertyModal.onClose();
          router.push('/');
          router.refresh();
        } else {
          setError(response.errors || response.error || t('createFailed'));
        }
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      setError(error.message || 'An error occurred');
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
            {addPropertyModal.isEditMode ? (
              <div className="space-y-8">
                {addPropertyModal.propertyToEdit && existingImages.length > 0 && (
                  <div className="mb-8">
                    <ImageManager
                      propertyId={addPropertyModal.propertyToEdit.id}
                      initialImages={existingImages}
                      onImagesChange={handleImagesChange}
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('uploadNewImages')}</h3>
                  <ImageUpload images={images} setImages={setImages} />
                </div>
              </div>
            ) : (
              <ImageUpload images={images} setImages={setImages} />
            )}
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
              ? commonT('loading')
              : currentStep === TOTAL_STEPS
                ? addPropertyModal.isEditMode
                  ? t('updateListing')
                  : t('createListing')
                : commonT('next')}
          </button>
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
