'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import apiService from '@/app/services/apiService';
import CountrySelect from '@/app/components/common/CountrySelect';
import TimezoneSelect from '@/app/components/common/TimezoneSelect';
import { SelectGroup } from '@/app/components/common/CustomSelect';

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

// 使用 SelectGroup 类型替代 TimezoneGroup

const LocationForm: React.FC<LocationFormProps> = ({ location, setLocation }) => {
  const t = useTranslations('addProperty');
  const [timezoneOptions, setTimezoneOptions] = useState<SelectGroup[]>([]);
  const [isLoadingTimezones, setIsLoadingTimezones] = useState(false);

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
        onChange={e => setLocation({ ...location, street: e.target.value })}
        className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
      />
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder={t('city')}
          value={location.city}
          onChange={e => setLocation({ ...location, city: e.target.value })}
          className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
        />
        <input
          type="text"
          placeholder={t('stateProvince')}
          value={location.state}
          onChange={e => setLocation({ ...location, state: e.target.value })}
          className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <CountrySelect
          value={location.country}
          onChange={(country) => setLocation({ ...location, country })}
          placeholder={t('selectCountry')}
        />
        <input
          type="text"
          placeholder={t('postalCode')}
          value={location.postalCode}
          onChange={e => setLocation({ ...location, postalCode: e.target.value })}
          className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
        />
      </div>

      <div className="mt-2">
        <label className="block text-sm font-medium text-gray-500 mb-2">
          {t('timezone')} <span className="text-red-500">*</span>
        </label>
        <TimezoneSelect
          value={location.timezone}
          onChange={(timezone) => setLocation({ ...location, timezone })}
          options={timezoneOptions}
          placeholder={isLoadingTimezones ? t('loadingTimezones') : t('selectTimezone')}
          isLoading={isLoadingTimezones}
        />
        <p className="mt-1 text-xs text-gray-500">{t('timezoneHelp')}</p>
      </div>
    </div>
  );
};

export default LocationForm;
