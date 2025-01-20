'use client'

import Select from 'react-select'
import { getName, getNames } from 'country-list'

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
    const countryOptions = getNames().map(country => ({
        value: country,
        label: country
    }));

    return (
        <div className="flex flex-col gap-4">
            <input
                type="text"
                placeholder="Street address"
                value={location.street}
                onChange={(e) => setLocation({ ...location, street: e.target.value })}
                className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
            <div className="grid grid-cols-2 gap-4">
                <input
                    type="text"
                    placeholder="City"
                    value={location.city}
                    onChange={(e) => setLocation({ ...location, city: e.target.value })}
                    className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                />
                <input
                    type="text"
                    placeholder="State/Province"
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
                    placeholder="Select a country"
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
                    placeholder="Postal code"
                    value={location.postalCode}
                    onChange={(e) => setLocation({ ...location, postalCode: e.target.value })}
                    className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                />
            </div>
        </div>
    );
};

export default LocationForm;