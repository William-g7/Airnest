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

const TOTAL_STEPS = 6;

export default function AddPropertyModal() {
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
            alert('Please complete all required fields before proceeding.');
        }
    }

    const content = (
        <div className="flex flex-col h-full">
            <div className="flex-grow">
                {currentStep === 1 && (
                    <>
                        <h2 className='mb-6 text-2xl font-semibold'>
                            Which of these best describes your place?
                        </h2>
                        <Categories selectedCategory={category} setSelectedCategory={setCategory} />
                    </>
                )}
                {currentStep === 2 && (
                    <>
                        <h2 className='mb-6 text-2xl font-semibold'>
                            What type of place will guests have?
                        </h2>
                        <PlaceTypes selectedType={placeType} setSelectedType={setPlaceType} />
                    </>
                )}
                {currentStep === 3 && (
                    <>
                        <h2 className='mb-6 text-2xl font-semibold'>
                            Where's your place located?
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Your address is only shared with guests after they've made a reservation.
                        </p>
                        <LocationForm location={location} setLocation={setLocation} />
                    </>
                )}
                {currentStep === 4 && (
                    <>
                        <h2 className='mb-6 text-2xl font-semibold'>
                            Share some basics about your place
                        </h2>
                        <p className="text-gray-500 mb-6">
                            You can add more details later.
                        </p>
                        <BasicInfoForm basicInfo={basicInfo} setBasicInfo={setBasicInfo} />
                    </>
                )}
                {currentStep === 5 && (
                    <>
                        <h2 className='mb-6 text-2xl font-semibold'>
                            Add some photos of your place
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Show guests what your place looks like.
                        </p>
                        <ImageUpload images={images} setImages={setImages} />
                    </>
                )}
                {currentStep === 6 && (
                    <>
                        <h2 className='mb-6 text-2xl font-semibold'>
                            Now, set your price and add the final details
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Add a catchy title and description to attract guests.
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
                        Back
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
                        onClick={onNext}
                        disabled={!validateStep()}
                        className={`
                            px-6 py-2 rounded-lg
                            ${validateStep()
                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                        `}
                    >
                        {currentStep === TOTAL_STEPS ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <Modal
            label="Add Property"
            isOpen={addPropertyModal.isOpen}
            close={addPropertyModal.onClose}
            content={content}
        />
    )
}