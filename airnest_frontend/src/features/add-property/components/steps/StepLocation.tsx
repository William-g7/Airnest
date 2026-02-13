'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import apiService from '@auth/client/clientApiService';
import CountrySelect from '@sharedUI/selects/CountrySelect';
import TimezoneSelect from '@sharedUI/selects/TimezoneSelect';
import type { SelectGroup } from '@sharedUI/Select';

interface StepLocationFormProps {
  location: StepLocationType;
  setLocation: (location: StepLocationType) => void;
}

interface StepLocationType {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  timezone: string;
}

export default function StepLocation({ location, setLocation }: StepLocationFormProps) {
  const t = useTranslations('addProperty');
  const [timezoneOptions, setTimezoneOptions] = useState<SelectGroup[]>([]);
  const [isLoadingTimezones, setIsLoadingTimezones] = useState(false);

  useEffect(() => {
    const fetchTimezones = async () => {
      setIsLoadingTimezones(true);
      try {
        // 期望后端返回形如：[{ group: 'America', options: [{ value: 'America/New_York', label: 'America/New_York' }, ...] }]
        const resp = await apiService.get('/api/properties/timezones/');
        // 简单兜底：确保是 SelectGroup[] 结构
        const groups: SelectGroup[] = Array.isArray(resp)
          ? resp.map((g: any) => ({
              group: String(g.group ?? ''),
              options: Array.isArray(g.options)
                ? g.options.map((o: any) => ({ value: String(o.value ?? ''), label: String(o.label ?? o.value ?? '') }))
                : [],
            }))
          : [];
        setTimezoneOptions(groups);
      } catch (error) {
        console.error('Error fetching timezones:', error);
        setTimezoneOptions([]);
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
        autoComplete="address-line1"
      />

      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder={t('city')}
          value={location.city}
          onChange={e => setLocation({ ...location, city: e.target.value })}
          className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          autoComplete="address-level2"
        />
        <input
          type="text"
          placeholder={t('stateProvince')}
          value={location.state}
          onChange={e => setLocation({ ...location, state: e.target.value })}
          className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          autoComplete="address-level1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* ✅ CountrySelect 现返回 ISO Code */}
        <CountrySelect
          value={location.country}
          onChange={countryCode => setLocation({ ...location, country: countryCode })}
          placeholder={t('selectCountry')}
        />

        <input
          type="text"
          placeholder={t('postalCode')}
          value={location.postalCode}
          onChange={e => setLocation({ ...location, postalCode: e.target.value })}
          className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          autoComplete="postal-code"
        />
      </div>

      <div className="mt-2">
        <label className="block text-sm font-medium text-gray-500 mb-2">
          {t('timezone')} <span className="text-red-500">*</span>
        </label>

        <TimezoneSelect
          value={location.timezone}
          onChange={tz => setLocation({ ...location, timezone: tz })}
          options={timezoneOptions}
          placeholder={isLoadingTimezones ? t('loadingTimezones') : t('selectTimezone')}
          loading={isLoadingTimezones}  // ✅ 新 wrapper 的 prop 名为 loading
        />

        <p className="mt-1 text-xs text-gray-500">{t('timezoneHelp')}</p>
      </div>
    </div>
  );
}
