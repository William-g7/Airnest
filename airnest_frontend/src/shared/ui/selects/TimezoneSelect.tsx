'use client';

import React from 'react';
import Select, { SelectGroup } from '@sharedUI/Select';

interface TimezoneSelectProps {
    value: string;
    onChange: (v: string) => void;
    options: SelectGroup[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    loading?: boolean;
  }
  
export default function TimezoneSelect({
    value,
    onChange,
    options,
    placeholder = 'Select a timezone',
    className,
    disabled,
    loading,
  }: TimezoneSelectProps) {
  return (
    <Select
      options={options}
      value={value || null}
      onChange={v => onChange(v || 'UTC')}
      placeholder={placeholder}
      searchable
      loading={!!loading}
      className={className}
      disabled={disabled}
      maxHeight="260px"
      renderGroupLabel={(group) => (
        <div className="font-bold text-gray-800 py-1 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
          {group}
        </div>
      )}
    />
  );
};
