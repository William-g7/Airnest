'use client';

import React from 'react';
import Select, { SelectOption } from '@sharedUI/Select';
import { getData } from 'country-list';

interface CountrySelectProps {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
  }
  
 export default function CountrySelect({
    value,
    onChange,
    placeholder = 'Select a country',
    className,
    disabled = false,
  }: CountrySelectProps) {
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en';
  const collator = React.useMemo(() => new Intl.Collator(locale), [locale]);

  const options: SelectOption[] = React.useMemo(() => {
    return getData()
      .map(({ name, code }) => ({ value: code, label: name }))
      .sort((a, b) => collator.compare(a.label, b.label));
  }, [collator]);

  return (
    <Select
      options={options}
      value={value || null}
      onChange={v => onChange(v || '')}
      placeholder={placeholder}
      searchable
      className={className}
      disabled={disabled}
      clearable
      maxHeight="300px"
    />
  );
};
