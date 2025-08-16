'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useDatePickerLocale } from './useDatePickerLocale';
import { convertUTCToTimezone, formatDateForAPI, addTimezoneToDate } from '../utils/dateUtils';

interface DatePickerConfigProps {
  locale: string;
  propertyTimezone?: string;
  bookedDates?: string[];
  partiallyBookedDates?: string[];
}

interface DatePickerConfigReturn {
  datePickerLocale: string;
  isLocaleLoaded: boolean;
  propertyTodayDate: Date;
  formatDateString: (dateStr: string) => Date;
  renderDayContents: (day: number, date: Date) => React.ReactElement;
  dayClassName: (date: Date) => string;
  timezoneLabel: string;
}

/**
 * DatePicker公共配置hook
 * 集中管理DatePicker的所有通用逻辑
 */
export const useDatePickerConfig = ({
  locale,
  propertyTimezone = 'UTC',
  bookedDates = [],
  partiallyBookedDates = [],
}: DatePickerConfigProps): DatePickerConfigReturn => {
  const datePickerT = useTranslations('datePicker');
  
  // 使用异步locale加载hook
  const { isLoaded: isLocaleLoaded, locale: datePickerLocale } = useDatePickerLocale(locale);

  // 设置CSS变量用于tooltip显示
  useEffect(() => {
    if (isLocaleLoaded) {
      document.documentElement.style.setProperty(
        '--date-tooltip-booked',
        `"${datePickerT('unavailable')}"`
      );
      document.documentElement.style.setProperty(
        '--date-tooltip-partial',
        `"${datePickerT('needConfirmation2')}"`
      );
    }
  }, [datePickerT, isLocaleLoaded]);

  // 计算房源当地的"今天"日期
  const propertyTodayDate = (() => {
    const now = new Date();
    return convertUTCToTimezone(now.toISOString(), propertyTimezone);
  })();

  // 时区标签
  const timezoneLabel = propertyTimezone !== 'UTC' ? `(${propertyTimezone.replace('_', '/')})` : '';

  // 格式化日期字符串为Date对象（带时区）
  const formatDateString = (dateStr: string): Date => {
    return addTimezoneToDate(dateStr, propertyTimezone);
  };

  // 渲染日期内容（处理预订状态显示）
  const renderDayContents = (day: number, date: Date) => {
    const dateString = formatDateForAPI(date);
    const isBooked = bookedDates.includes(dateString);
    const isPartiallyBooked = partiallyBookedDates.includes(dateString);

    if (isBooked) {
      return React.createElement('span', { className: 'date-tooltip' }, day);
    } else if (isPartiallyBooked) {
      return React.createElement('span', { className: 'date-tooltip-partial' }, day);
    } else {
      return React.createElement('span', {}, day);
    }
  };

  // 日期样式类名
  const dayClassName = (date: Date): string => {
    const dateString = formatDateForAPI(date);
    if (bookedDates.includes(dateString)) {
      return 'react-datepicker__day--booked';
    } else if (partiallyBookedDates.includes(dateString)) {
      return 'react-datepicker__day--partially-booked';
    }
    return '';
  };

  return {
    datePickerLocale,
    isLocaleLoaded,
    propertyTodayDate,
    formatDateString,
    renderDayContents,
    dayClassName,
    timezoneLabel,
  };
};