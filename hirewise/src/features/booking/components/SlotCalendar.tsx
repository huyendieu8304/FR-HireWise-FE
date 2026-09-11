import { useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { cn } from '@/utils/cn';

interface SlotCalendarProps {
  availableDates: Set<string>; // Set of 'YYYY-MM-DD' strings with available slots
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  minDate?: string;
  maxDate?: string;
}

const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function SlotCalendar({
  availableDates,
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
}: SlotCalendarProps) {
  // Current displayed year and month
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build calendar matrix
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  const pad = (n: number) => n.toString().padStart(2, '0');

  const cells = [];
  // Empty prefix cells
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(null);
  }
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    cells.push(dateStr);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full">
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-bold text-base text-neutral-900 capitalize">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors"
            title="Tháng trước"
          >
            <CaretLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors"
            title="Tháng sau"
          >
            <CaretRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {DAYS_OF_WEEK.map((d, idx) => (
          <div
            key={d}
            className={cn(
              'text-xs font-semibold py-1',
              idx === 0 ? 'text-red-500' : 'text-neutral-500'
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`empty-${idx}`} className="size-9" />;
          }

          const dayNumber = parseInt(dateStr.split('-')[2], 10);
          const hasAvailableSlots = availableDates.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;
          const isPast = minDate ? dateStr < minDate : dateStr < todayStr;
          const isAfterMax = maxDate ? dateStr > maxDate : false;
          const disabled = !hasAvailableSlots || isPast || isAfterMax;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                'relative flex size-9 items-center justify-center rounded-full text-sm font-medium transition-all mx-auto',
                disabled && 'text-neutral-300 cursor-not-allowed hover:bg-transparent',
                !disabled &&
                  !isSelected &&
                  'text-primary-700 font-semibold hover:bg-primary-50 active:scale-95 ring-1 ring-primary-200 bg-primary-50/40',
                isSelected && 'bg-primary-600 text-white font-bold shadow-md ring-2 ring-primary-600 ring-offset-2',
                isToday && !isSelected && 'underline font-extrabold decoration-primary-500 decoration-2'
              )}
            >
              <span>{dayNumber}</span>
              {hasAvailableSlots && !isSelected && (
                <span className="absolute bottom-1 size-1 rounded-full bg-primary-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
