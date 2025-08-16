'use client';

import { useState, useEffect } from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslations } from 'next-intl';
import { convertUTCToTimezone, formatDateForAPI, addTimezoneToDate } from '../../utils/dateUtils';
import { getLocaleState } from '@/app/stores/localeStore';

// 导入 date-fns 的语言包
import { zhCN, enUS, fr } from 'date-fns/locale';

// 注册支持的语言
registerLocale('zh-CN', zhCN);
registerLocale('en-US', enUS);
registerLocale('fr-FR', fr);

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

  const [propertyTodayDate, setPropertyTodayDate] = useState<Date>(new Date());
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);

  const { intlLocale } = getLocaleState();
  const datePickerLocale = intlLocale || 'en-US';

  useEffect(() => {
    // 设置CSS变量为翻译文本
    document.documentElement.style.setProperty(
      '--date-tooltip-booked',
      `"${datePickerT('unavailable')}"`
    );
    document.documentElement.style.setProperty(
      '--date-tooltip-partial',
      `"${datePickerT('needConfirmation2')}"`
    );
  }, [datePickerT]);

  // 计算房源当地的"今天"日期，防止因为时差订到当地已经过去的日期
  useEffect(() => {
    // 获取当前UTC时间并转换为房源时区的日期
    const now = new Date();
    const propertyToday = convertUTCToTimezone(now.toISOString(), propertyTimezone);
    setPropertyTodayDate(propertyToday);
  }, [propertyTimezone]);

  const timezoneLabel = propertyTimezone !== 'UTC' ? `(${propertyTimezone.replace('_', '/')})` : '';

  const handleCheckInChange = (date: Date | null) => {
    if (checkOut && date && date >= checkOut) {
      onChange([date, null]);
      return;
    }
    onChange([date, checkOut]);
  };

  const handleCheckOutChange = (date: Date | null) => {
    if (checkIn && date && date <= checkIn) {
      return;
    }
    onChange([checkIn, date]);
  };

  // 注意传给date picker组件的是带有当地时区的Date对象
  const formatDateString = (dateStr: string): Date => {
    return addTimezoneToDate(dateStr, propertyTimezone);
  };

  const renderDayContents = (day: number, date: Date) => {
    const dateString = formatDateForAPI(date);
    const isBooked = bookedDates.includes(dateString);
    const isPartiallyBooked = partiallyBookedDates.includes(dateString);

    if (isBooked) {
      return <span className="date-tooltip">{day}</span>;
    } else if (isPartiallyBooked) {
      return <span className="date-tooltip-partial">{day}</span>;
    } else {
      return <span>{day}</span>;
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
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-airbnb text-white mr-2">
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
          <>
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
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  {datePickerT('cleaningTime')}:{' '}
                  <span className="font-medium">2 {datePickerT('hours')}</span>{' '}
                  {datePickerT('deepCleaning')}
                </span>
              </div>
            </div>
          </>
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

      <div className="grid grid-cols-2 divide-x border-t border-gray-200">
        <div className="p-4">
          <div className="text-xs font-bold mb-1">{t('checkIn')}</div>
          <ReactDatePicker
            selected={checkIn}
            onChange={handleCheckInChange}
            minDate={propertyTodayDate} // 使用房源时区的今天作为最小日期
            excludeDates={bookedDates.map(formatDateString)} // 只完全排除已预订日期
            placeholderText={commonT('addDate')}
            className="w-full border-none focus:ring-0 p-0 text-gray-600"
            renderDayContents={renderDayContents}
            locale={datePickerLocale}
            dayClassName={date => {
              const dateString = formatDateForAPI(date);
              if (bookedDates.includes(dateString)) {
                return 'react-datepicker__day--booked';
              } else if (partiallyBookedDates.includes(dateString)) {
                return 'react-datepicker__day--partially-booked';
              }
              return '';
            }}
          />
        </div>
        <div className="p-4">
          <div className="text-xs font-bold mb-1">{t('checkOut')}</div>
          <ReactDatePicker
            selected={checkOut}
            onChange={handleCheckOutChange}
            minDate={checkIn || propertyTodayDate}
            excludeDates={bookedDates.map(formatDateString)}
            placeholderText={commonT('addDate')}
            className="w-full border-none focus:ring-0 p-0 text-gray-600"
            disabled={!checkIn}
            renderDayContents={renderDayContents}
            locale={datePickerLocale}
            dayClassName={date => {
              const dateString = formatDateForAPI(date);
              if (bookedDates.includes(dateString)) {
                return 'react-datepicker__day--booked';
              } else if (partiallyBookedDates.includes(dateString)) {
                return 'react-datepicker__day--partially-booked';
              }
              return '';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
