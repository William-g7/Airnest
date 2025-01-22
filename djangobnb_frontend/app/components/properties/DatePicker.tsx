import { useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface DatePickerProps {
    checkIn: Date | null;
    checkOut: Date | null;
    onChange: (dates: [Date | null, Date | null]) => void;
    bookedDates: string[];
}
const DatePicker: React.FC<DatePickerProps> = ({
    checkIn,
    checkOut,
    onChange,
    bookedDates
}) => {
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

    const renderDayContents = (day: number, date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        const isBooked = bookedDates.includes(dateString);

        return (
            <span className={isBooked ? 'date-tooltip' : ''}>
                {day}
            </span>
        );
    };

    return (
        <div className="border border-gray-300 rounded-lg">
            <div className="grid grid-cols-2 divide-x">
                <div className="p-4">
                    <div className="text-xs font-bold">CHECK-IN</div>
                    <ReactDatePicker
                        selected={checkIn}
                        onChange={handleCheckInChange}
                        minDate={new Date()}
                        excludeDates={bookedDates.map(date => new Date(date))}
                        placeholderText="Add date"
                        className="w-full border-none focus:ring-0 p-0 text-gray-600"
                        renderDayContents={renderDayContents}
                        dayClassName={date => {
                            const dateString = date.toISOString().split('T')[0];
                            return bookedDates.includes(dateString) ? 'react-datepicker__day--booked' : '';
                        }}
                    />
                </div>
                <div className="p-4">
                    <div className="text-xs font-bold">CHECKOUT</div>
                    <ReactDatePicker
                        selected={checkOut}
                        onChange={handleCheckOutChange}
                        minDate={checkIn || new Date()}
                        excludeDates={bookedDates.map(date => new Date(date))}
                        placeholderText="Add date"
                        className="w-full border-none focus:ring-0 p-0 text-gray-600"
                        disabled={!checkIn}
                        renderDayContents={renderDayContents}
                    />
                </div>
            </div>
        </div>
    );
};

export default DatePicker;