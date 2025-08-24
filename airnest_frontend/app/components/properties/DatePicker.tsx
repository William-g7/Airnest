'use client';

import { useState } from 'react';
import { DayPicker} from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import '@/app/styles/daypicker.css';
import { useTranslations } from 'next-intl';
import { getLocaleState } from '@/app/stores/localeStore';
import { format } from 'date-fns';
import { enUS, zhCN, fr } from 'date-fns/locale';

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
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const { intlLocale } = getLocaleState();

  // 获取 date-fns locale
  const getDateFnsLocale = (locale: string) => {
    switch (locale) {
      case 'zh':
        return zhCN;
      case 'fr':
        return fr;
      default:
        return enUS;
    }
  };

  const dateLocale = getDateFnsLocale(intlLocale || 'en');

  // 解析已预订日期为Date对象数组
  const disabledDates = bookedDates.map(dateStr => new Date(dateStr));
  const partiallyDisabledDates = partiallyBookedDates.map(dateStr => new Date(dateStr));

  // 计算今天的日期（考虑时区）
  const today = new Date();
  
  // 时区标签
  const timezoneLabel = propertyTimezone ? `(${propertyTimezone})` : '';

  // Day picker modifiers
  const modifiers = {
    booked: disabledDates,
    partiallyBooked: partiallyDisabledDates,
  };

  // Day picker styles
  const modifiersStyles = {
    booked: { backgroundColor: '#fecaca', color: '#7f1d1d' }, // 红色背景，深红色文字
    partiallyBooked: { backgroundColor: '#fef3c7', color: '#92400e' }, // 黄色背景，深黄色文字
  };

  const handleCheckInChange = (date: Date | undefined) => {
    if (!date) return;
    
    if (checkOut && date >= checkOut) {
      onChange([date, null]);
    } else {
      onChange([date, checkOut]);
    }
    setShowCheckInPicker(false);
  };

  const handleCheckOutChange = (date: Date | undefined) => {
    if (!date) return;
    
    if (checkIn && date <= checkIn) {
      return;
    }
    onChange([checkIn, date]);
    setShowCheckOutPicker(false);
  };

  const handleCheckInClick = () => {
    setShowCheckInPicker(!showCheckInPicker);
    setShowCheckOutPicker(false);
  };

  const handleCheckOutClick = () => {
    if (!checkIn) {
      // 如果还没有选择入住日期，先选择入住日期
      setShowCheckInPicker(true);
      setShowCheckOutPicker(false);
      return;
    }
    setShowCheckOutPicker(!showCheckOutPicker);
    setShowCheckInPicker(false);
  };

  const toggleRules = () => {
    setIsRulesExpanded(!isRulesExpanded);
  };


  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* 日期输入框 */}
      <div className="grid grid-cols-2">
        {/* Check In */}
        <button
          onClick={handleCheckInClick}
          className="p-4 border-r border-gray-200 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
        >
          <div className="text-xs font-semibold text-gray-600 mb-1">{t('checkIn')}</div>
          <div className="text-sm font-medium">
            {checkIn ? format(checkIn, 'MMM dd', { locale: dateLocale }) : commonT('addDate')}
          </div>
        </button>

        {/* Check Out */}
        <button
          onClick={handleCheckOutClick}
          className="p-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
        >
          <div className="text-xs font-semibold text-gray-600 mb-1">{t('checkOut')}</div>
          <div className="text-sm font-medium">
            {checkOut ? format(checkOut, 'MMM dd', { locale: dateLocale }) : commonT('addDate')}
          </div>
        </button>
      </div>

      {/* Check-in DatePicker */}
      {showCheckInPicker && (
        <div className="border-t border-gray-200">
          {/* Booking Notes 折叠区域 */}
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
              mode="single"
              selected={checkIn || undefined}
              onSelect={handleCheckInChange}
              disabled={[
                { before: today },
                ...(checkOut ? [{ after: new Date(checkOut.getTime() - 24 * 60 * 60 * 1000) }] : []),
                ...disabledDates
              ]}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              locale={dateLocale}
              numberOfMonths={1}
              showOutsideDays
              className="rdp-custom"
            />
          </div>
        </div>
      )}

      {/* Check-out DatePicker */}
      {showCheckOutPicker && (
        <div className="border-t border-gray-200">
          {/* Booking Notes 折叠区域 */}
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
              mode="single"
              selected={checkOut || undefined}
              onSelect={handleCheckOutChange}
              disabled={[
                { before: checkIn ? new Date(checkIn.getTime() + 24 * 60 * 60 * 1000) : today },
                ...disabledDates
              ]}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              locale={dateLocale}
              numberOfMonths={1}
              showOutsideDays
              className="rdp-custom"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;