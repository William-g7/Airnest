'use client';

import React from 'react';
import CustomSelect, { SelectGroup } from './CustomSelect';

interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectGroup[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

const TimezoneSelect: React.FC<TimezoneSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select a timezone',
  className,
  disabled = false,
  isLoading = false,
}) => {
  const handleChange = (selectedValue: string | null) => {
    onChange(selectedValue || 'UTC');
  };

  // 自定义分组标签渲染
  const formatGroupLabel = (group: string) => (
    <div className="font-bold text-gray-800 py-1 flex items-center">
      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
      {group}
    </div>
  );

  return (
    <CustomSelect
      options={options}
      value={value || null}
      onChange={handleChange}
      placeholder={placeholder}
      isSearchable={true}
      isLoading={isLoading}
      className={className}
      disabled={disabled}
      maxHeight="250px"
      formatGroupLabel={formatGroupLabel}
    />
  );
};

export default TimezoneSelect;