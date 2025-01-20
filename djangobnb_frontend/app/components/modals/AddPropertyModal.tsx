'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAddPropertyModal } from '../hooks/useAddPropertyModal'
import Modal from './Modal'
import Categories from '../addproperty/Catogories'
import PlaceTypes from '../addproperty/PlaceTypes'
import LocationForm from '../addproperty/LocationForm'
import BasicInfoForm from '../addproperty/BasicInfoForm'

const TOTAL_STEPS = 5;

export default function AddPropertyModal() {
    const [currentStep, setCurrentStep] = useState(1);
    const [category, setCategory] = useState('');
    const [placeType, setPlaceType] = useState('');

    const addPropertyModal = useAddPropertyModal();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
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

    const onBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    }

    const onNext = () => {
        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(prev => prev + 1);
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
                            You'll add more details later, like bed types.
                        </p>
                        <BasicInfoForm basicInfo={basicInfo} setBasicInfo={setBasicInfo} />
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
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
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