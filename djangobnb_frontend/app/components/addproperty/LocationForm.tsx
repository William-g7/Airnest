'use client'

import Select from 'react-select'
import { getName, getNames } from 'country-list'
import { useTranslations } from 'next-intl'

interface LocationFormProps {
    location: LocationType;
    setLocation: (location: LocationType) => void;
}

interface LocationType {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
}

const LocationForm: React.FC<LocationFormProps> = ({ location, setLocation }) => {
    const t = useTranslations('addProperty');

    const countryOptions = getNames().map(country => ({
        value: country,
        label: country
    }));

    return (
        <div className="flex flex-col gap-4">
            <input
                type="text"
                placeholder={t('streetAddress')}
                value={location.street}
                onChange={(e) => setLocation({ ...location, street: e.target.value })}
                className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
            <div className="grid grid-cols-2 gap-4">
                <input
                    type="text"
                    placeholder={t('city')}
                    value={location.city}
                    onChange={(e) => setLocation({ ...location, city: e.target.value })}
                    className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                />
                <input
                    type="text"
                    placeholder={t('stateProvince')}
                    value={location.state}
                    onChange={(e) => setLocation({ ...location, state: e.target.value })}
                    className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Select
                    options={countryOptions}
                    value={location.country ? { value: location.country, label: location.country } : null}
                    onChange={(option) => setLocation({ ...location, country: option?.value || '' })}
                    placeholder={t('selectCountry')}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                        control: (base) => ({
                            ...base,
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            borderColor: '#e5e7eb',
                            '&:hover': {
                                borderColor: '#000'
                            }
                        })
                    }}
                />
                <input
                    type="text"
                    placeholder={t('postalCode')}
                    value={location.postalCode}
                    onChange={(e) => setLocation({ ...location, postalCode: e.target.value })}
                    className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                />
            </div>
        </div>
    );
};

export default LocationForm;