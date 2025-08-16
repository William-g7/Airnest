'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { buildSearchQuery, parseSearchParams } from '@/app/utils/searchParams';
import { formatDateForAPI, formatLocalizedDate } from '@/app/utils/dateUtils';
import DatePickerDynamic from '@/app/components/properties/DatePickerDynamic';
import SearchIcon from '@/app/components/icons/SearchIcon';

/**
 * 增强型搜索表单组件
 * 基于GET表单 + 渐进增强的设计理念
 * 支持防抖搜索、无刷新导航等现代UX
 */
export default function EnhancedSearchForm() {
  const t = useTranslations('search');
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  
  // 解析当前URL参数作为初始状态
  const currentParams = parseSearchParams(searchParams);
  
  // 表单状态
  const [formData, setFormData] = useState({
    where: currentParams.where,
    checkIn: currentParams.checkIn,
    checkOut: currentParams.checkOut,
    guests: currentParams.guests
  });
  
  // UI状态
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isLocationDebouncing, setIsLocationDebouncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 输入框显示值（防抖专用）
  const [locationInputValue, setLocationInputValue] = useState(currentParams.where);
  
  // 防抖定时器
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  /**
   * 提交搜索 - 核心导航逻辑
   */
  const submitSearch = useCallback((data = formData, immediate = false) => {
    if (isSubmitting && !immediate) return;
    
    setIsSubmitting(true);
    
    // 构建新的查询参数
    const query = buildSearchQuery({
      where: data.where.trim(),
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      category: currentParams.category // 保持当前分类
    });
    
    // 无刷新导航到新URL
    const newUrl = query.toString() ? `/?${query.toString()}` : '/';
    router.replace(newUrl);
    
    // 关闭所有激活的字段
    setActiveField(null);
    
    setTimeout(() => setIsSubmitting(false), 300);
  }, [formData, currentParams.category, router, isSubmitting]);
  
  /**
   * 防抖搜索 - 仅用于地址输入
   */
  const debouncedLocationSearch = useCallback((value: string) => {
    setIsLocationDebouncing(true);
    
    // 清除之前的定时器
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // 设置新的防抖定时器
    debounceTimeoutRef.current = setTimeout(() => {
      const newData = { ...formData, where: value };
      setFormData(newData);
      submitSearch(newData);
      setIsLocationDebouncing(false);
    }, 500); // 500ms 防抖
  }, [submitSearch]); // 移除formData依赖
  
  /**
   * 处理地址输入
   */
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 立即更新输入框显示值
    setLocationInputValue(value);
    
    // 启动防抖搜索
    debouncedLocationSearch(value);
  };
  
  /**
   * 处理日期选择
   */
  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    const checkIn = start ? formatDateForAPI(start) : '';
    const checkOut = end ? formatDateForAPI(end) : '';
    
    const newData = { ...formData, checkIn, checkOut };
    setFormData(newData);
    
    // 日期选择完成后立即搜索
    if (start && end) {
      submitSearch(newData, true);
    }
  };
  
  /**
   * 处理客人数量变化
   */
  const handleGuestsChange = (delta: number) => {
    const newGuests = Math.max(1, Math.min(20, formData.guests + delta));
    const newData = { ...formData, guests: newGuests };
    setFormData(newData);
    
    // 客人数量变化后立即搜索
    submitSearch(newData, true);
  };
  
  /**
   * 处理表单提交 - GET表单的降级支持
   */
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 取消防抖，立即搜索
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    submitSearch(formData, true);
  };
  
  /**
   * 处理键盘事件
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // 取消防抖，立即搜索
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      submitSearch(formData, true);
    }
    
    if (e.key === 'Escape') {
      setActiveField(null);
    }
  };
  
  /**
   * 同步URL参数变化到输入框显示值
   */
  useEffect(() => {
    setLocationInputValue(currentParams.where);
  }, [currentParams.where]);

  /**
   * 清理副作用
   */
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  /**
   * 检测外部点击关闭下拉
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setActiveField(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <form 
        ref={formRef}
        onSubmit={handleFormSubmit}
        className="relative bg-white rounded-full shadow-lg border border-gray-200 overflow-hidden"
      >
        <div className="flex items-center divide-x divide-gray-200">
          {/* 地址输入 */}
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={() => setActiveField(activeField === 'where' ? null : 'where')}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="text-xs font-semibold text-gray-900 mb-1">
                {t('where')}
              </div>
              <div className="text-sm text-gray-600">
                {locationInputValue || t('anywhere')}
              </div>
            </button>
            
            <AnimatePresence>
              {activeField === 'where' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border z-50"
                >
                  <div className="p-4">
                    <input
                      ref={locationInputRef}
                      type="text"
                      name="where"
                      value={locationInputValue}
                      onChange={handleLocationChange}
                      onKeyDown={handleKeyDown}
                      placeholder={t('searchDestination')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb focus:border-transparent"
                      autoFocus
                    />
                    {isLocationDebouncing && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center">
                        <div className="animate-spin w-3 h-3 border border-gray-300 border-t-airbnb rounded-full mr-2"></div>
                        {t('searching')}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* 入住日期 */}
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={() => setActiveField(activeField === 'checkin' ? null : 'checkin')}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="text-xs font-semibold text-gray-900 mb-1">
                {t('checkIn')}
              </div>
              <div className="text-sm text-gray-600">
                {formData.checkIn ? formatLocalizedDate(new Date(formData.checkIn), 'UTC', 'short') : t('addDate')}
              </div>
            </button>
          </div>
          
          {/* 退房日期 */}
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={() => setActiveField(activeField === 'checkout' ? null : 'checkout')}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="text-xs font-semibold text-gray-900 mb-1">
                {t('checkOut')}
              </div>
              <div className="text-sm text-gray-600">
                {formData.checkOut ? formatLocalizedDate(new Date(formData.checkOut), 'UTC', 'short') : t('addDate')}
              </div>
            </button>
          </div>
          
          {/* 客人数量 */}
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={() => setActiveField(activeField === 'guests' ? null : 'guests')}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="text-xs font-semibold text-gray-900 mb-1">
                {t('who')}
              </div>
              <div className="text-sm text-gray-600">
                {formData.guests === 1 ? t('oneGuest') : t('guestCount', { count: formData.guests })}
              </div>
            </button>
            
            <AnimatePresence>
              {activeField === 'guests' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border z-50 w-80"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t('guests')}</div>
                        <div className="text-sm text-gray-600">{t('agesInfo')}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleGuestsChange(-1)}
                          disabled={formData.guests <= 1}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{formData.guests}</span>
                        <button
                          type="button"
                          onClick={() => handleGuestsChange(1)}
                          disabled={formData.guests >= 20}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* 搜索按钮 */}
          <div className="pr-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-airbnb hover:bg-airbnb-dark text-white p-4 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label={t('search')}
            >
              {isSubmitting ? (
                <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full"></div>
              ) : (
                <SearchIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        
        {/* 日期选择器弹出层 */}
        <AnimatePresence>
          {(activeField === 'checkin' || activeField === 'checkout') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-xl shadow-xl border z-50"
            >
              <div className="p-4">
                <DatePickerDynamic
                  checkIn={formData.checkIn ? new Date(formData.checkIn) : null}
                  checkOut={formData.checkOut ? new Date(formData.checkOut) : null}
                  onChange={handleDateChange}
                  bookedDates={[]}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 隐藏的input用于GET表单降级 */}
        <input type="hidden" name="location" value={locationInputValue} />
        <input type="hidden" name="check-in" value={formData.checkIn} />
        <input type="hidden" name="check-out" value={formData.checkOut} />
        <input type="hidden" name="guests" value={formData.guests.toString()} />
      </form>
    </div>
  );
}