'use client';

import React from 'react';
import { getNames } from 'country-list';
import CustomSelect, { SelectOption } from './CustomSelect';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  placeholder = 'Select a country',
  className,
  disabled = false,
}) => {
  // 生成国家选项，按字母顺序排序
  const countryOptions: SelectOption[] = React.useMemo(() => {
    return getNames()
      .sort()
      .map(country => ({
        value: country,
        label: country,
      }));
  }, []);

  const handleChange = (selectedValue: string | null) => {
    onChange(selectedValue || '');
  };

  return (
    <CustomSelect
      options={countryOptions}
      value={value || null}
      onChange={handleChange}
      placeholder={placeholder}
      isSearchable={true}
      className={className}
      disabled={disabled}
      maxHeight="300px"
    />
  );
};

export default CountrySelect;