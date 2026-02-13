'use client';

import {useState, useMemo} from 'react';
import {DayPicker} from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import '@daysPicker/daypicker.css';
import {useTranslations, useLocale, useFormatter} from 'next-intl';
import {enUS, zhCN, fr as frFR} from 'date-fns/locale';

interface DaysPickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onChange: (dates: [Date | null, Date | null]) => void;
  bookedDates: string[];             // 建议为 'YYYY-MM-DD'
  partiallyBookedDates?: string[];   // 同上
  propertyTimezone?: string;         // 仅用于展示标签
}

function parseLocalISODate(isoDate: string): Date {
  // 仅针对 'YYYY-MM-DD'。避免时区偏移问题。
  // 如果传入完整 ISO（带时分秒和时区），请直接用 new Date(iso) 即可。
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return new Date(isoDate); // 回退：交给原生解析
  const [_, y, mo, d] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d));
}

export default function DaysPicker({
  checkIn,
  checkOut,
  onChange,
  bookedDates,
  partiallyBookedDates = [],
  propertyTimezone = 'UTC'
}: DaysPickerProps) {
  const t = useTranslations('property');
  const commonT = useTranslations('common');
  const datePickerT = useTranslations('datePicker');

  const locale = useLocale();          // 'en' | 'zh' | 'fr' ...
  const format = useFormatter();       // 用于把日期展示成 'MMM dd' 之类

  // next-intl -> date-fns locale 映射
  const dateFnsLocale = useMemo(() => {
    switch (locale) {
      case 'zh': return zhCN;
      case 'fr': return frFR;
      default:   return enUS;
    }
  }, [locale]);

  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  // 把“日期字符串”解析为本地日期对象，避免时区偏移
  const disabledDates = useMemo(
    () => bookedDates.map(parseLocalISODate),
    [bookedDates]
  );
  const partiallyDisabledDates = useMemo(
    () => partiallyBookedDates.map(parseLocalISODate),
    [partiallyBookedDates]
  );

  const today = useMemo(() => new Date(), []);

  const modifiers = {
    booked: disabledDates,
    partiallyBooked: partiallyDisabledDates
  };

  const modifiersStyles = {
    booked: {backgroundColor: '#fecaca', color: '#7f1d1d'},
    partiallyBooked: {backgroundColor: '#fef3c7', color: '#92400e'}
  } as const;

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
    if (checkIn && date <= checkIn) return;
    onChange([checkIn, date]);
    setShowCheckOutPicker(false);
  };

  const toggleRules = () => setIsRulesExpanded(v => !v);

  const timezoneLabel = propertyTimezone ? `(${propertyTimezone})` : '';

  // 用 next-intl 来格式化选中的日期（遵循你在 request.ts 配的时区/本地化）
  const checkInLabel = checkIn
    ? format.dateTime(checkIn, {month: 'short', day: '2-digit'})
    : commonT('addDate');

  const checkOutLabel = checkOut
    ? format.dateTime(checkOut, {month: 'short', day: '2-digit'})
    : commonT('addDate');

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* 顶部输入行 */}
      <div className="grid grid-cols-2">
        {/* Check In */}
        <button
          onClick={() => { setShowCheckInPicker(v => !v); setShowCheckOutPicker(false); }}
          className="p-4 border-r border-gray-200 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
        >
          <div className="text-xs font-semibold text-gray-600 mb-1">{t('checkIn')}</div>
          <div className="text-sm font-medium">{checkInLabel}</div>
        </button>

        {/* Check Out */}
        <button
          onClick={() => {
            if (!checkIn) { setShowCheckInPicker(true); setShowCheckOutPicker(false); return; }
            setShowCheckOutPicker(v => !v); setShowCheckInPicker(false);
          }}
          className="p-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
        >
          <div className="text-xs font-semibold text-gray-600 mb-1">{t('checkOut')}</div>
          <div className="text-sm font-medium">{checkOutLabel}</div>
        </button>
      </div>

      {/* Check-in DayPicker */}
      {showCheckInPicker && (
        <div className="border-t border-gray-200">
          {/* 备注折叠 */}
          <div className="text-xs">
            <button
              onClick={toggleRules}
              className="w-full p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between focus:outline-none transition-colors hover:bg-gray-100"
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="font-semibold text-sm">{datePickerT('bookingNotes')}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isRulesExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>

            {isRulesExpanded && (
              <div className="space-y-3 p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-start">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white mr-2">!</span>
                  <span>{datePickerT('bookingDates')}: {datePickerT('localTimeNote')} {timezoneLabel}</span>
                </div>
                <div className="flex items-start">
                  <span className="inline-block w-4 h-4 text-gray-500 mr-2 mt-0.5">⏱</span>
                  <span>{datePickerT('checkInTime')}: <span className="font-medium">15:00</span> {datePickerT('checkInAfter')}</span>
                </div>
                <div className="flex items-start">
                  <span className="inline-block w-4 h-4 text-gray-500 mr-2 mt-0.5">⏱</span>
                  <span>{datePickerT('checkOutTime')}: <span className="font-medium">11:00</span> {datePickerT('checkOutBefore')}</span>
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
                {before: today},
                ...(checkOut ? [{after: new Date(checkOut.getTime() - 24 * 60 * 60 * 1000)}] : []),
                ...disabledDates
              ]}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              locale={dateFnsLocale}
              numberOfMonths={1}
              showOutsideDays
              className="rdp-custom"
            />
          </div>
        </div>
      )}

      {/* Check-out DayPicker */}
      {showCheckOutPicker && (
        <div className="border-t border-gray-200">
          {/* 同上：备注折叠区 */}
          <div className="text-xs">
            <button
              onClick={toggleRules}
              className="w-full p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between focus:outline-none transition-colors hover:bg-gray-100"
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white mr-2">!</div>
                <span className="font-semibold text-sm">{datePickerT('bookingNotes')}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isRulesExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>

            {/* 图例 */}
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

            <div className="p-4">
              <DayPicker
                mode="single"
                selected={checkOut || undefined}
                onSelect={handleCheckOutChange}
                disabled={[
                  {before: checkIn ? new Date(checkIn.getTime() + 24 * 60 * 60 * 1000) : today},
                  ...disabledDates
                ]}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                locale={dateFnsLocale}
                numberOfMonths={1}
                showOutsideDays
                className="rdp-custom"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
