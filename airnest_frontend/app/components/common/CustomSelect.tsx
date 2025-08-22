'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

export interface SelectGroup {
  group: string;
  options: SelectOption[];
}

interface CustomSelectProps {
  options: SelectOption[] | SelectGroup[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  isSearchable?: boolean;
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
  maxHeight?: string;
  formatGroupLabel?: (group: string) => React.ReactNode;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  isSearchable = false,
  isLoading = false,
  className = '',
  disabled = false,
  maxHeight = '200px',
  formatGroupLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 将分组和非分组选项统一处理
  const flatOptions: SelectOption[] = React.useMemo(() => {
    if (!options.length) return [];
    
    // 检查是否是分组选项
    const isGrouped = 'group' in options[0];
    
    if (isGrouped) {
      return (options as SelectGroup[]).flatMap(group => group.options || []);
    }
    
    return options as SelectOption[];
  }, [options]);

  // 过滤选项
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;

    if ('group' in options[0]) {
      // 处理分组选项
      return (options as SelectGroup[])
        .map(group => ({
          ...group,
          options: group.options.filter(option =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            option.value.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter(group => group.options.length > 0);
    }

    // 处理普通选项
    return (options as SelectOption[]).filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.value.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // 获取选中选项的显示文本
  const selectedOption = flatOptions.find(option => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev < flatOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : flatOptions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && flatOptions[highlightedIndex]) {
            handleOptionSelect(flatOptions[highlightedIndex].value);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchQuery('');
          setHighlightedIndex(-1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, highlightedIndex, flatOptions]);

  // 自动聚焦搜索框
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, isSearchable]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  };

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  // 渲染选项
  const renderOptions = () => {
    if ('group' in options[0]) {
      // 渲染分组选项
      return (filteredOptions as SelectGroup[]).map((group, groupIndex) => (
        <div key={group.group}>
          <div className="px-3 py-2 text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">
            {formatGroupLabel ? formatGroupLabel(group.group) : group.group}
          </div>
          {group.options.map((option, optionIndex) => {
            const globalIndex = (filteredOptions as SelectGroup[])
              .slice(0, groupIndex)
              .reduce((acc, g) => acc + g.options.length, 0) + optionIndex;
            
            return (
              <div
                key={option.value}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                  highlightedIndex === globalIndex ? 'bg-blue-50 text-blue-600' : ''
                } ${value === option.value ? 'bg-blue-100 text-blue-700 font-medium' : ''}`}
                onClick={() => handleOptionSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(globalIndex)}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      ));
    }

    // 渲染普通选项
    return (filteredOptions as SelectOption[]).map((option, index) => (
      <div
        key={option.value}
        className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors ${
          highlightedIndex === index ? 'bg-blue-50 text-blue-600' : ''
        } ${value === option.value ? 'bg-blue-100 text-blue-700 font-medium' : ''}`}
        onClick={() => handleOptionSelect(option.value)}
        onMouseEnter={() => setHighlightedIndex(index)}
      >
        {option.label}
      </div>
    ));
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 选择器触发器 */}
      <div
        onClick={handleToggle}
        className={`
          relative w-full p-4 border rounded-lg cursor-pointer transition-all duration-200
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-black'}
          ${isOpen ? 'border-black ring-1 ring-black' : 'border-gray-300'}
          ${isLoading ? 'opacity-50' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={`flex-1 text-left ${!selectedOption ? 'text-gray-500' : 'text-gray-900'}`}>
            {displayText}
          </span>
          
          <div className="flex items-center space-x-2">
            {/* 清除按钮 */}
            {value && !disabled && (
              <button
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear selection"
              >
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
            
            {/* 加载指示器或下拉箭头 */}
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            ) : (
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* 下拉选项 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* 搜索框 */}
          {isSearchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
          
          {/* 选项列表 */}
          <div
            ref={listRef}
            className="overflow-y-auto"
            style={{ maxHeight }}
          >
            {Array.isArray(filteredOptions) && filteredOptions.length > 0 ? (
              renderOptions()
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                {searchQuery ? 'No options found' : 'No options available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;