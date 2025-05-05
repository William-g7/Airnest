'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAddPropertyModal } from '../hooks/useAddPropertyModal'
import Modal from './Modal'
import Categories from '../addproperty/Catogories'
import PlaceTypes from '../addproperty/PlaceTypes'
import LocationForm from '../addproperty/LocationForm'
import BasicInfoForm from '../addproperty/BasicInfoForm'
import ImageUpload from '../addproperty/ImageUpload'
import PropertyDetailsForm from '../addproperty/PropertyDetailsForm'
import apiService from '@/app/services/apiService';
import { useTranslations } from 'next-intl'

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
        postalCode: ''
    });
    const [basicInfo, setBasicInfo] = useState({
        guests: 1,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1
    });
    const [images, setImages] = useState<string[]>([]);

    const [propertyDetails, setPropertyDetails] = useState({
        title: '',
        description: '',
        price: 0
    });

    const addPropertyModal = useAddPropertyModal();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const onBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    }

    const validateStep = () => {
        switch (currentStep) {
            case 1:
                return category !== '';
            case 2:
                return placeType !== '';
            case 3:
                return location.street !== '' &&
                    location.city !== '' &&
                    location.country !== '' &&
                    location.postalCode !== '';
            case 4:
                return true;
            case 5:
                return images.length > 0;
            case 6:
                return propertyDetails.title !== '' &&
                    propertyDetails.description !== '' &&
                    propertyDetails.price > 0;
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
    }

    const onSubmit = async () => {
        try {
            setIsLoading(true);
            setError("");
            console.log('Starting submission...');

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

            for (const [index, image] of images.entries()) {
                const file = await fetch(image).then(r => r.blob());
                formData.append('images', file, `image${index}.jpg`);
            }

            console.log('Sending request to API...');
            const response = await apiService.post('/api/properties/create/', formData);
            console.log('API Response:', response);

            if (response.success) {
                console.log('Success! Closing modal...');
                addPropertyModal.onClose();
                router.push('/');
                router.refresh();
            } else {
                console.log('API Error:', response);
                setError(response.errors || response.error || "Failed to create property. Please try again.");
            }
        } catch (error: any) {
            console.error('Submission error:', error);
            setError(error.message || "An error occurred while creating the property.");
        } finally {
            setIsLoading(false);
        }
    };

    const content = (
        <div className="flex flex-col h-full">
            <div className="flex-grow">
                {currentStep === 1 && (
                    <>
                        <h2 className='mb-6 text-2xl font-semibold'>
                            {t('categoryDescription')}
                        </h2>
                        <Categories selectedCategory={category} setSelectedCategory={setCategory} />
                    </>
                )}
                {currentStep === 2 && (
                    <>
                        <h2 className='mb-6 text-2xl font-semibold'>
                            {t('placeTypeDescription')}
                        </h2>
                        <PlaceTypes selectedType={placeType} setSelectedType={setPlaceType} />
                    </>
                )}
                {currentStep === 3 && (
                    <>
                        <h2 className='mb-6 text-2xl font-semibold'>
                            {t('locationDescription')}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {t('locationNote')}
                        </p>
                        <LocationForm location={location} setLocation={setLocation} />
                    </>
                )}
                {currentStep === 4 && (
                    <>
                        <h2 className='mb-6 text-2xl font-semibold'>
                            {t('basicsDescription')}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {t('basicsNote')}
                        </p>
                        <BasicInfoForm basicInfo={basicInfo} setBasicInfo={setBasicInfo} />
                    </>
                )}
                {currentStep === 5 && (
                    <>
                        <h2 className='mb-6 text-2xl font-semibold'>
                            {t('photosDescription')}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {t('photosNote')}
                        </p>
                        <ImageUpload images={images} setImages={setImages} />
                    </>
                )}
                {currentStep === 6 && (
                    <>
                        <h2 className='mb-6 text-2xl font-semibold'>
                            {t('detailsDescription')}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {t('detailsNote')}
                        </p>
                        <PropertyDetailsForm details={propertyDetails} setDetails={setPropertyDetails} />
                    </>
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

                    {/* Progress Indicator */}
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
                            ${isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                                validateStep() ? 'bg-gray-900 text-white hover:bg-gray-800' :
                                    'bg-gray-300 text-gray-500 cursor-not-allowed'}
                        `}
                    >
                        {isLoading ? commonT('loading') : currentStep === TOTAL_STEPS ? t('createListing') : commonT('next')}
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <Modal
            label={t('title')}
            isOpen={addPropertyModal.isOpen}
            close={addPropertyModal.onClose}
            content={content}
        />
    )
}