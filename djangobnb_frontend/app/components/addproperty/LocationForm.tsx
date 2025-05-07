'use client'

import { useState, useEffect } from 'react'
import Select from 'react-select'
import { getName, getNames } from 'country-list'
import { useTranslations } from 'next-intl'
import apiService from '@/app/services/apiService';

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
    timezone: string;
}

interface TimezoneOption {
    value: string;
    label: string;
}

interface TimezoneGroup {
    group: string;
    options: TimezoneOption[];
}

const LocationForm: React.FC<LocationFormProps> = ({ location, setLocation }) => {
    const t = useTranslations('addProperty');
    const [timezoneOptions, setTimezoneOptions] = useState<TimezoneGroup[]>([]);
    const [isLoadingTimezones, setIsLoadingTimezones] = useState(false);

    const countryOptions = getNames().map(country => ({
        value: country,
        label: country
    }));

    useEffect(() => {
        const fetchTimezones = async () => {
            setIsLoadingTimezones(true);
            try {
                const response = await apiService.get('/api/properties/timezones/');
                setTimezoneOptions(response);
            } catch (error) {
                console.error('Error fetching timezones:', error);
            } finally {
                setIsLoadingTimezones(false);
            }
        };

        fetchTimezones();
    }, []);

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

            <div className="mt-2">
                <label className="block text-sm font-medium text-gray-500 mb-2">
                    {t('timezone')} <span className="text-red-500">*</span>
                </label>
                <Select
                    options={timezoneOptions}
                    value={location.timezone ? { value: location.timezone, label: location.timezone.replace('_', ' ') } : null}
                    onChange={(option) => setLocation({ ...location, timezone: option?.value || 'UTC' })}
                    placeholder={isLoadingTimezones ? t('loadingTimezones') : t('selectTimezone')}
                    isLoading={isLoadingTimezones}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    formatGroupLabel={(group) => (
                        <div className="font-bold text-gray-800 py-1">
                            {group.group}
                        </div>
                    )}
                    styles={{
                        control: (base) => ({
                            ...base,
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            borderColor: '#e5e7eb',
                            '&:hover': {
                                borderColor: '#000'
                            }
                        }),
                        menu: (base) => ({
                            ...base,
                            zIndex: 9999
                        })
                    }}
                />
                <p className="mt-1 text-xs text-gray-500">
                    {t('timezoneHelp')}
                </p>
            </div>
        </div>
    );
};

export default LocationForm;