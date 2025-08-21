'use client';

import { useState, useMemo } from 'react';
import { DayPicker, DateRange, type Locale } from 'react-day-picker';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { zhCN, fr, enUS } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import { getLocaleState } from '@/app/stores/localeStore';
import 'react-day-picker/style.css';
import '@/app/styles/daypicker.css';

interface DatePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onChange: (dates: [Date | null, Date | null]) => void;
  bookedDates: string[];
  partiallyBookedDates?: string[];
  propertyTimezone?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  checkIn,
  checkOut,
  onChange,
  bookedDates,
  partiallyBookedDates = [],
  propertyTimezone = 'UTC',
}) => {
  const t = useTranslations('property');
  const commonT = useTranslations('common');
  const datePickerT = useTranslations('datePicker');

  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const { intlLocale } = getLocaleState();

  // 获取对应的 date-fns locale
  const dateLocale = useMemo((): Locale => {
    switch (intlLocale) {
      case 'zh':
        return zhCN;
      case 'fr':
        return fr;
      default:
        return enUS;
    }
  }, [intlLocale]);

  // 处理禁用日期
  const disabledDates = useMemo(() => {
    const disabled: Date[] = [];
    
    // 添加已预订的日期
    bookedDates.forEach(dateStr => {
      try {
        const date = parseISO(dateStr);
        if (!isNaN(date.getTime())) {
          disabled.push(date);
        }
      } catch (error) {
        console.warn(`Invalid date format: ${dateStr}`);
      }
    });

    return disabled;
  }, [bookedDates]);

  // 处理部分预订日期（用于特殊样式）
  const partiallyDisabledDates = useMemo(() => {
    const partial: Date[] = [];
    
    partiallyBookedDates.forEach(dateStr => {
      try {
        const date = parseISO(dateStr);
        if (!isNaN(date.getTime())) {
          partial.push(date);
        }
      } catch (error) {
        console.warn(`Invalid partial date format: ${dateStr}`);
      }
    });

    return partial;
  }, [partiallyBookedDates]);

  // 当前时区的今天
  const today = new Date();

  // 处理日期范围选择
  const selectedRange: DateRange | undefined = useMemo(() => {
    if (checkIn && checkOut) {
      return { from: checkIn, to: checkOut };
    } else if (checkIn) {
      return { from: checkIn, to: undefined };
    }
    return undefined;
  }, [checkIn, checkOut]);

  // 处理日期选择
  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange([null, null]);
      return;
    }

    if (range.from && range.to) {
      onChange([range.from, range.to]);
    } else if (range.from) {
      onChange([range.from, null]);
    } else {
      onChange([null, null]);
    }
  };

  // 时区标签
  const timezoneLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en', {
        timeZoneName: 'short',
        timeZone: propertyTimezone
      }).formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value || propertyTimezone;
    } catch {
      return propertyTimezone;
    }
  }, [propertyTimezone]);

  // 自定义日期渲染
  const modifiers = {
    booked: disabledDates,
    partiallyBooked: partiallyDisabledDates,
    selected: selectedRange ? (selectedRange.from && selectedRange.to ? 
      (date: Date) => isWithinInterval(date, { start: selectedRange.from!, end: selectedRange.to! }) : 
      false) : false
  };

  const modifiersStyles = {
    booked: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      fontWeight: 'bold'
    },
    partiallyBooked: {
      backgroundColor: '#fef3c7',
      color: '#d97706',
      fontWeight: 'bold'
    }
  };

  const toggleRules = () => {
    setIsRulesExpanded(!isRulesExpanded);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="text-xs">
        <button
          onClick={toggleRules}
          className="w-full p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between focus:outline-none transition-colors hover:bg-gray-100"
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="font-semibold text-sm">{datePickerT('bookingNotes')}</span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isRulesExpanded ? 'transform rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {isRulesExpanded && (
          <div className="space-y-3 p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {datePickerT('bookingDates')}: {datePickerT('localTimeNote')} {timezoneLabel}
              </span>
            </div>
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              <span>
                {datePickerT('checkInTime')}: <span className="font-medium">15:00</span>{' '}
                {datePickerT('checkInAfter')}
              </span>
            </div>
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M11 6a3 3 0 11-6 0 3 3 0 016 0zM14 17a6 6 0 00-12 0h12zM13 8a1 1 0 100 2h4a1 1 0 100-2h-4z" />
              </svg>
              <span>
                {datePickerT('checkOutTime')}: <span className="font-medium">11:00</span>{' '}
                {datePickerT('checkOutBefore')}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 px-4 py-2 border-b border-gray-200">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-200 rounded-full mr-1.5"></span>
            <span className="text-gray-600">{datePickerT('unavailable')}</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-yellow-200 rounded-full mr-1.5"></span>
            <span className="text-gray-600">{datePickerT('needConfirmation1')}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <DayPicker
          mode="range"
          locale={dateLocale}
          selected={selectedRange}
          onSelect={handleRangeSelect}
          disabled={[
            { before: today },
            ...disabledDates
          ]}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          numberOfMonths={2}
          showOutsideDays
          className="rdp-custom"
        />
      </div>

      {/* 显示选中的日期 */}
      {(checkIn || checkOut) && (
        <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <div className="text-xs font-bold mb-1">{t('checkIn')}</div>
              <div className="text-sm text-gray-600">
                {checkIn ? format(checkIn, 'PPP', { locale: dateLocale }) : commonT('addDate')}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold mb-1">{t('checkOut')}</div>
              <div className="text-sm text-gray-600">
                {checkOut ? format(checkOut, 'PPP', { locale: dateLocale }) : commonT('addDate')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;