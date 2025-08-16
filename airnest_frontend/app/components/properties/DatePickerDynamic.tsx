'use client';

import { lazy, Suspense } from 'react';

// 动态导入DatePicker组件
const DatePickerComponent = lazy(() => import('./DatePicker'));

interface DatePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onChange: (dates: [Date | null, Date | null]) => void;
  bookedDates: string[];
  partiallyBookedDates?: string[];
  propertyTimezone?: string;
}

// DatePicker加载骨架屏
const DatePickerSkeleton = () => (
  <div className="border border-gray-300 rounded-lg overflow-hidden">
    <div className="animate-pulse">
      {/* 顶部信息区域骨架 */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-6 w-6 bg-gray-200 rounded-full mr-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-5 w-5 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* 图例区域骨架 */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 rounded-full mr-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 rounded-full mr-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>

      {/* 日期选择区域骨架 */}
      <div className="grid grid-cols-2 divide-x border-t border-gray-200">
        <div className="p-4">
          <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="p-4">
          <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
      </div>

      {/* 日历区域骨架 */}
      <div className="p-4 border-t">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 rounded text-center"></div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// 动态DatePicker组件
const DatePickerDynamic: React.FC<DatePickerProps> = (props) => {
  return (
    <Suspense fallback={<DatePickerSkeleton />}>
      <DatePickerComponent {...props} />
    </Suspense>
  );
};

export default DatePickerDynamic;